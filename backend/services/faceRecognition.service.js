import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const FACE_RECOGNITION_SERVICE_URL = process.env.FACE_RECOGNITION_SERVICE_URL || 'http://localhost:5001';

/**
 * Check if face recognition service is available
 */
export const checkServiceHealth = async () => {
  try {
    const response = await axios.get(`${FACE_RECOGNITION_SERVICE_URL}/health`);
    return response.data;
  } catch (error) {
    console.error('Face recognition service is not available:', error.message);
    return null;
  }
};

/**
 * Detect face in base64 encoded image and return face encoding
 * @param {string} base64Image - Base64 encoded image string
 * @returns {Promise<Object>} - Face encoding and detection result
 */
export const detectFace = async (base64Image) => {
  try {
    const response = await axios.post(`${FACE_RECOGNITION_SERVICE_URL}/detect-face`, {
      image: base64Image
    });
    return response.data;
  } catch (error) {
    console.error('Error detecting face:', error);
    throw new Error(error.response?.data?.error || 'Failed to detect face');
  }
};

/**
 * Compare two face encodings
 * @param {string} encoding1 - Base64 encoded face encoding 1
 * @param {string} encoding2 - Base64 encoded face encoding 2
 * @param {number} threshold - Matching threshold (default: 0.6)
 * @returns {Promise<Object>} - Comparison result
 */
export const compareFaces = async (encoding1, encoding2, threshold = 0.6) => {
  try {
    const response = await axios.post(`${FACE_RECOGNITION_SERVICE_URL}/compare-faces`, {
      encoding1,
      encoding2,
      threshold
    });
    return response.data;
  } catch (error) {
    console.error('Error comparing faces:', error);
    throw new Error(error.response?.data?.error || 'Failed to compare faces');
  }
};

/**
 * Verify live face against stored user image
 * @param {string} liveImageBase64 - Base64 encoded live camera image
 * @param {string} userImageUrl - URL or path to user's stored image
 * @param {string} userEncoding - Optional: user's face encoding (base64)
 * @param {number} threshold - Matching threshold (default: 0.6)
 * @returns {Promise<Object>} - Verification result
 */
export const verifyFace = async (liveImageBase64, userImageUrl = null, userEncoding = null, threshold = 0.65) => {
  try {
    const payload = {
      live_image: liveImageBase64,
      threshold
    };

    // Validate face encoding before using it
    let isValidEncoding = false;
    if (userEncoding) {
      try {
        // Try to validate if it's a valid base64-encoded JSON
        // First, check if it looks like base64
        const base64Regex = /^[A-Za-z0-9+/=]+$/;
        if (base64Regex.test(userEncoding)) {
          // Try to decode it
          const decoded = Buffer.from(userEncoding, 'base64').toString('utf-8');
          // Try to parse as JSON
          const parsed = JSON.parse(decoded);
          // Check if it's an array (face encoding should be an array of numbers)
          if (Array.isArray(parsed) && parsed.length > 0) {
            isValidEncoding = true;
          }
        }
      } catch (e) {
        console.warn('Face descriptor validation failed, will use image instead:', e.message);
        isValidEncoding = false;
      }
    }

    if (userEncoding && isValidEncoding) {
      // Use face encoding directly if available and valid (preferred method)
      payload.user_encoding = userEncoding;
      console.log('Using valid face encoding from database');
    } else if (userImageUrl) {
      // Fall back to using image if encoding is invalid or not available
      if (userEncoding && !isValidEncoding) {
        console.log('Face descriptor is invalid, falling back to using image for verification');
      }
      // Check if userImageUrl is already a base64 string
      if (userImageUrl.startsWith('data:image')) {
        // It's already a base64 string - use it directly
        payload.user_image_base64 = userImageUrl;
        console.log('Using base64 image string directly from database');
      } else if (!userImageUrl.startsWith('http')) {
        // It's a file path - read it and convert to base64
        // This is needed because Python service can't access Node.js file system
        const fs = (await import('fs')).default;
        const path = (await import('path')).default;
        
        try {
          // Check if file exists
          if (!fs.existsSync(userImageUrl)) {
            const errorMsg = `User image file not found at path: ${userImageUrl}`;
            console.error(errorMsg);
            throw new Error(errorMsg);
          }
          
          // Read the image file
          const imageBuffer = fs.readFileSync(userImageUrl);
          // Convert to base64
          const imageBase64 = imageBuffer.toString('base64');
          // Determine MIME type from file extension
          const ext = path.extname(userImageUrl).toLowerCase();
          const mimeTypes = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.webp': 'image/webp'
          };
          const mimeType = mimeTypes[ext] || 'image/jpeg';
          // Create data URL
          payload.user_image_base64 = `data:${mimeType};base64,${imageBase64}`;
          console.log(`Successfully converted user image to base64 (${imageBase64.length} chars)`);
        } catch (fileError) {
          console.error('Error reading user image file:', fileError);
          console.error('File path attempted:', userImageUrl);
          // Re-throw the error to prevent sending user_image_url to Python
          throw new Error(`Failed to read user image file: ${fileError.message}. Please ensure the user has uploaded an image.`);
        }
      } else {
        // If it's an HTTP URL, we need to download it first or send as base64
        // For now, throw an error as we don't support HTTP URLs yet
        throw new Error('HTTP URLs for user images are not supported. Please use a file path or face encoding.');
      }
    } else {
      throw new Error('Either userImageUrl or userEncoding is required');
    }

    console.log('Sending verification request to Python service with payload keys:', Object.keys(payload));
    console.log('Verification threshold:', threshold);
    console.log('Payload details:', {
      has_live_image: !!payload.live_image,
      live_image_length: payload.live_image?.length || 0,
      has_user_image_base64: !!payload.user_image_base64,
      user_image_base64_length: payload.user_image_base64?.length || 0,
      has_user_encoding: !!payload.user_encoding,
      user_encoding_length: payload.user_encoding?.length || 0,
      threshold: payload.threshold
    });
    
    const response = await axios.post(`${FACE_RECOGNITION_SERVICE_URL}/verify-face`, payload, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000  // 30 second timeout
    });
    
    // Log the response for debugging
    if (response.data) {
      console.log('Python service verification response:', {
        success: response.data.success,
        is_match: response.data.is_match,
        distance: response.data.distance,
        threshold: response.data.threshold,
        confidence: response.data.confidence
      });
    }
    
    return response.data;
  } catch (error) {
    console.error('Error verifying face:', error);
    
    // Log detailed error information
    if (error.response) {
      console.error('Python service error response:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.response.headers
      });
    }
    
    // If it's our own error, throw it as-is
    if (error.message && !error.response) {
      throw error;
    }
    
    // Extract detailed error message from Python service
    const errorMessage = error.response?.data?.error || error.message || 'Failed to verify face';
    console.error('Final error message:', errorMessage);
    
    throw new Error(errorMessage);
  }
};

/**
 * Extract face encoding from uploaded image file
 * @param {string} filePath - Path to image file
 * @returns {Promise<Object>} - Face encoding result
 */
export const extractEncodingFromFile = async (filePath) => {
  try {
    const FormData = (await import('form-data')).default;
    const fs = (await import('fs')).default;
    
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath));

    const response = await axios.post(
      `${FACE_RECOGNITION_SERVICE_URL}/extract-encoding`,
      formData,
      {
        headers: formData.getHeaders()
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error extracting encoding from file:', error);
    throw new Error(error.response?.data?.error || 'Failed to extract face encoding');
  }
};






