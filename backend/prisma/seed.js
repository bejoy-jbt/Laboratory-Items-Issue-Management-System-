import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

// Connect to MongoDB using mongoose (bypasses Prisma transaction requirements)
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected for seeding...');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

async function main() {
  console.log('Seeding database...');
  await connectDB();

  const db = mongoose.connection.db;
  const usersCollection = db.collection('users');
  const labsCollection = db.collection('labs');
  const itemsCollection = db.collection('items');
  const issueRecordsCollection = db.collection('issue_records');

  // Fix existing documents that might have null or missing created_at fields
  console.log('Fixing existing documents...');
  const now = new Date();
  
  // Fix users
  await usersCollection.updateMany(
    { $or: [{ created_at: null }, { created_at: { $exists: false } }] },
    { $set: { created_at: now, updated_at: now } }
  );
  
  // Fix labs
  await labsCollection.updateMany(
    { $or: [{ created_at: null }, { created_at: { $exists: false } }] },
    { $set: { created_at: now, updated_at: now } }
  );
  
  // Fix items
  await itemsCollection.updateMany(
    { $or: [{ created_at: null }, { created_at: { $exists: false } }] },
    { $set: { created_at: now, updated_at: now } }
  );
  
  // Fix issue records
  await issueRecordsCollection.updateMany(
    { $or: [{ created_at: null }, { created_at: { $exists: false } }] },
    { $set: { created_at: now, updated_at: now } }
  );
  
  console.log('Existing documents fixed.');

  // Helper function to create or get user
  const createOrGetUser = async (email, userData) => {
    const existing = await usersCollection.findOne({ email });
    if (existing) {
      // Update existing user to ensure required fields are set
      if (!existing.created_at) {
        await usersCollection.updateOne(
          { _id: existing._id },
          { 
            $set: { 
              created_at: existing.createdAt || new Date(),
              updated_at: existing.updatedAt || new Date()
            }
          }
        );
      }
      console.log(`User ${email} already exists, skipping...`);
      return existing;
    }
    const now = new Date();
    const result = await usersCollection.insertOne({
      ...userData,
      created_at: now,
      updated_at: now
    });
    return await usersCollection.findOne({ _id: result.insertedId });
  };

  // Create Super Admin
  const superAdminPassword = await bcrypt.hash('superadmin123', 10);
  const superAdmin = await createOrGetUser('superadmin@lab.com', {
    name: 'Super Admin',
    email: 'superadmin@lab.com',
    password: superAdminPassword,
    role: 'SUPER_ADMIN'
  });

  console.log('Super Admin created:', superAdmin.email);

  // Create an Admin
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await createOrGetUser('admin@lab.com', {
    name: 'Admin User',
    email: 'admin@lab.com',
    password: adminPassword,
    role: 'ADMIN'
  });

  console.log('Admin created:', admin.email);

  // Create a Lab (check if it exists first)
  let lab = await labsCollection.findOne({ name: 'Computer Science Lab' });

  if (!lab) {
    const now = new Date();
    const labResult = await labsCollection.insertOne({
      name: 'Computer Science Lab',
      department: 'Computer Science',
      emp_id: admin._id,
      created_at: now,
      updated_at: now
    });
    lab = await labsCollection.findOne({ _id: labResult.insertedId });
    console.log('Lab created:', lab.name);
  } else {
    // Update existing lab to ensure required fields are set
    if (!lab.created_at) {
      await labsCollection.updateOne(
        { _id: lab._id },
        { 
          $set: { 
            created_at: lab.createdAt || new Date(),
            updated_at: lab.updatedAt || new Date()
          }
        }
      );
    }
    console.log('Lab already exists:', lab.name);
  }

  // Create a Lab Admin
  const labAdminPassword = await bcrypt.hash('labadmin123', 10);
  const labAdmin = await createOrGetUser('labadmin@lab.com', {
    name: 'Lab Admin',
    email: 'labadmin@lab.com',
    password: labAdminPassword,
    role: 'LAB_ADMIN',
    lab_id: lab._id
  });

  console.log('Lab Admin created:', labAdmin.email);

  // Create a User
  const userPassword = await bcrypt.hash('user123', 10);
  const user = await createOrGetUser('user@lab.com', {
    name: 'Test User',
    email: 'user@lab.com',
    password: userPassword,
    role: 'USER',
    lab_id: lab._id
  });

  console.log('User created:', user.email);

  // Create some sample items (only if they don't exist)
  const items = [
    {
      name: 'Laptop Dell XPS 15',
      category: 'Electronics',
      description: 'High-performance laptop for development',
      lab_id: lab._id,
      status: 'AVAILABLE'
    },
    {
      name: 'Microscope',
      category: 'Equipment',
      description: 'Digital microscope for research',
      lab_id: lab._id,
      status: 'AVAILABLE'
    },
    {
      name: 'Arduino Kit',
      category: 'Electronics',
      description: 'Complete Arduino starter kit',
      lab_id: lab._id,
      status: 'AVAILABLE'
    },
    {
      name: 'Oscilloscope',
      category: 'Equipment',
      description: 'Digital oscilloscope for signal analysis',
      lab_id: lab._id,
      status: 'MAINTENANCE'
    }
  ];

  for (const item of items) {
    const existing = await itemsCollection.findOne({
      name: item.name,
      lab_id: item.lab_id
    });
    
    if (!existing) {
      const now = new Date();
      await itemsCollection.insertOne({
        ...item,
        created_at: now,
        updated_at: now
      });
      console.log('Item created:', item.name);
    } else {
      // Update existing item to ensure required fields are set
      if (!existing.created_at) {
        await itemsCollection.updateOne(
          { _id: existing._id },
          { 
            $set: { 
              created_at: existing.createdAt || new Date(),
              updated_at: existing.updatedAt || new Date()
            }
          }
        );
      }
      console.log('Item already exists:', item.name);
    }
  }

  console.log('Seeding completed!');
  console.log('\n=== Login Credentials ===');
  console.log('Super Admin: superadmin@lab.com / superadmin123');
  console.log('Admin: admin@lab.com / admin123');
  console.log('Lab Admin: labadmin@lab.com / labadmin123');
  console.log('User: user@lab.com / user123');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await mongoose.connection.close();
  });

