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

// All routes require authentication and SUPER_ADMIN role
router.use(authenticate);
router.use(authorize('SUPER_ADMIN'));

// Create Admin
router.post('/create-admin', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin using MongoDB directly to avoid transaction requirement
    const db = await getMongoConnection();
    const usersCollection = db.collection('users');
    const now = new Date();
    
    const userDoc = {
      name,
      email,
      password: hashedPassword,
      role: 'ADMIN',
      created_at: now,
      updated_at: now
    };
    
    const result = await usersCollection.insertOne(userDoc);
    const userId = result.insertedId.toString();

    // Fetch the created admin using Prisma
    const admin = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    });

    res.status(201).json({
      message: 'Admin created successfully',
      admin
    });
  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create Lab
router.post('/create-lab', async (req, res) => {
  try {
    const { name, department, empId } = req.body;

    if (!name || !department || !empId) {
      return res.status(400).json({ message: 'Name, department, and empId (admin ID) are required' });
    }

    // Verify that empId is an ADMIN
    const admin = await prisma.user.findUnique({
      where: { id: empId }
    });

    if (!admin || admin.role !== 'ADMIN') {
      return res.status(400).json({ message: 'empId must be a valid Admin user ID' });
    }

    // Create lab using MongoDB directly to avoid transaction requirement
    const db = await getMongoConnection();
    const labsCollection = db.collection('labs');
    const now = new Date();
    
    const labDoc = {
      name,
      department,
      emp_id: new mongoose.Types.ObjectId(empId),
      created_at: now,
      updated_at: now
    };
    
    const result = await labsCollection.insertOne(labDoc);
    const labId = result.insertedId.toString();

    // Fetch the created lab with relations using Prisma
    const lab = await prisma.lab.findUnique({
      where: { id: labId },
      include: {
        admin: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    res.status(201).json({
      message: 'Lab created successfully',
      lab
    });
  } catch (error) {
    console.error('Create lab error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Assign Admin to Lab (update lab's empId)
router.put('/assign-admin/:labId', async (req, res) => {
  try {
    const { labId } = req.params;
    const { empId } = req.body;

    if (!empId) {
      return res.status(400).json({ message: 'empId (admin ID) is required' });
    }

    // Verify lab exists
    const lab = await prisma.lab.findUnique({
      where: { id: labId }
    });

    if (!lab) {
      return res.status(404).json({ message: 'Lab not found' });
    }

    // Verify that empId is an ADMIN
    const admin = await prisma.user.findUnique({
      where: { id: empId }
    });

    if (!admin || admin.role !== 'ADMIN') {
      return res.status(400).json({ message: 'empId must be a valid Admin user ID' });
    }

    // Update the lab using MongoDB directly to avoid transaction requirement
    const db = await getMongoConnection();
    const labsCollection = db.collection('labs');
    
    await labsCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(labId) },
      { 
        $set: { 
          emp_id: new mongoose.Types.ObjectId(empId),
          updated_at: new Date()
        }
      }
    );

    // Fetch the updated lab with relations
    const updatedLab = await prisma.lab.findUnique({
      where: { id: labId },
      include: {
        admin: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    res.json({
      message: 'Admin assigned to lab successfully',
      lab: updatedLab
    });
  } catch (error) {
    console.error('Assign admin error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all admins
router.get('/admins', async (req, res) => {
  try {
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true
      }
    });

    res.json({ admins });
  } catch (error) {
    console.error('Get admins error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all labs
router.get('/labs', async (req, res) => {
  try {
    const labs = await prisma.lab.findMany({
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
            users: true
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

// Edit Admin
router.put('/edit-admin/:adminId', async (req, res) => {
  try {
    const { adminId } = req.params;
    const { name, email, password } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }

    // Check if admin exists
    const existingAdmin = await prisma.user.findUnique({
      where: { id: adminId }
    });

    if (!existingAdmin || existingAdmin.role !== 'ADMIN') {
      return res.status(404).json({ message: 'Admin not found' });
    }

    // Check if email is being changed and if it's already taken
    if (email !== existingAdmin.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email }
      });

      if (emailExists) {
        return res.status(400).json({ message: 'Email already exists' });
      }
    }

    // Update admin using MongoDB directly
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

    await usersCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(adminId) },
      { $set: updateData }
    );

    // Fetch the updated admin using Prisma
    const updatedAdmin = await prisma.user.findUnique({
      where: { id: adminId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    });

    res.json({
      message: 'Admin updated successfully',
      admin: updatedAdmin
    });
  } catch (error) {
    console.error('Edit admin error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete Admin
router.delete('/delete-admin/:adminId', async (req, res) => {
  try {
    const { adminId } = req.params;

    // Check if admin exists
    const admin = await prisma.user.findUnique({
      where: { id: adminId }
    });

    if (!admin || admin.role !== 'ADMIN') {
      return res.status(404).json({ message: 'Admin not found' });
    }

    // Check if admin is assigned to any labs
    const labsCount = await prisma.lab.count({
      where: { empId: adminId }
    });

    if (labsCount > 0) {
      return res.status(400).json({ 
        message: `Cannot delete admin. Admin is assigned to ${labsCount} lab(s). Please reassign labs first.` 
      });
    }

    // Delete admin using MongoDB directly
    const db = await getMongoConnection();
    const usersCollection = db.collection('users');
    
    await usersCollection.deleteOne({ _id: new mongoose.Types.ObjectId(adminId) });

    res.json({
      message: 'Admin deleted successfully'
    });
  } catch (error) {
    console.error('Delete admin error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Edit Lab
router.put('/edit-lab/:labId', async (req, res) => {
  try {
    const { labId } = req.params;
    const { name, department, empId } = req.body;

    if (!name || !department) {
      return res.status(400).json({ message: 'Name and department are required' });
    }

    // Check if lab exists
    const lab = await prisma.lab.findUnique({
      where: { id: labId }
    });

    if (!lab) {
      return res.status(404).json({ message: 'Lab not found' });
    }

    // If empId is provided, verify it's a valid ADMIN
    if (empId) {
      const admin = await prisma.user.findUnique({
        where: { id: empId }
      });

      if (!admin || admin.role !== 'ADMIN') {
        return res.status(400).json({ message: 'empId must be a valid Admin user ID' });
      }
    }

    // Update lab using MongoDB directly
    const db = await getMongoConnection();
    const labsCollection = db.collection('labs');
    
    const updateData = {
      name,
      department,
      updated_at: new Date()
    };

    // Only update empId if provided
    if (empId) {
      updateData.emp_id = new mongoose.Types.ObjectId(empId);
    }

    await labsCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(labId) },
      { $set: updateData }
    );

    // Fetch the updated lab with relations using Prisma
    const updatedLab = await prisma.lab.findUnique({
      where: { id: labId },
      include: {
        admin: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    res.json({
      message: 'Lab updated successfully',
      lab: updatedLab
    });
  } catch (error) {
    console.error('Edit lab error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete Lab
router.delete('/delete-lab/:labId', async (req, res) => {
  try {
    const { labId } = req.params;

    // Check if lab exists
    const lab = await prisma.lab.findUnique({
      where: { id: labId },
      include: {
        _count: {
          select: {
            items: true,
            users: true,
            issueRecords: true
          }
        }
      }
    });

    if (!lab) {
      return res.status(404).json({ message: 'Lab not found' });
    }

    // Check if lab has any items, users, or issue records
    if (lab._count.items > 0 || lab._count.users > 0 || lab._count.issueRecords > 0) {
      return res.status(400).json({ 
        message: `Cannot delete lab. Lab has ${lab._count.items} item(s), ${lab._count.users} user(s), and ${lab._count.issueRecords} issue record(s). Please remove all related data first.` 
      });
    }

    // Delete lab using MongoDB directly
    const db = await getMongoConnection();
    const labsCollection = db.collection('labs');
    
    await labsCollection.deleteOne({ _id: new mongoose.Types.ObjectId(labId) });

    res.json({
      message: 'Lab deleted successfully'
    });
  } catch (error) {
    console.error('Delete lab error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get comprehensive reports - by admin or by lab
router.get('/reports', async (req, res) => {
  try {
    const { adminId, labId } = req.query;

    // If labId is provided, get report for specific lab
    if (labId) {
      const lab = await prisma.lab.findUnique({
        where: { id: labId },
        include: {
          admin: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      if (!lab) {
        return res.status(404).json({ message: 'Lab not found' });
      }

      const [items, issueRecords, users, labAdmins] = await Promise.all([
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
          where: {
            labId,
            role: 'USER'
          },
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true
          }
        }),
        prisma.user.findMany({
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
        })
      ]);

      const stats = {
        totalItems: items.length,
        availableItems: items.filter(i => i.status === 'AVAILABLE').length,
        issuedItems: items.filter(i => i.status === 'ISSUED').length,
        maintenanceItems: items.filter(i => i.status === 'MAINTENANCE').length,
        totalUsers: users.length,
        totalLabAdmins: labAdmins.length,
        totalIssues: issueRecords.length,
        activeIssues: issueRecords.filter(r => !r.returnTime).length,
        overdueIssues: issueRecords.filter(r => 
          !r.returnTime && 
          r.estimatedReturnTime && 
          new Date(r.estimatedReturnTime) < new Date()
        ).length
      };

      return res.json({
        type: 'lab',
        lab: {
          id: lab.id,
          name: lab.name,
          department: lab.department,
          admin: lab.admin
        },
        stats,
        items,
        issueRecords,
        users,
        labAdmins
      });
    }

    // If adminId is provided, get report for specific admin and all their labs
    if (adminId) {
      const admin = await prisma.user.findUnique({
        where: { id: adminId }
      });

      if (!admin || admin.role !== 'ADMIN') {
        return res.status(404).json({ message: 'Admin not found' });
      }

      const labs = await prisma.lab.findMany({
        where: { empId: adminId },
        include: {
          _count: {
            select: {
              items: true,
              users: true,
              issueRecords: true
            }
          }
        }
      });

      const labIds = labs.map(lab => lab.id);
      
      let allItems = [];
      let allIssueRecords = [];
      let allUsers = [];
      let allLabAdmins = [];

      if (labIds.length > 0) {
        [allItems, allIssueRecords, allUsers, allLabAdmins] = await Promise.all([
          prisma.item.findMany({
            where: { labId: { in: labIds } },
            include: {
              lab: {
                select: {
                  id: true,
                  name: true,
                  department: true
                }
              },
              _count: {
                select: {
                  issueRecords: true
                }
              }
            }
          }),
          prisma.issueRecord.findMany({
            where: { labId: { in: labIds } },
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
              },
              lab: {
                select: {
                  id: true,
                  name: true,
                  department: true
                }
              }
            },
            orderBy: {
              issueTime: 'desc'
            }
          }),
          prisma.user.findMany({
            where: {
              labId: { in: labIds },
              role: 'USER'
            },
            include: {
              lab: {
                select: {
                  id: true,
                  name: true,
                  department: true
                }
              }
            }
          }),
          prisma.user.findMany({
            where: {
              labId: { in: labIds },
              role: 'LAB_ADMIN'
            },
            include: {
              lab: {
                select: {
                  id: true,
                  name: true,
                  department: true
                }
              }
            }
          })
        ]);
      }

      const stats = {
        totalLabs: labs.length,
        totalItems: allItems.length,
        availableItems: allItems.filter(i => i.status === 'AVAILABLE').length,
        issuedItems: allItems.filter(i => i.status === 'ISSUED').length,
        maintenanceItems: allItems.filter(i => i.status === 'MAINTENANCE').length,
        totalUsers: allUsers.length,
        totalLabAdmins: allLabAdmins.length,
        totalIssues: allIssueRecords.length,
        activeIssues: allIssueRecords.filter(r => !r.returnTime).length,
        overdueIssues: allIssueRecords.filter(r => 
          !r.returnTime && 
          r.estimatedReturnTime && 
          new Date(r.estimatedReturnTime) < new Date()
        ).length
      };

      return res.json({
        type: 'admin',
        admin: {
          id: admin.id,
          name: admin.name,
          email: admin.email,
          createdAt: admin.createdAt
        },
        labs,
        stats,
        items: allItems,
        issueRecords: allIssueRecords,
        users: allUsers,
        labAdmins: allLabAdmins
      });
    }

    // If neither provided, return overview of all admins and labs
    const [admins, allLabs] = await Promise.all([
      prisma.user.findMany({
        where: { role: 'ADMIN' },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true
        }
      }),
      prisma.lab.findMany({
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
      })
    ]);

    // Get overall stats
    const allLabIds = allLabs.map(lab => lab.id);
    let overallStats = {
      totalAdmins: admins.length,
      totalLabs: allLabs.length,
      totalItems: 0,
      totalUsers: 0,
      totalLabAdmins: 0,
      totalIssues: 0,
      activeIssues: 0
    };

    let allUsers = [];
    let allLabAdmins = [];
    let allItems = [];

    if (allLabIds.length > 0) {
      const [itemsData, allIssueRecords, usersData, labAdminsData] = await Promise.all([
        prisma.item.findMany({
          where: { labId: { in: allLabIds } },
          include: {
            lab: {
              select: {
                id: true,
                name: true,
                department: true,
                admin: {
                  select: {
                    id: true,
                    name: true,
                    email: true
                  }
                }
              }
            },
            _count: {
              select: {
                issueRecords: true
              }
            }
          }
        }),
        prisma.issueRecord.findMany({
          where: { labId: { in: allLabIds } }
        }),
        prisma.user.findMany({
          where: {
            labId: { in: allLabIds },
            role: 'USER'
          },
          include: {
            lab: {
              select: {
                id: true,
                name: true,
                department: true,
                admin: {
                  select: {
                    id: true,
                    name: true,
                    email: true
                  }
                }
              }
            }
          }
        }),
        prisma.user.findMany({
          where: {
            labId: { in: allLabIds },
            role: 'LAB_ADMIN'
          },
          include: {
            lab: {
              select: {
                id: true,
                name: true,
                department: true
              }
            }
          }
        })
      ]);

      allItems = itemsData;
      allUsers = usersData;
      allLabAdmins = labAdminsData;

      overallStats = {
        totalAdmins: admins.length,
        totalLabs: allLabs.length,
        totalItems: allItems.length,
        availableItems: allItems.filter(i => i.status === 'AVAILABLE').length,
        issuedItems: allItems.filter(i => i.status === 'ISSUED').length,
        maintenanceItems: allItems.filter(i => i.status === 'MAINTENANCE').length,
        totalUsers: allUsers.length,
        totalLabAdmins: allLabAdmins.length,
        totalIssues: allIssueRecords.length,
        activeIssues: allIssueRecords.filter(r => !r.returnTime).length,
        overdueIssues: allIssueRecords.filter(r => 
          !r.returnTime && 
          r.estimatedReturnTime && 
          new Date(r.estimatedReturnTime) < new Date()
        ).length
      };
    }

    // Get lab count for each admin
    const adminsWithLabCount = await Promise.all(
      admins.map(async (admin) => {
        const labCount = await prisma.lab.count({
          where: { empId: admin.id }
        });
        return {
          ...admin,
          labCount
        };
      })
    );

    res.json({
      type: 'overview',
      stats: overallStats,
      admins: adminsWithLabCount,
      labs: allLabs,
      items: allItems,
      users: allUsers,
      labAdmins: allLabAdmins
    });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all items in the system
router.get('/items', async (req, res) => {
  try {
    const items = await prisma.item.findMany({
      include: {
        lab: {
          select: {
            id: true,
            name: true,
            department: true,
            admin: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
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

// Get all users in the system
router.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: {
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
            department: true,
            admin: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
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

// Create User
router.post('/create-user', async (req, res) => {
  try {
    const { name, email, password, labId } = req.body;

    if (!name || !email || !password || !labId) {
      return res.status(400).json({ message: 'Name, email, password, and labId are required' });
    }

    // Verify lab exists
    const lab = await prisma.lab.findUnique({
      where: { id: labId }
    });

    if (!lab) {
      return res.status(404).json({ message: 'Lab not found' });
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

    res.status(201).json({
      message: 'User created successfully',
      user
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;

