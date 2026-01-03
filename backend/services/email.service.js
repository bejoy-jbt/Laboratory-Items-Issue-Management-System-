import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Creates email transporter for sending emails
 * 
 * NOTE: The EMAIL_USER and EMAIL_PASSWORD in .env are for the SMTP service account
 * that SENDS the emails (like a Gmail account used as mail server).
 * 
 * The actual recipient emails (user.email and labAdmin.email) are fetched from
 * the database - these are the specific people who receive the notifications.
 */
const createTransporter = () => {
  // For Gmail
  if (process.env.EMAIL_SERVICE === 'gmail') {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }

  // For SMTP (generic)
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

/**
 * Sends overdue notification emails to specific users
 * 
 * @param {Object} issueRecord - The issue record from database
 * @param {Object} user - User object with email from database (RECIPIENT)
 * @param {Object} item - Item object
 * @param {Object} labAdmin - Lab Admin object with email from database (RECIPIENT)
 * 
 * Recipients are fetched from database:
 * - user.email: The specific user who has the overdue item
 * - labAdmin.email: The specific lab admin managing that lab
 */
export const sendOverdueNotification = async (issueRecord, user, item, labAdmin) => {
  console.log('   📧 sendOverdueNotification called');
  
  try {
    // Step 1: Validate inputs
    console.log('   📧 Step 1: Validating inputs...');
    if (!issueRecord) {
      console.error('   ❌ ERROR: issueRecord is missing');
      return false;
    }
    if (!user || !user.email) {
      console.error('   ❌ ERROR: user or user.email is missing');
      console.error('      User object:', user);
      return false;
    }
    if (!item || !item.name) {
      console.error('   ❌ ERROR: item or item.name is missing');
      console.error('      Item object:', item);
      return false;
    }
    if (!labAdmin || !labAdmin.email) {
      console.error('   ❌ ERROR: labAdmin or labAdmin.email is missing');
      console.error('      LabAdmin object:', labAdmin);
      return false;
    }
    console.log('   ✅ Inputs validated');
    
    // Step 2: Check email configuration
    console.log('   📧 Step 2: Checking email configuration...');
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.error('   ❌ ERROR: Email not configured!');
      console.error('      EMAIL_USER:', process.env.EMAIL_USER ? 'Set' : 'Missing');
      console.error('      EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? 'Set' : 'Missing');
      return false;
    }
    console.log('   ✅ Email configuration found');

    // Step 3: Create transporter
    console.log('   📧 Step 3: Creating email transporter...');
    let transporter;
    try {
      transporter = createTransporter();
      if (!transporter) {
        console.error('   ❌ ERROR: Failed to create email transporter (returned null/undefined)');
        return false;
      }
      console.log('   ✅ Transporter created successfully');
    } catch (transporterError) {
      console.error('   ❌ ERROR: Exception while creating transporter');
      console.error('      Error:', transporterError.message);
      console.error('      Stack:', transporterError.stack);
      return false;
    }

    const estimatedReturnDate = new Date(issueRecord.estimatedReturnTime).toLocaleDateString();
    const issueDate = new Date(issueRecord.issueTime).toLocaleDateString();

    // Email to User (recipient email from database: user.email)
    const userMailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER, // Sender (from .env)
      to: user.email, // Recipient (from database - specific user who has the item)
      subject: `⚠️ Overdue Item: ${item.name} - Return Required`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">Item Return Overdue</h2>
          <p>Dear ${user.name},</p>
          <p>This is a reminder that you have an overdue item that needs to be returned.</p>
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Item:</strong> ${item.name}</p>
            <p><strong>Category:</strong> ${item.category}</p>
            <p><strong>Issue Date:</strong> ${issueDate}</p>
            <p><strong>Estimated Return Date:</strong> ${estimatedReturnDate}</p>
            <p style="color: #dc2626;"><strong>Status:</strong> OVERDUE</p>
          </div>
          <p>Please return this item to the lab as soon as possible.</p>
          <p>If you have any questions, please contact your Lab Admin.</p>
          <p>Thank you,<br>Lab Items Management System</p>
        </div>
      `
    };

    // Email to Lab Admin (recipient email from database: labAdmin.email)
    const adminMailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER, // Sender (from .env)
      to: labAdmin.email, // Recipient (from database - specific lab admin for this lab)
      subject: `⚠️ Overdue Item Alert: ${item.name} - User: ${user.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">Overdue Item Alert</h2>
          <p>Dear ${labAdmin.name},</p>
          <p>An item in your lab has exceeded its estimated return time.</p>
          <div style="background-color: #fef2f2; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #dc2626;">
            <p><strong>Item:</strong> ${item.name}</p>
            <p><strong>Category:</strong> ${item.category}</p>
            <p><strong>User:</strong> ${user.name} (${user.email})</p>
            <p><strong>Issue Date:</strong> ${issueDate}</p>
            <p><strong>Estimated Return Date:</strong> ${estimatedReturnDate}</p>
            <p style="color: #dc2626;"><strong>Status:</strong> OVERDUE</p>
          </div>
          <p>Please follow up with the user to ensure the item is returned.</p>
          <p>Thank you,<br>Lab Items Management System</p>
        </div>
      `
    };

    // Step 4: Prepare email options
    console.log('   📧 Step 4: Preparing email options...');
    console.log(`      To user: ${user.email}`);
    console.log(`      To lab admin: ${labAdmin.email}`);
    console.log(`      From: ${process.env.EMAIL_FROM || process.env.EMAIL_USER}`);
    console.log('   ✅ Email options prepared');
    
    // Step 5: Send emails
    console.log('   📧 Step 5: Sending emails...');
    let userResult, adminResult;
    
    try {
      console.log('      Sending email to user...');
      userResult = await transporter.sendMail(userMailOptions);
      console.log(`      ✅ User email sent - Message ID: ${userResult.messageId}`);
    } catch (userEmailError) {
      console.error('      ❌ ERROR: Failed to send email to user');
      console.error('         Error:', userEmailError.message);
      console.error('         Code:', userEmailError.code);
      console.error('         Response:', userEmailError.response);
      throw userEmailError; // Re-throw to be caught by outer catch
    }
    
    try {
      console.log('      Sending email to lab admin...');
      adminResult = await transporter.sendMail(adminMailOptions);
      console.log(`      ✅ Lab admin email sent - Message ID: ${adminResult.messageId}`);
    } catch (adminEmailError) {
      console.error('      ❌ ERROR: Failed to send email to lab admin');
      console.error('         Error:', adminEmailError.message);
      console.error('         Code:', adminEmailError.code);
      console.error('         Response:', adminEmailError.response);
      throw adminEmailError; // Re-throw to be caught by outer catch
    }
    
    console.log(`   ✅✅✅ Both emails sent successfully! ✅✅✅`);
    return true;
    
  } catch (error) {
    console.error('   ❌❌❌ ERROR in sendOverdueNotification ❌❌❌');
    console.error('   Error message:', error.message);
    console.error('   Error code:', error.code);
    console.error('   Error response:', error.response);
    if (error.response) {
      console.error('   Response code:', error.responseCode);
      console.error('   Response message:', error.responseMessage);
    }
    console.error('   Error stack:', error.stack);
    return false;
  }
};

