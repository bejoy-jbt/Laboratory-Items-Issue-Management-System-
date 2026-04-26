import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();
const prisma = new PrismaClient();

// Helper to get MongoDB connection
const getMongoConnection = async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI);
  }
  return mongoose.connection.db;
};

// All routes require authentication and USER role
router.use(authenticate);
router.use(authorize('USER'));

// Verify user has access to a lab
const verifyLabAccess = async (req, res, next) => {
  try {
    if (!req.user.labId) {
      return res.status(403).json({ message: 'User not assigned to any lab' });
    }
    req.labId = req.user.labId;
    next();
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

router.use(verifyLabAccess);

// View available items
router.get('/items', async (req, res) => {
  try {
    const includeIssued =
      req.query.includeIssued === 'true' ||
      req.query.includeIssued === '1' ||
      req.query.includeIssued === 'yes';

    const items = await prisma.item.findMany({
      where: includeIssued
        ? { labId: req.labId }
        : {
            labId: req.labId,
            status: 'AVAILABLE'
          },
      include: includeIssued
        ? {
            issueRecords: {
              where: { returnTime: null },
              orderBy: { issueTime: 'desc' },
              take: 1,
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true
                  }
                }
              }
            }
          }
        : undefined,
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Shape the response so frontend can show "issued by other user"
    const itemsWithActiveIssue = includeIssued
      ? items.map((item) => {
          const activeIssue = item.issueRecords?.[0]
            ? {
                id: item.issueRecords[0].id,
                issueTime: item.issueRecords[0].issueTime,
                estimatedReturnTime: item.issueRecords[0].estimatedReturnTime,
                user: item.issueRecords[0].user
              }
            : null;

          // Avoid returning full issueRecords array
          // eslint-disable-next-line no-unused-vars
          const { issueRecords, ...rest } = item;
          return { ...rest, activeIssue };
        })
      : items;

    res.json({ items: itemsWithActiveIssue });
  } catch (error) {
    console.error('Get items error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Issue item (user can issue items themselves with face verification)
router.post('/issue/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;
    const { estimatedReturnTime, faceDescriptor } = req.body;

    if (!estimatedReturnTime) {
      return res.status(400).json({ message: 'Estimated return time is required' });
    }

    const item = await prisma.item.findUnique({
      where: { id: itemId }
    });

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    if (item.labId !== req.labId) {
      return res.status(403).json({ message: 'Item does not belong to your lab' });
    }

    if (item.status !== 'AVAILABLE') {
      return res.status(400).json({ message: 'Item is not available for issue' });
    }

    // Check if user has any active issues
    const activeIssue = await prisma.issueRecord.findFirst({
      where: {
        userId: req.user.id,
        returnTime: null
      }
    });

    if (activeIssue) {
      return res.status(400).json({ 
        message: 'You have an active issue. Please return it before requesting a new item' 
      });
    }

    // Face verification is REQUIRED - verify the user's face matches their registered face
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { 
        name: true,
        faceDescriptor: true,
        imageUrl: true
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user has registered face data
    if (!user.faceDescriptor && !user.imageUrl) {
      return res.status(400).json({ 
        message: 'Face verification required. Please register your face image first.' 
      });
    }

    // Face verification is mandatory - require liveImage for verification
    const { liveImage } = req.body;
    
    if (!liveImage) {
      return res.status(400).json({ 
        message: 'Face verification is required. Please complete face verification before issuing items.' 
      });
    }

    // Perform backend face verification
    let verificationStatus = 'FAILED'; // Declare outside try block so it's accessible later
    try {
      const faceRecognitionService = await import('../services/faceRecognition.service.js');
      
      // Check if user.imageUrl is a base64 string or a file path
      let userImageUrl = null;
      if (user.imageUrl) {
        // If it's a base64 string (starts with "data:image"), pass it directly
        if (user.imageUrl.startsWith('data:image')) {
          userImageUrl = user.imageUrl;
        } else {
          // Otherwise, it's a file path - resolve it
          userImageUrl = join(__dirname, '..', user.imageUrl);
        }
      }
      
      const verificationResult = await faceRecognitionService.verifyFace(
        liveImage,
        userImageUrl,
        user.faceDescriptor || null,
        0.65 // Slightly more lenient threshold (0.65 instead of 0.6)
      );

      // Log verification details for debugging
      console.log(`Face verification result for user: ${user.name} (${req.user.id}):`, {
        success: verificationResult.success,
        is_match: verificationResult.is_match,
        distance: verificationResult.distance,
        threshold: verificationResult.threshold,
        confidence: verificationResult.confidence
      });

      // Check if face verification was successful
      if (!verificationResult.success || !verificationResult.is_match) {
        const distance = verificationResult.distance || 'unknown';
        const threshold = verificationResult.threshold || 0.65;
        console.log(`Face verification failed - Distance: ${distance}, Threshold: ${threshold}`);
        verificationStatus = 'FAILED';
        return res.status(403).json({ 
          message: `Face verification failed. You are not authorized to get this item. Only the registered user can issue items. (Distance: ${distance.toFixed(3)}, Threshold: ${threshold})` 
        });
      }

      verificationStatus = 'VERIFIED';
      console.log(`Face verification successful for user: ${user.name} (${req.user.id})`);
    } catch (verificationError) {
      console.error('Face verification error:', verificationError);
      verificationStatus = 'FAILED';
      return res.status(403).json({ 
        message: 'Face verification failed. You are not authorized to get this item.' 
      });
    }

    // Create issue record using MongoDB directly to avoid transaction requirement
    const db = await getMongoConnection();
    const issueRecordsCollection = db.collection('issue_records');
    const now = new Date();
    
    const issueRecordDoc = {
      user_id: new mongoose.Types.ObjectId(req.user.id),
      item_id: new mongoose.Types.ObjectId(itemId),
      lab_id: new mongoose.Types.ObjectId(req.labId),
      issue_time: now,
      estimated_return_time: new Date(estimatedReturnTime),
      notification_sent: false,
      issue_verification_status: verificationStatus, // Store face verification status
      created_at: now,
      updated_at: now
    };
    
    const result = await issueRecordsCollection.insertOne(issueRecordDoc);
    const issueRecordId = result.insertedId.toString();

    // Update item status using MongoDB directly
    const itemsCollection = db.collection('items');
    await itemsCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(itemId) },
      { 
        $set: { 
          status: 'ISSUED',
          updated_at: new Date()
        }
      }
    );

    // Fetch the created issue record with relations using Prisma
    const issueRecord = await prisma.issueRecord.findUnique({
      where: { id: issueRecordId },
      include: {
        item: {
          select: {
            id: true,
            name: true,
            category: true
          }
        }
      }
    });

    res.status(201).json({
      message: 'Item issued successfully',
      issueRecord
    });
  } catch (error) {
    console.error('Issue item error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// View issued items
router.get('/issued-items', async (req, res) => {
  try {
    const issueRecords = await prisma.issueRecord.findMany({
      where: {
        userId: req.user.id,
        labId: req.labId
      },
      include: {
        item: {
          select: {
            id: true,
            name: true,
            category: true,
            description: true
          }
        }
      },
      orderBy: {
        issueTime: 'desc'
      }
    });

    res.json({ issueRecords });
  } catch (error) {
    console.error('Get issued items error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Return item (only issued user can return) - Face verification required
router.post('/return/:issueRecordId', async (req, res) => {
  try {
    const { issueRecordId } = req.params;
    const { liveImage } = req.body; // Face verification image required

    const issueRecord = await prisma.issueRecord.findUnique({
      where: { id: issueRecordId },
      include: {
        item: true,
        user: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
            faceDescriptor: true
          }
        }
      }
    });

    if (!issueRecord) {
      return res.status(404).json({ message: 'Issue record not found' });
    }

    if (issueRecord.userId !== req.user.id) {
      return res.status(403).json({ message: 'You can only return items issued to you' });
    }

    if (issueRecord.returnTime) {
      return res.status(400).json({ message: 'Item has already been returned' });
    }

    // Face verification is REQUIRED for return - verify the user's face matches the original issuer
    if (!liveImage) {
      return res.status(400).json({ 
        message: 'Face verification is required. Please complete face verification before returning items.' 
      });
    }

    // Perform backend face verification
    let verificationStatus = 'FAILED';
    try {
      const faceRecognitionService = await import('../services/faceRecognition.service.js');
      
      // Get user's registered face image
      let userImageUrl = null;
      if (issueRecord.user.imageUrl) {
        if (issueRecord.user.imageUrl.startsWith('data:image')) {
          userImageUrl = issueRecord.user.imageUrl;
        } else {
          userImageUrl = join(__dirname, '..', issueRecord.user.imageUrl);
        }
      }
      
      const verificationResult = await faceRecognitionService.verifyFace(
        liveImage,
        userImageUrl,
        issueRecord.user.faceDescriptor || null,
        0.65
      );

      console.log(`Return face verification result for user: ${issueRecord.user.name}:`, {
        success: verificationResult.success,
        is_match: verificationResult.is_match,
        distance: verificationResult.distance,
        threshold: verificationResult.threshold,
        confidence: verificationResult.confidence
      });

      // Check if face verification was successful
      if (!verificationResult.success || !verificationResult.is_match) {
        const distance = verificationResult.distance || 'unknown';
        const threshold = verificationResult.threshold || 0.65;
        console.log(`Return face verification failed - Distance: ${distance}, Threshold: ${threshold}`);
        verificationStatus = 'FAILED';
        return res.status(403).json({ 
          message: `Face verification failed. Unauthorized user. Only the user who issued this item can return it. (Distance: ${distance.toFixed(3)}, Threshold: ${threshold})` 
        });
      }

      verificationStatus = 'VERIFIED';
      console.log(`Return face verification successful for user: ${issueRecord.user.name}`);
    } catch (verificationError) {
      console.error('Return face verification error:', verificationError);
      return res.status(403).json({ 
        message: 'Face verification failed. Unauthorized user.' 
      });
    }

    // Update issue record and item status using MongoDB directly to avoid transaction requirement
    const db = await getMongoConnection();
    const issueRecordsCollection = db.collection('issue_records');
    const itemsCollection = db.collection('items');
    const now = new Date();
    
    // Update issue record with return time and verification status
    await issueRecordsCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(issueRecordId) },
      { 
        $set: { 
          return_time: now,
          return_verification_status: verificationStatus, // Store face verification status
          updated_at: now
        }
      }
    );

    // Update item status
    await itemsCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(issueRecord.itemId) },
      { 
        $set: { 
          status: 'AVAILABLE',
          updated_at: now
        }
      }
    );

    // Fetch the updated issue record with relations using Prisma
    const updatedRecord = await prisma.issueRecord.findUnique({
      where: { id: issueRecordId },
      include: {
        item: {
          select: {
            id: true,
            name: true,
            category: true
          }
        }
      }
    });

    res.json({
      message: 'Item returned successfully',
      issueRecord: updatedRecord
    });
  } catch (error) {
    console.error('Return item error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user stats
router.get('/stats', async (req, res) => {
  try {
    const issueRecords = await prisma.issueRecord.findMany({
      where: {
        userId: req.user.id,
        labId: req.labId
      }
    });

    const stats = {
      totalIssues: issueRecords.length,
      activeIssues: issueRecords.filter(r => !r.returnTime).length,
      returnedIssues: issueRecords.filter(r => r.returnTime).length
    };

    res.json({ stats });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;

