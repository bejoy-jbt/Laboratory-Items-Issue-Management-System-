import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes.js';
import superAdminRoutes from './routes/superAdmin.routes.js';
import adminRoutes from './routes/admin.routes.js';
import labAdminRoutes from './routes/labAdmin.routes.js';
import userRoutes from './routes/user.routes.js';
import faceRecognitionRoutes from './routes/faceRecognition.routes.js';
import { startOverdueChecker, runInitialCheck } from './services/overdueChecker.service.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
// Increase body size limit to handle large images and face descriptors
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from uploads directory
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
app.use('/uploads', express.static(join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/super-admin', superAdminRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/lab-admin', labAdminRoutes);
app.use('/api/user', userRoutes);
app.use('/api/face-recognition', faceRecognitionRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Manual trigger for overdue check (for testing)
app.post('/api/admin/check-overdue', async (req, res) => {
  try {
    console.log('\n🔔 Manual overdue check triggered via API');
    const { checkOverdueItems } = await import('./services/overdueChecker.service.js');
    const result = await checkOverdueItems();
    res.json({ 
      message: 'Overdue check completed. Check server logs for details.',
      result 
    });
  } catch (error) {
    console.error('❌ Error triggering overdue check:', error);
    res.status(500).json({ 
      message: 'Error running overdue check', 
      error: error.message,
      stack: error.stack 
    });
  }
});

// Test email endpoint (for debugging)
app.post('/api/admin/test-email', async (req, res) => {
  try {
    const { sendOverdueNotification } = await import('./services/email.service.js');
    
    // Create a test record
    const testRecord = {
      id: 'test-record-id',
      issueTime: new Date(),
      estimatedReturnTime: new Date(Date.now() - 86400000) // Yesterday
    };
    
    const testUser = {
      id: 'test-user-id',
      name: 'Test User',
      email: req.body.testUserEmail || 'test@example.com'
    };
    
    const testItem = {
      id: 'test-item-id',
      name: 'Test Item',
      category: 'Test Category'
    };
    
    const testLabAdmin = {
      id: 'test-admin-id',
      name: 'Test Lab Admin',
      email: req.body.testAdminEmail || 'admin@example.com'
    };
    
    console.log('\n🧪 Testing email sending...');
    const result = await sendOverdueNotification(testRecord, testUser, testItem, testLabAdmin);
    
    if (result) {
      res.json({ 
        success: true,
        message: 'Test email sent successfully. Check the recipient inboxes.',
        sentTo: {
          user: testUser.email,
          admin: testLabAdmin.email
        }
      });
    } else {
      res.status(500).json({ 
        success: false,
        message: 'Failed to send test email. Check server logs for details.'
      });
    }
  } catch (error) {
    console.error('❌ Error in test email endpoint:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error sending test email', 
      error: error.message,
      stack: error.stack 
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  
  // Start overdue items checker
  startOverdueChecker();
  
  // Run initial check after a short delay (to allow DB connection)
  setTimeout(async () => {
    await runInitialCheck();
  }, 5000);
});

