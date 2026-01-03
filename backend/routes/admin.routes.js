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

// All routes require authentication and ADMIN role
router.use(authenticate);
router.use(authorize('ADMIN'));

// View labs assigned to this admin
router.get('/labs', async (req, res) => {
  try {
    const labs = await prisma.lab.findMany({
      where: { empId: req.user.id },
      include: {
        admin: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            items: true,
            users: true,
            issueRecords: true
          }
        }
      }
    });

    res.json({ labs });
  } catch (error) {
    console.error('Get labs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create Lab Admin
router.post('/create-lab-admin', async (req, res) => {
  try {
    const { name, email, password, labId } = req.body;

    if (!name || !email || !password || !labId) {
      return res.status(400).json({ message: 'Name, email, password, and labId are required' });
    }

    // Verify that the lab is assigned to this admin
    const lab = await prisma.lab.findUnique({
      where: { id: labId }
    });

    if (!lab) {
      return res.status(404).json({ message: 'Lab not found' });
    }

    if (lab.empId !== req.user.id) {
      return res.status(403).json({ message: 'You do not have permission to manage this lab' });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create lab admin using MongoDB directly to avoid transaction requirement
    const db = await getMongoConnection();
    const usersCollection = db.collection('users');
    const now = new Date();
    
    const userDoc = {
      name,
      email,
      password: hashedPassword,
      role: 'LAB_ADMIN',
      lab_id: new mongoose.Types.ObjectId(labId),
      created_at: now,
      updated_at: now
    };
    
    const result = await usersCollection.insertOne(userDoc);
    const userId = result.insertedId.toString();

    // Fetch the created lab admin using Prisma
    const labAdmin = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        labId: true,
        createdAt: true
      }
    });

    res.status(201).json({
      message: 'Lab Admin created successfully',
      labAdmin
    });
  } catch (error) {
    console.error('Create lab admin error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// View lab reports
router.get('/reports/:labId', async (req, res) => {
  try {
    const { labId } = req.params;

    // Verify that the lab is assigned to this admin
    const lab = await prisma.lab.findUnique({
      where: { id: labId }
    });

    if (!lab) {
      return res.status(404).json({ message: 'Lab not found' });
    }

    if (lab.empId !== req.user.id) {
      return res.status(403).json({ message: 'You do not have permission to view this lab' });
    }

    const [items, issueRecords, users] = await Promise.all([
      prisma.item.findMany({
        where: { labId },
        include: {
          _count: {
            select: {
              issueRecords: true
            }
          }
        }
      }),
      prisma.issueRecord.findMany({
        where: { labId },
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
      }),
      prisma.user.findMany({
        where: { labId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true
        }
      })
    ]);

    const stats = {
      totalItems: items.length,
      availableItems: items.filter(i => i.status === 'AVAILABLE').length,
      issuedItems: items.filter(i => i.status === 'ISSUED').length,
      maintenanceItems: items.filter(i => i.status === 'MAINTENANCE').length,
      totalUsers: users.length,
      totalIssues: issueRecords.length,
      activeIssues: issueRecords.filter(r => !r.returnTime).length
    };

    res.json({
      lab: {
        id: lab.id,
        name: lab.name,
        department: lab.department
      },
      stats,
      items,
      issueRecords,
      users
    });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all lab admins for a lab
router.get('/lab-admins/:labId', async (req, res) => {
  try {
    const { labId } = req.params;

    // Verify that the lab is assigned to this admin
    const lab = await prisma.lab.findUnique({
      where: { id: labId }
    });

    if (!lab) {
      return res.status(404).json({ message: 'Lab not found' });
    }

    if (lab.empId !== req.user.id) {
      return res.status(403).json({ message: 'You do not have permission to view this lab' });
    }

    const labAdmins = await prisma.user.findMany({
      where: {
        labId,
        role: 'LAB_ADMIN'
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true
      }
    });

    res.json({ labAdmins });
  } catch (error) {
    console.error('Get lab admins error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create User
router.post('/create-user', async (req, res) => {
  try {
    const { name, email, password, labId } = req.body;

    if (!name || !email || !password || !labId) {
      return res.status(400).json({ message: 'Name, email, password, and labId are required' });
    }

    // Verify that the lab is assigned to this admin
    const lab = await prisma.lab.findUnique({
      where: { id: labId }
    });

    if (!lab) {
      return res.status(404).json({ message: 'Lab not found' });
    }

    if (lab.empId !== req.user.id) {
      return res.status(403).json({ message: 'You do not have permission to manage this lab' });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user using MongoDB directly to avoid transaction requirement
    const db = await getMongoConnection();
    const usersCollection = db.collection('users');
    const now = new Date();
    
    const userDoc = {
      name,
      email,
      password: hashedPassword,
      role: 'USER',
      lab_id: new mongoose.Types.ObjectId(labId),
      created_at: now,
      updated_at: now
    };
    
    const result = await usersCollection.insertOne(userDoc);
    const userId = result.insertedId.toString();

    // Fetch the created user using Prisma
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        labId: true,
        createdAt: true
      }
    });

    res.status(201).json({
      message: 'User created successfully',
      user
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all users from labs managed by this admin
router.get('/users', async (req, res) => {
  try {
    // Get all labs assigned to this admin
    const labs = await prisma.lab.findMany({
      where: { empId: req.user.id },
      select: { id: true }
    });

    const labIds = labs.map(lab => lab.id);

    if (labIds.length === 0) {
      return res.json({ users: [] });
    }

    // Get all users from these labs
    const users = await prisma.user.findMany({
      where: {
        labId: { in: labIds },
        role: 'USER'
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        lab: {
          select: {
            id: true,
            name: true,
            department: true
          }
        }
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

// Edit User
router.put('/edit-user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, email, password, labId } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        lab: true
      }
    });

    if (!user || user.role !== 'USER') {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify that the lab is assigned to this admin
    if (user.lab.empId !== req.user.id) {
      return res.status(403).json({ message: 'You do not have permission to edit this user' });
    }

    // Check if email is being changed and if it's already taken
    if (email !== user.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email }
      });

      if (emailExists) {
        return res.status(400).json({ message: 'Email already exists' });
      }
    }

    // If labId is provided, verify it's a lab managed by this admin
    let newLabId = user.labId;
    if (labId && labId !== user.labId) {
      const newLab = await prisma.lab.findUnique({
        where: { id: labId }
      });

      if (!newLab) {
        return res.status(404).json({ message: 'Lab not found' });
      }

      if (newLab.empId !== req.user.id) {
        return res.status(403).json({ message: 'You do not have permission to assign to this lab' });
      }

      newLabId = labId;
    }

    // Update user using MongoDB directly
    const db = await getMongoConnection();
    const usersCollection = db.collection('users');
    
    const updateData = {
      name,
      email,
      updated_at: new Date()
    };

    // Only update password if provided
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateData.password = hashedPassword;
    }

    // Only update labId if provided and different
    if (labId && labId !== user.labId) {
      updateData.lab_id = new mongoose.Types.ObjectId(labId);
    }

    await usersCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(userId) },
      { $set: updateData }
    );

    // Fetch the updated user using Prisma
    const updatedUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        labId: true,
        createdAt: true,
        lab: {
          select: {
            id: true,
            name: true,
            department: true
          }
        }
      }
    });

    res.json({
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Edit user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete User
router.delete('/delete-user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        lab: true
      }
    });

    if (!user || user.role !== 'USER') {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify that the lab is assigned to this admin
    if (user.lab.empId !== req.user.id) {
      return res.status(403).json({ message: 'You do not have permission to delete this user' });
    }

    // Check if user has active issue records
    const activeIssues = await prisma.issueRecord.count({
      where: {
        userId: userId,
        returnTime: null
      }
    });

    if (activeIssues > 0) {
      return res.status(400).json({ 
        message: `Cannot delete user. User has ${activeIssues} active issue(s). Please return all items first.` 
      });
    }

    // Delete user using MongoDB directly
    const db = await getMongoConnection();
    const usersCollection = db.collection('users');
    
    await usersCollection.deleteOne({ _id: new mongoose.Types.ObjectId(userId) });

    res.json({
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all lab admins created by this admin (across all their labs)
router.get('/lab-admins', async (req, res) => {
  try {
    // Get all labs assigned to this admin
    const labs = await prisma.lab.findMany({
      where: { empId: req.user.id },
      select: { id: true }
    });

    const labIds = labs.map(lab => lab.id);

    if (labIds.length === 0) {
      return res.json({ labAdmins: [] });
    }

    // Get all lab admins from these labs
    const labAdmins = await prisma.user.findMany({
      where: {
        labId: { in: labIds },
        role: 'LAB_ADMIN'
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        lab: {
          select: {
            id: true,
            name: true,
            department: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({ labAdmins });
  } catch (error) {
    console.error('Get all lab admins error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Edit Lab Admin
router.put('/edit-lab-admin/:labAdminId', async (req, res) => {
  try {
    const { labAdminId } = req.params;
    const { name, email, password, labId } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }

    // Check if lab admin exists and belongs to a lab managed by this admin
    const labAdmin = await prisma.user.findUnique({
      where: { id: labAdminId },
      include: {
        lab: true
      }
    });

    if (!labAdmin || labAdmin.role !== 'LAB_ADMIN') {
      return res.status(404).json({ message: 'Lab admin not found' });
    }

    // Verify that the lab is assigned to this admin
    if (labAdmin.lab.empId !== req.user.id) {
      return res.status(403).json({ message: 'You do not have permission to edit this lab admin' });
    }

    // Check if email is being changed and if it's already taken
    if (email !== labAdmin.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email }
      });

      if (emailExists) {
        return res.status(400).json({ message: 'Email already exists' });
      }
    }

    // If labId is provided, verify it's a lab managed by this admin
    let newLabId = labAdmin.labId;
    if (labId && labId !== labAdmin.labId) {
      const newLab = await prisma.lab.findUnique({
        where: { id: labId }
      });

      if (!newLab) {
        return res.status(404).json({ message: 'Lab not found' });
      }

      if (newLab.empId !== req.user.id) {
        return res.status(403).json({ message: 'You do not have permission to assign to this lab' });
      }

      newLabId = labId;
    }

    // Update lab admin using MongoDB directly
    const db = await getMongoConnection();
    const usersCollection = db.collection('users');
    
    const updateData = {
      name,
      email,
      updated_at: new Date()
    };

    // Only update password if provided
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateData.password = hashedPassword;
    }

    // Only update labId if provided and different
    if (labId && labId !== labAdmin.labId) {
      updateData.lab_id = new mongoose.Types.ObjectId(labId);
    }

    await usersCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(labAdminId) },
      { $set: updateData }
    );

    // Fetch the updated lab admin using Prisma
    const updatedLabAdmin = await prisma.user.findUnique({
      where: { id: labAdminId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        labId: true,
        createdAt: true,
        lab: {
          select: {
            id: true,
            name: true,
            department: true
          }
        }
      }
    });

    res.json({
      message: 'Lab admin updated successfully',
      labAdmin: updatedLabAdmin
    });
  } catch (error) {
    console.error('Edit lab admin error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete Lab Admin
router.delete('/delete-lab-admin/:labAdminId', async (req, res) => {
  try {
    const { labAdminId } = req.params;

    // Check if lab admin exists and belongs to a lab managed by this admin
    const labAdmin = await prisma.user.findUnique({
      where: { id: labAdminId },
      include: {
        lab: true
      }
    });

    if (!labAdmin || labAdmin.role !== 'LAB_ADMIN') {
      return res.status(404).json({ message: 'Lab admin not found' });
    }

    // Verify that the lab is assigned to this admin
    if (labAdmin.lab.empId !== req.user.id) {
      return res.status(403).json({ message: 'You do not have permission to delete this lab admin' });
    }

    // Delete lab admin using MongoDB directly
    const db = await getMongoConnection();
    const usersCollection = db.collection('users');
    
    await usersCollection.deleteOne({ _id: new mongoose.Types.ObjectId(labAdminId) });

    res.json({
      message: 'Lab admin deleted successfully'
    });
  } catch (error) {
    console.error('Delete lab admin error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;

