import cron from 'node-cron';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { sendOverdueNotification } from './email.service.js';

dotenv.config();

const prisma = new PrismaClient();
let isOverdueCheckRunning = false;

// Helper to get MongoDB connection
const getMongoConnection = async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI);
  }
  return mongoose.connection.db;
};

// Check for overdue items and send notifications
export const checkOverdueItems = async () => {
  if (isOverdueCheckRunning) {
    console.log('⏭️  Previous overdue check is still running. Skipping this cycle.');
    return { success: true, skipped: true, reason: 'Previous check still running' };
  }

  isOverdueCheckRunning = true;
  console.log('\n========================================');
  console.log('🔍 STARTING OVERDUE ITEMS CHECK');
  console.log('========================================\n');
  
  try {
    // Step 1: Check email configuration
    console.log('📧 Step 1: Checking email configuration...');
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.error('❌ ERROR: Email not configured!');
      console.error('   Missing EMAIL_USER or EMAIL_PASSWORD in .env');
      console.error('   EMAIL_USER:', process.env.EMAIL_USER ? '✅ Set' : '❌ Missing');
      console.error('   EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '✅ Set' : '❌ Missing');
      return { success: false, error: 'Email not configured' };
    }
    console.log('✅ Email configuration found');
    console.log('   EMAIL_USER:', process.env.EMAIL_USER);
    
    // Step 2: Get current time and query database
    console.log('\n📅 Step 2: Querying database for overdue items...');
    const now = new Date();
    console.log('   Current time:', now.toISOString());
    
    // DEBUG: First, let's see ALL active issue records (not returned) using raw MongoDB
    console.log('\n   🔍 DEBUG: Checking all active issue records (raw MongoDB)...');
    try {
      const db = await getMongoConnection();
      const issueRecordsCollection = db.collection('issue_records');
      
      // Get all records where return_time is null
      const rawRecords = await issueRecordsCollection.find({
        return_time: null
      }).toArray();
      
      console.log(`   Found ${rawRecords.length} active (not returned) issue records in raw MongoDB:`);
      for (const rec of rawRecords) {
        const estReturn = rec.estimated_return_time ? new Date(rec.estimated_return_time).toISOString() : 'NULL';
        const returnTime = rec.return_time ? new Date(rec.return_time).toISOString() : 'NULL';
        const isOverdue = rec.estimated_return_time && new Date(rec.estimated_return_time) < now;
        const notificationSent = rec.notification_sent || false;
        
        console.log(`   - Record ${rec._id}:`);
        console.log(`     Estimated Return (raw): ${estReturn}`);
        console.log(`     Return Time (raw): ${returnTime}`);
        console.log(`     Is Overdue: ${isOverdue ? '✅ YES' : '❌ NO'}`);
        console.log(`     Notification Sent (raw): ${notificationSent ? '✅ YES' : '❌ NO'}`);
        console.log(`     Issue Time: ${new Date(rec.issue_time).toISOString()}`);
        
        // Check why it might not match the query
        const matchesQuery = 
          rec.return_time === null &&
          rec.estimated_return_time !== null &&
          new Date(rec.estimated_return_time) < now &&
          !notificationSent;
        console.log(`     Matches Query: ${matchesQuery ? '✅ YES' : '❌ NO'}`);
        if (!matchesQuery) {
          console.log(`     Reasons:`);
          if (rec.return_time !== null && rec.return_time !== undefined) {
            console.log(`       - return_time is not null (value: ${returnTime})`);
          }
          if (rec.estimated_return_time === null || rec.estimated_return_time === undefined) {
            console.log(`       - estimated_return_time is null`);
          }
          if (rec.estimated_return_time && new Date(rec.estimated_return_time) >= now) {
            console.log(`       - estimated_return_time is in the future`);
          }
          if (notificationSent) {
            console.log(`       - notification_sent is true`);
          }
        }
      }
    } catch (debugError) {
      console.error('   ❌ ERROR in debug query:', debugError.message);
      console.error('   Stack:', debugError.stack);
    }
    
    // Also check with Prisma for comparison
    console.log('\n   🔍 DEBUG: Checking with Prisma...');
    try {
      const allActiveRecords = await prisma.issueRecord.findMany({
        where: {
          returnTime: null // Not returned yet
        },
        select: {
          id: true,
          estimatedReturnTime: true,
          notificationSent: true,
          issueTime: true,
          item: {
            select: {
              name: true
            }
          }
        }
      });
      
      console.log(`   Found ${allActiveRecords.length} active (not returned) issue records via Prisma:`);
      for (const rec of allActiveRecords) {
        const estReturn = rec.estimatedReturnTime ? new Date(rec.estimatedReturnTime).toISOString() : 'NULL';
        const isOverdue = rec.estimatedReturnTime && new Date(rec.estimatedReturnTime) < now;
        console.log(`   - Record ${rec.id}:`);
        console.log(`     Item: ${rec.item?.name || 'Unknown'}`);
        console.log(`     Estimated Return: ${estReturn}`);
        console.log(`     Is Overdue: ${isOverdue ? '✅ YES' : '❌ NO'}`);
        console.log(`     Notification Sent: ${rec.notificationSent ? '✅ YES' : '❌ NO'}`);
        console.log(`     Issue Time: ${new Date(rec.issueTime).toISOString()}`);
      }
    } catch (debugError) {
      console.error('   ❌ ERROR in Prisma debug query:', debugError.message);
    }
    
      // Now the actual query - but first, let's also query using raw MongoDB to catch any data inconsistencies
      console.log('\n   🔍 Querying for overdue items (using raw MongoDB to catch inconsistencies)...');
      const db = await getMongoConnection();
      const issueRecordsCollection = db.collection('issue_records');
      
      // Query using raw MongoDB to find overdue items
      // We'll be more lenient - if return_time exists but item is still overdue, we'll process it
      const rawOverdueRecords = await issueRecordsCollection.find({
        estimated_return_time: { $ne: null, $lt: now },
        notification_sent: { $ne: true }
        // Note: We're NOT checking return_time here because there might be data inconsistencies
        // We'll check it later and only process if it's actually null or very close to issue_time
      }).toArray();
      
      console.log(`   Found ${rawOverdueRecords.length} potentially overdue records (raw MongoDB)`);
      
      // Filter out records that are actually returned (return_time is significantly after issue_time)
      // Also fix data inconsistencies where return_time is incorrectly set
      const actuallyOverdue = [];
      for (const rec of rawOverdueRecords) {
        if (!rec.return_time) {
          actuallyOverdue.push(rec); // No return time = not returned
          continue;
        }
        
        // If return_time is very close to issue_time, it might be a data issue
        const returnTime = new Date(rec.return_time);
        const issueTime = new Date(rec.issue_time);
        const timeDiff = returnTime.getTime() - issueTime.getTime();
        
        // If return_time is within 10 seconds of issue_time, it's likely a data inconsistency
        // Fix it by setting return_time to null
        if (timeDiff < 10000 && timeDiff >= 0) {
          console.log(`   🔧 FIXING: Record ${rec._id} has return_time very close to issue_time (${timeDiff}ms)`);
          console.log(`      This is likely a data inconsistency. Setting return_time to null...`);
          
          try {
            await issueRecordsCollection.updateOne(
              { _id: rec._id },
              { 
                $set: { 
                  return_time: null,
                  updated_at: new Date()
                }
              }
            );
            console.log(`      ✅ Fixed! return_time set to null`);
            actuallyOverdue.push(rec);
          } catch (fixError) {
            console.error(`      ❌ Failed to fix record:`, fixError.message);
            // Still process it as overdue even if fix failed
            actuallyOverdue.push(rec);
          }
        } else if (timeDiff < 0) {
          // return_time is before issue_time - definitely wrong, fix it
          console.log(`   🔧 FIXING: Record ${rec._id} has return_time BEFORE issue_time (invalid data)`);
          try {
            await issueRecordsCollection.updateOne(
              { _id: rec._id },
              { 
                $set: { 
                  return_time: null,
                  updated_at: new Date()
                }
              }
            );
            console.log(`      ✅ Fixed! return_time set to null`);
            actuallyOverdue.push(rec);
          } catch (fixError) {
            console.error(`      ❌ Failed to fix record:`, fixError.message);
            actuallyOverdue.push(rec);
          }
        }
        // If timeDiff >= 10000, it's a valid return_time, so don't include it
      }
      
      console.log(`   After filtering, ${actuallyOverdue.length} records are actually overdue`);
      
      // Now query with Prisma to get full relations
      let overdueRecords = [];
      try {
        console.log('\n   🔍 Querying for overdue items with Prisma (with relations)...');
        console.log('     - returnTime: null');
        console.log('     - estimatedReturnTime: not null AND < now');
        console.log('     - notificationSent: false');
        
        const prismaOverdueRecords = await prisma.issueRecord.findMany({
          where: {
            returnTime: null, // Not returned yet
            estimatedReturnTime: {
              not: null,
              lt: now // Estimated return time has passed
            },
            notificationSent: false // Haven't sent notification yet
          },
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
      });
      console.log(`✅ Prisma query found ${prismaOverdueRecords.length} overdue records`);
      
      // If Prisma found fewer records than raw MongoDB, we have a data inconsistency
      if (prismaOverdueRecords.length < actuallyOverdue.length) {
        console.log(`\n   ⚠️  DATA INCONSISTENCY DETECTED!`);
        console.log(`   Raw MongoDB found ${actuallyOverdue.length} overdue records`);
        console.log(`   Prisma found ${prismaOverdueRecords.length} overdue records`);
        console.log(`   This means some records have return_time set incorrectly`);
        
        // For records found by raw MongoDB but not Prisma, fetch them individually
        for (const rawRec of actuallyOverdue) {
          const foundInPrisma = prismaOverdueRecords.find(p => p.id === rawRec._id.toString());
          if (!foundInPrisma) {
            console.log(`   🔧 Fetching record ${rawRec._id} via Prisma...`);
            try {
              const singleRecord = await prisma.issueRecord.findUnique({
                where: { id: rawRec._id.toString() },
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
              });
              
              if (singleRecord && !singleRecord.returnTime) {
                console.log(`   ✅ Added record ${rawRec._id} to overdue list`);
                overdueRecords.push(singleRecord);
              } else if (singleRecord && singleRecord.returnTime) {
                console.log(`   ⚠️  Record ${rawRec._id} has returnTime set, skipping`);
              }
            } catch (fetchError) {
              console.error(`   ❌ Error fetching record ${rawRec._id}:`, fetchError.message);
            }
          }
        }
      } else {
        overdueRecords = prismaOverdueRecords;
      }
      
      console.log(`✅ Total overdue records to process: ${overdueRecords.length}`);
    } catch (dbError) {
      console.error('❌ ERROR: Database query failed!');
      console.error('   Error:', dbError.message);
      console.error('   Stack:', dbError.stack);
      return { success: false, error: 'Database query failed', details: dbError.message };
    }

    console.log(`\n📊 Step 3: Found ${overdueRecords.length} overdue items`);

    if (overdueRecords.length === 0) {
      console.log('ℹ️  No overdue items found. All items are up to date.');
      return { success: true, count: 0 };
    }

    // Step 4: Process each overdue record
    let successCount = 0;
    let failCount = 0;
    
    for (let i = 0; i < overdueRecords.length; i++) {
      const record = overdueRecords[i];
      console.log(`\n${'='.repeat(50)}`);
      console.log(`📦 Processing item ${i + 1}/${overdueRecords.length}: ${record.item?.name || 'Unknown'}`);
      console.log(`${'='.repeat(50)}`);
      
      try {
        // Validate record data
        if (!record.user) {
          console.error('❌ ERROR: Record missing user data');
          failCount++;
          continue;
        }
        if (!record.item) {
          console.error('❌ ERROR: Record missing item data');
          failCount++;
          continue;
        }
        if (!record.lab) {
          console.error('❌ ERROR: Record missing lab data');
          failCount++;
          continue;
        }
        
        console.log(`   User: ${record.user.name} (${record.user.email})`);
        console.log(`   Item: ${record.item.name} (${record.item.category})`);
        console.log(`   Lab: ${record.lab.name} (ID: ${record.labId})`);
        console.log(`   Estimated Return: ${record.estimatedReturnTime}`);
        
        // Step 4a: Atomically claim the record to avoid duplicate emails
        console.log('\n   🔒 Step 4a: Claiming record for notification...');
        const db = await getMongoConnection();
        const issueRecordsCollection = db.collection('issue_records');

        const claimResult = await issueRecordsCollection.updateOne(
          {
            _id: new mongoose.Types.ObjectId(record.id),
            notification_sent: { $ne: true },
            notification_processing: { $ne: true }
          },
          {
            $set: {
              notification_processing: true,
              updated_at: new Date()
            }
          }
        );

        if (claimResult.modifiedCount === 0) {
          console.log(`   ⏭️  Record ${record.id} already claimed/processed. Skipping.`);
          continue;
        }

        // Step 4b: Find lab admin
        console.log('\n   🔍 Step 4a: Finding lab admin...');
        let labAdmin;
        
        try {
          // First, try to get LAB_ADMIN for this lab (person managing items)
          labAdmin = await prisma.user.findFirst({
            where: {
              labId: record.labId,
              role: 'LAB_ADMIN'
            },
            select: {
              id: true,
              name: true,
              email: true
            }
          });
          
          if (labAdmin) {
            console.log(`   ✅ Found LAB_ADMIN: ${labAdmin.name} (${labAdmin.email})`);
          } else {
            console.log(`   ⚠️  No LAB_ADMIN found for lab ${record.labId}`);
          }
        } catch (adminQueryError) {
          console.error('   ❌ ERROR: Failed to query for LAB_ADMIN');
          console.error('      Error:', adminQueryError.message);
        }
        
        // If no LAB_ADMIN found, use the lab's admin (ADMIN who manages the lab)
        if (!labAdmin && record.lab && record.lab.admin) {
          console.log(`   ⚠️  Using lab's ADMIN as fallback`);
          labAdmin = {
            id: record.lab.admin.id,
            name: record.lab.admin.name,
            email: record.lab.admin.email
          };
          console.log(`   ✅ Using ADMIN: ${labAdmin.name} (${labAdmin.email})`);
        }
        
        if (!labAdmin) {
          console.error(`   ❌ ERROR: No lab admin or admin found for lab ${record.labId}`);
          console.error(`      Lab name: ${record.lab?.name || 'Unknown'}`);
          failCount++;
          continue;
        }

        // Step 4c: Send email notification
        console.log('\n   📧 Step 4b: Sending email notifications...');
        const emailSent = await sendOverdueNotification(
          record,
          record.user,
          record.item,
          labAdmin
        );

        if (emailSent) {
          // Step 4d: Mark notification as sent
          console.log('\n   💾 Step 4c: Marking notification as sent...');
          try {
            const updateResult = await issueRecordsCollection.updateOne(
              { _id: new mongoose.Types.ObjectId(record.id) },
              { 
                $set: { 
                  notification_sent: true,
                  updated_at: new Date()
                },
                $unset: {
                  notification_processing: ''
                }
              }
            );
            
            if (updateResult.modifiedCount > 0) {
              console.log(`   ✅ Notification marked as sent for record ${record.id}`);
              successCount++;
            } else {
              console.warn(`   ⚠️  Update query executed but no document was modified`);
              successCount++; // Still count as success since email was sent
            }
          } catch (updateError) {
            console.error(`   ❌ ERROR: Failed to mark notification as sent`);
            console.error(`      Error:`, updateError.message);
            successCount++; // Email was sent, so count as success
          }
        } else {
          console.error(`   ❌ Failed to send notification for record ${record.id}`);
          await issueRecordsCollection.updateOne(
            { _id: new mongoose.Types.ObjectId(record.id) },
            {
              $unset: {
                notification_processing: ''
              },
              $set: {
                updated_at: new Date()
              }
            }
          );
          failCount++;
        }
      } catch (recordError) {
        console.error(`❌ ERROR: Failed to process record ${record.id}`);
        console.error('   Error:', recordError.message);
        console.error('   Stack:', recordError.stack);
        try {
          const db = await getMongoConnection();
          const issueRecordsCollection = db.collection('issue_records');
          await issueRecordsCollection.updateOne(
            { _id: new mongoose.Types.ObjectId(record.id) },
            {
              $unset: {
                notification_processing: ''
              },
              $set: {
                updated_at: new Date()
              }
            }
          );
        } catch (unlockError) {
          console.error(`   ⚠️  Failed to release processing lock for ${record.id}: ${unlockError.message}`);
        }
        failCount++;
      }
    }
    
    // Summary
    console.log(`\n${'='.repeat(50)}`);
    console.log('📊 SUMMARY');
    console.log(`${'='.repeat(50)}`);
    console.log(`   Total overdue items: ${overdueRecords.length}`);
    console.log(`   ✅ Successfully processed: ${successCount}`);
    console.log(`   ❌ Failed: ${failCount}`);
    console.log(`${'='.repeat(50)}\n`);
    
    return { 
      success: true, 
      total: overdueRecords.length, 
      successCount, 
      failCount 
    };
    
  } catch (error) {
    console.error('\n❌❌❌ FATAL ERROR in checkOverdueItems ❌❌❌');
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Error stack:', error.stack);
    console.error('Full error object:', JSON.stringify(error, null, 2));
    return { success: false, error: error.message, stack: error.stack };
  } finally {
    isOverdueCheckRunning = false;
  }
};

// Schedule cron job to run every 5 seconds
export const startOverdueChecker = () => {
  // Check if email is configured
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.warn('⚠️  Email not configured! Overdue notifications will not be sent.');
    console.warn('⚠️  Please set EMAIL_USER and EMAIL_PASSWORD in .env file');
    return;
  }

  // Run every 5 seconds
  cron.schedule('*/5 * * * * *', async () => {
    console.log('\n⏰ Running scheduled overdue items check (every 5 seconds)...');
    await checkOverdueItems();
  });

  // Also run every 5 minutes for testing (comment out in production)
  // cron.schedule('*/5 * * * *', async () => {
  //   console.log('\n⏰ Running overdue items check (5 min interval)...');
  //   await checkOverdueItems();
  // });

  console.log('✅ Overdue items checker scheduled to run every 5 seconds');
};

// Also run on startup (optional - for immediate check)
export const runInitialCheck = async () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.warn('⚠️  Skipping initial overdue check - Email not configured');
    return;
  }
  console.log('🔍 Running initial overdue items check...');
  await checkOverdueItems();
};

