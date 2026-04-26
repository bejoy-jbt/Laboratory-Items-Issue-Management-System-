import express from 'express';
import bcrypt from 'bcryptjs';
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

// All routes require authentication and LAB_ADMIN role
router.use(authenticate);
router.use(authorize('LAB_ADMIN'));

// Verify lab admin has access to the lab
const verifyLabAccess = async (req, res, next) => {
  try {
    if (!req.user.labId) {
      return res.status(403).json({ message: 'Lab Admin not assigned to any lab' });
    }
    req.labId = req.user.labId;
    next();
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

router.use(verifyLabAccess);

// Item Management - Add Item
router.post('/items', async (req, res) => {
  try {
    const { name, category, description } = req.body;

    if (!name || !category) {
      return res.status(400).json({ message: 'Name and category are required' });
    }

    // Create item using MongoDB directly to avoid transaction requirement
    const db = await getMongoConnection();
    const itemsCollection = db.collection('items');
    const now = new Date();
    
    const itemDoc = {
      name,
      category,
      description: description || null,
      lab_id: new mongoose.Types.ObjectId(req.labId),
      status: 'AVAILABLE',
      created_at: now,
      updated_at: now
    };
    
    const result = await itemsCollection.insertOne(itemDoc);
    const itemId = result.insertedId.toString();

    // Fetch the created item using Prisma
    const item = await prisma.item.findUnique({
      where: { id: itemId }
    });

    res.status(201).json({
      message: 'Item created successfully',
      item
    });
  } catch (error) {
    console.error('Create item error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Item Management - Update Item
router.put('/items/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;
    const { name, category, description, status } = req.body;

    // Verify item belongs to this lab
    const existingItem = await prisma.item.findUnique({
      where: { id: itemId }
    });

    if (!existingItem) {
      return res.status(404).json({ message: 'Item not found' });
    }

    if (existingItem.labId !== req.labId) {
      return res.status(403).json({ message: 'You do not have permission to modify this item' });
    }

    // Update item using MongoDB directly to avoid transaction requirement
    const db = await getMongoConnection();
    const itemsCollection = db.collection('items');
    const updateData = { updated_at: new Date() };
    
    if (name) updateData.name = name;
    if (category) updateData.category = category;
    if (description !== undefined) updateData.description = description;
    if (status && ['AVAILABLE', 'ISSUED', 'MAINTENANCE'].includes(status)) {
      updateData.status = status;
    }

    await itemsCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(itemId) },
      { $set: updateData }
    );

    // Fetch the updated item using Prisma
    const item = await prisma.item.findUnique({
      where: { id: itemId }
    });

    res.json({
      message: 'Item updated successfully',
      item
    });
  } catch (error) {
    console.error('Update item error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Item Management - Remove Item
router.delete('/items/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;

    // Verify item belongs to this lab
    const existingItem = await prisma.item.findUnique({
      where: { id: itemId },
      include: {
        _count: {
          select: {
            issueRecords: true
          }
        }
      }
    });

    if (!existingItem) {
      return res.status(404).json({ message: 'Item not found' });
    }

    if (existingItem.labId !== req.labId) {
      return res.status(403).json({ message: 'You do not have permission to delete this item' });
    }

    // Check if item has active issues
    if (existingItem.status === 'ISSUED') {
      return res.status(400).json({ message: 'Cannot delete item that is currently issued' });
    }

    await prisma.item.delete({
      where: { id: itemId }
    });

    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Delete item error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all items
router.get('/items', async (req, res) => {
  try {
    const items = await prisma.item.findMany({
      where: { labId: req.labId },
      include: {
        _count: {
          select: {
            issueRecords: true
          }
        }
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

// Get all users in the lab
router.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: {
        labId: req.labId,
        role: 'USER'
      },
      select: {
        id: true,
        name: true,
        email: true,
        imageUrl: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Issue item to user
router.post('/issue', async (req, res) => {
  try {
    const { itemId, userId, estimatedReturnTime } = req.body;

    if (!itemId || !userId) {
      return res.status(400).json({ message: 'Item ID and User ID are required' });
    }

    // Verify item belongs to this lab
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

    // Verify user belongs to this lab
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.labId !== req.labId) {
      return res.status(403).json({ message: 'User does not belong to your lab' });
    }

    // Create issue record using MongoDB directly to avoid transaction requirement
    const db = await getMongoConnection();
    const issueRecordsCollection = db.collection('issue_records');
    const now = new Date();
    
    const issueRecordDoc = {
      user_id: new mongoose.Types.ObjectId(userId),
      item_id: new mongoose.Types.ObjectId(itemId),
      lab_id: new mongoose.Types.ObjectId(req.labId),
      issue_time: now,
      estimated_return_time: estimatedReturnTime ? new Date(estimatedReturnTime) : null,
      notification_sent: false,
      created_at: now,
      updated_at: now
    };
    
    const result = await issueRecordsCollection.insertOne(issueRecordDoc);
    const issueRecordId = result.insertedId.toString();

    // Fetch the created issue record with relations using Prisma
    const issueRecord = await prisma.issueRecord.findUnique({
      where: { id: issueRecordId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        item: {
          select: {
            id: true,
            name: true,
            category: true
          }
        }
      }
    });

    // Update item status using MongoDB directly to avoid transaction requirement
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

    res.status(201).json({
      message: 'Item issued successfully',
      issueRecord
    });
  } catch (error) {
    console.error('Issue item error:', error);
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
        item: true,
        user: true
      }
    });

    if (!issueRecord) {
      return res.status(404).json({ message: 'Issue record not found' });
    }

    if (issueRecord.labId !== req.labId) {
      return res.status(403).json({ message: 'You do not have permission to manage this record' });
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
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
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

// View issued history
router.get('/issue-history', async (req, res) => {
  try {
    const issueRecords = await prisma.issueRecord.findMany({
      where: { labId: req.labId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        item: {
          select: {
            id: true,
            name: true,
            category: true
          }
        }
      },
      orderBy: {
        issueTime: 'desc'
      }
    });

    res.json({ issueRecords });
  } catch (error) {
    console.error('Get issue history error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get dashboard stats
router.get('/stats', async (req, res) => {
  try {
    const [items, issueRecords] = await Promise.all([
      prisma.item.findMany({
        where: { labId: req.labId }
      }),
      prisma.issueRecord.findMany({
        where: { labId: req.labId }
      })
    ]);

    const stats = {
      totalItems: items.length,
      availableItems: items.filter(i => i.status === 'AVAILABLE').length,
      issuedItems: items.filter(i => i.status === 'ISSUED').length,
      maintenanceItems: items.filter(i => i.status === 'MAINTENANCE').length,
      totalIssues: issueRecords.length,
      activeIssues: issueRecords.filter(r => !r.returnTime).length
    };

    res.json({ stats });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;

