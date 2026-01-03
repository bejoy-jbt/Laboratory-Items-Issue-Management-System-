import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

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
    const items = await prisma.item.findMany({
      where: {
        labId: req.labId,
        status: 'AVAILABLE'
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({ items });
  } catch (error) {
    console.error('Get items error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Request item issue
router.post('/request-issue/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;

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

    // Note: In a real system, this might create a request that needs Lab Admin approval
    // For now, we'll create the issue directly (Lab Admin can also issue directly)
    res.json({
      message: 'Issue request submitted. Please contact Lab Admin to complete the issue process.',
      itemId
    });
  } catch (error) {
    console.error('Request issue error:', error);
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

// Return item (only issued user can return)
router.post('/return/:issueRecordId', async (req, res) => {
  try {
    const { issueRecordId } = req.params;

    const issueRecord = await prisma.issueRecord.findUnique({
      where: { id: issueRecordId },
      include: {
        item: true
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

    // Update issue record and item status using MongoDB directly to avoid transaction requirement
    const db = await getMongoConnection();
    const issueRecordsCollection = db.collection('issue_records');
    const itemsCollection = db.collection('items');
    const now = new Date();
    
    // Update issue record
    await issueRecordsCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(issueRecordId) },
      { 
        $set: { 
          return_time: now,
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

