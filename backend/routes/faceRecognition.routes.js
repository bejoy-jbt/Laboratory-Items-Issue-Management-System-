import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import * as faceRecognitionService from '../services/faceRecognition.service.js';
import { PrismaClient } from '@prisma/client';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const router = express.Router();
const prisma = new PrismaClient();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Health check for face recognition service
router.get('/health', async (req, res) => {
  try {
    const health = await faceRecognitionService.checkServiceHealth();
    if (health) {
      res.json({
        status: 'OK',
        faceRecognitionService: health
      });
    } else {
      res.status(503).json({
        status: 'SERVICE_UNAVAILABLE',
        message: 'Face recognition service is not available'
      });
    }
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      message: 'Failed to connect to face recognition service'
    });
  }
});

// Detect face in image
router.post('/detect', authenticate, async (req, res) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ message: 'Image is required' });
    }

    const result = await faceRecognitionService.detectFace(image);
    res.json(result);
  } catch (error) {
    console.error('Face detection error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Failed to detect face' 
    });
  }
});

// Verify face against user image
router.post('/verify', authenticate, async (req, res) => {
  try {
    const { liveImage, userId, userImageUrl, userEncoding } = req.body;

    if (!liveImage) {
      return res.status(400).json({ message: 'Live image is required' });
    }

    // Prevent USERs from verifying against other users' registered faces.
    // (Admins can still use this endpoint for verification workflows if needed.)
    if (userId && req.user?.role === 'USER' && userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        is_match: false,
        message: 'You can only verify your own face'
      });
    }

    let finalUserImageUrl = userImageUrl;
    let finalUserEncoding = userEncoding;

    let userName = null;
    
    // If userId is provided, fetch user's image, encoding, and name from database
    if (userId && !userImageUrl && !userEncoding) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          name: true,
          imageUrl: true,
          faceDescriptor: true
        }
      });

      if (user) {
        userName = user.name;
        if (user.imageUrl) {
          // Check if it's a base64 string or a file path
          if (user.imageUrl.startsWith('data:image')) {
            // It's already a base64 string - use it directly
            finalUserImageUrl = user.imageUrl;
            console.log('Using base64 image string from database');
          } else {
            // It's a file path - convert relative URL to absolute path
            finalUserImageUrl = join(__dirname, '..', user.imageUrl);
            console.log(`User image path constructed: ${finalUserImageUrl}`);
            console.log(`User imageUrl from DB: ${user.imageUrl}`);
          }
        }
        if (user.faceDescriptor) {
          finalUserEncoding = user.faceDescriptor;
          console.log('Using face descriptor from database');
        }
      }
    } else if (userId) {
      // Even if we have userImageUrl/userEncoding, fetch name for error messages
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true }
      });
      if (user) {
        userName = user.name;
      }
    } else if (userImageUrl) {
      // Check if it's a base64 string or a file path
      if (userImageUrl.startsWith('data:image')) {
        // It's already a base64 string - use it directly
        finalUserImageUrl = userImageUrl;
      } else if (!userImageUrl.startsWith('http')) {
        // It's a relative path - convert to absolute
        finalUserImageUrl = join(__dirname, '..', userImageUrl);
      } else {
        // It's an HTTP URL - use as is (though not fully supported yet)
        finalUserImageUrl = userImageUrl;
      }
    }

    if (!finalUserImageUrl && !finalUserEncoding) {
      return res.status(400).json({ 
        success: false,
        is_match: false,
        message: 'User image URL or encoding is required. Please ensure the user has a registered face image.' 
      });
    }

    const result = await faceRecognitionService.verifyFace(
      liveImage,
      finalUserImageUrl,
      finalUserEncoding
    );

    // Add user name to result for success and error messages
    if (userName) {
      result.userName = userName;
      if (result.is_match && result.success) {
        // Update success message to include username
        result.message = `This user ${userName} is successfully authenticated`;
      } 
      
      // else if (!result.is_match && result.message) {
      //   result.message = `You are not authorized to get this item`;
      // }
    }

    res.json(result);
  } catch (error) {
    console.error('Face verification error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Failed to verify face' 
    });
  }
});

// Compare two face encodings
router.post('/compare', authenticate, async (req, res) => {
  try {
    const { encoding1, encoding2, threshold } = req.body;

    if (!encoding1 || !encoding2) {
      return res.status(400).json({ 
        message: 'Both encodings are required' 
      });
    }

    const result = await faceRecognitionService.compareFaces(
      encoding1,
      encoding2,
      threshold || 0.6
    );

    res.json(result);
  } catch (error) {
    console.error('Face comparison error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Failed to compare faces' 
    });
  }
});

export default router;


