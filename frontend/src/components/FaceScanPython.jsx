import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { FaceMesh, FACEMESH_TESSELATION } from '@mediapipe/face_mesh';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';

const FaceScanPython = ({ onFaceDetected, onClose, userId, userName, userImageUrl, userEncoding }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [faceMatched, setFaceMatched] = useState(false);
  const [faceMismatch, setFaceMismatch] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);
  const landmarkIntervalRef = useRef(null);
  const faceMeshRef = useRef(null);
  const isLandmarkProcessingRef = useRef(false);
  const capturedImageRef = useRef(null); // Store captured image for backend verification

  useEffect(() => {
    initializeFaceMesh();
    return () => {
      stopCamera();
    };
  }, []);

  useEffect(() => {
    if (isScanning && modelsLoaded && !landmarkIntervalRef.current) {
      startLandmarkOverlay();
    }
  }, [isScanning, modelsLoaded]);

  const initializeFaceMesh = async () => {
    try {
      const faceMesh = new FaceMesh({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
      });

      faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      faceMesh.onResults((results) => {
        if (!overlayCanvasRef.current) return;
        const overlayCanvas = overlayCanvasRef.current;
        const overlayCtx = overlayCanvas.getContext('2d');
        const video = videoRef.current;
        const width = video?.clientWidth || video?.videoWidth || 640;
        const height = video?.clientHeight || video?.videoHeight || 480;

        overlayCanvas.width = width;
        overlayCanvas.height = height;
        overlayCtx.clearRect(0, 0, width, height);

        if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
          return;
        }

        results.multiFaceLandmarks.forEach((landmarks) => {
          drawConnectors(overlayCtx, landmarks, FACEMESH_TESSELATION, {
            color: '#00FF88',
            lineWidth: 0.75
          });
          drawLandmarks(overlayCtx, landmarks, {
            color: '#00FF88',
            radius: 1.4
          });
        });
      });

      faceMeshRef.current = faceMesh;
      setModelsLoaded(true);
    } catch (modelError) {
      console.error('Failed to load face landmark models:', modelError);
      setModelsLoaded(false);
      setError('Failed to initialize realtime face landmarks.');
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 }
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      setIsScanning(true);
      setMessage('Camera started. Please position your face in the frame.');
      setError('');
      setFaceMismatch(false);
      if (modelsLoaded) {
        startLandmarkOverlay();
      } else {
        setMessage('Camera started. Loading landmark points...');
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Failed to access camera. Please ensure camera permissions are granted.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (landmarkIntervalRef.current) {
      clearInterval(landmarkIntervalRef.current);
      landmarkIntervalRef.current = null;
    }
    if (overlayCanvasRef.current) {
      const overlayCtx = overlayCanvasRef.current.getContext('2d');
      overlayCtx.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);
    }
    setIsScanning(false);
  };

  const startLandmarkOverlay = () => {
    if (!videoRef.current || !overlayCanvasRef.current || !faceMeshRef.current) return;

    const video = videoRef.current;

    landmarkIntervalRef.current = setInterval(async () => {
      if (!video || video.readyState < 2 || isLandmarkProcessingRef.current) return;
      isLandmarkProcessingRef.current = true;
      try {
        await faceMeshRef.current.send({ image: video });
      } catch (landmarkError) {
        console.error('Landmark draw error:', landmarkError);
      } finally {
        isLandmarkProcessingRef.current = false;
      }
    }, 120);
  };

  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current) {
      console.error('Cannot capture frame: video or canvas ref is null');
      return null;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Check if video is ready
    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
      console.error('Video not ready. ReadyState:', video.readyState);
      return null;
    }

    const ctx = canvas.getContext('2d');

    // Set canvas size to match video
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    // Draw current video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to base64 with reduced quality to minimize size
    // Quality 0.7 reduces file size while maintaining face recognition accuracy
    const imageData = canvas.toDataURL('image/jpeg', 0.7);
    
    // Validate the captured image
    if (!imageData || imageData.length < 100 || !imageData.startsWith('data:image')) {
      console.error('Invalid image captured. Length:', imageData?.length, 'Starts with:', imageData?.substring(0, 20));
      return null;
    }
    
    console.log('Frame captured successfully. Length:', imageData.length);
    return imageData;
  };

  const handleVerify = async () => {
    if (!videoRef.current) return;

    setIsProcessing(true);
    setError('');
    setMessage('Processing face verification...');

    console.log('=== handleVerify CALLED ===');
    console.log('Props available:', {
      hasUserImageUrl: !!userImageUrl,
      hasUserEncoding: !!userEncoding,
      userId,
      userName
    });

    try {
      // Capture current frame - this will be used for both frontend and backend verification
      const imageBase64 = captureFrame();
      if (!imageBase64) {
        setError('Failed to capture image');
        setIsProcessing(false);
        return;
      }

      // Store the captured image in ref IMMEDIATELY for later use (critical for backend verification)
      // This ensures the image is available even after async operations
      capturedImageRef.current = imageBase64;
      console.log('Image captured and stored in ref. Length:', imageBase64.length, 'Type:', typeof imageBase64);

      // Call backend API which will communicate with Python service
      const response = await axios.post('/api/face-recognition/verify', {
        liveImage: imageBase64,
        userImageUrl: userImageUrl,
        userEncoding: userEncoding,
        userId: userId
      });
      
      console.log('Face verification response:', {
        success: response.data.success,
        is_match: response.data.is_match,
        message: response.data.message
      });

      if (response.data.success && response.data.is_match) {
        setFaceMatched(true);
        // Use message from backend if available, otherwise construct one
        const successMessage = response.data.message || 
          (userName ? `This user ${userName} is successfully authenticated` : 'Face verified successfully!');
        setMessage(successMessage);
        
        // Ensure image is stored in ref (it should already be, but be safe)
        if (!capturedImageRef.current) {
          capturedImageRef.current = imageBase64;
        }
        
        // Use the imageBase64 from the closure - it's guaranteed to be available here
        // Store it in a const that will be available in the setTimeout closure
        const liveImageToSend = imageBase64;
        
        // Validate we have a valid image
        if (!liveImageToSend || !liveImageToSend.startsWith('data:image') || liveImageToSend.length < 1000) {
          console.error('ERROR: Invalid image format or size. Length:', liveImageToSend?.length);
          setError('Failed to capture valid image. Please try scanning again.');
          setIsProcessing(false);
          stopCamera();
          return;
        }
        
        console.log('Face verification successful. Image ready. Length:', liveImageToSend.length);
        console.log('Image stored in ref:', !!capturedImageRef.current, 'Length:', capturedImageRef.current?.length);
        
        // Get the final image to pass - use the one from closure (most reliable)
        const finalImage = liveImageToSend;
        
        // Double-check the image is valid
        if (!finalImage || !finalImage.startsWith('data:image') || finalImage.length < 1000) {
          console.error('ERROR: Image invalid before callback');
          setError('Image verification failed. Please try again.');
          setIsProcessing(false);
          stopCamera();
          return;
        }
        
        // Stop camera immediately
        stopCamera();
        
        // Verify callback exists
        if (!onFaceDetected) {
          console.error('ERROR: onFaceDetected callback is not defined');
          setError('Callback error. Please try again.');
          setIsProcessing(false);
          return;
        }
        
        console.log('=== CALLING onFaceDetected ===');
        console.log('Parameters to pass:', {
          param1: response.data.face_encoding ? 'encoding (present)' : 'true',
          param2: successMessage,
          param3: `image (${finalImage.length} chars)`,
          imagePreview: finalImage.substring(0, 50)
        });
        
        // Call the callback IMMEDIATELY with all 3 parameters
        // IMPORTANT: Pass finalImage as the third parameter
        try {
          if (response.data.face_encoding) {
            console.log('Calling: onFaceDetected(encoding, message, image)');
            onFaceDetected(response.data.face_encoding, successMessage, finalImage);
          } else {
            console.log('Calling: onFaceDetected(true, message, image)');
            onFaceDetected(true, successMessage, finalImage);
          }
          console.log('✓ onFaceDetected called successfully with 3 parameters');
        } catch (callbackError) {
          console.error('✗ Error calling onFaceDetected:', callbackError);
          setError('Error processing verification. Please try again.');
          setIsProcessing(false);
        }
        
        // Show success message for 2 seconds (non-blocking)
        setTimeout(() => {
          // Message already shown, just clear processing state
          setIsProcessing(false);
        }, 2000);
      } else {
        // Face mismatch - show authorization error
        // DO NOT proceed to issue item - verification failed
        setFaceMismatch(true);
        setError('You are not authorized to get this item');
        setMessage('');
        setIsProcessing(false);
        
        console.log('Face verification failed - mismatch detected. Item will NOT be issued.');
        
        // Clear mismatch indicator after 5 seconds
        setTimeout(() => {
          setFaceMismatch(false);
        }, 5000);
        
        // Do NOT call onFaceDetected - verification failed
        return;
      }
    } catch (err) {
      console.error('Error verifying face:', err);
      const errorMessage = err.response?.data?.message || 'Failed to verify face. Please try again.';
      
      // Check if it's a mismatch error
      if (errorMessage.toLowerCase().includes('mismatch') || 
          errorMessage.toLowerCase().includes('does not match') ||
          errorMessage.toLowerCase().includes('not authorized') ||
          (err.response?.data?.success === false && err.response?.data?.is_match === false)) {
        setFaceMismatch(true);
        setError('You are not authorized to get this item');
        setTimeout(() => {
          setFaceMismatch(false);
        }, 5000);
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDetectOnly = async () => {
    console.log('=== handleDetectOnly CALLED ===');
    console.log('Props available:', {
      hasUserImageUrl: !!userImageUrl,
      hasUserEncoding: !!userEncoding,
      userId,
      userName
    });
    
    if (!videoRef.current) return;

    setIsProcessing(true);
    setError('');
    setMessage('Detecting face...');

    try {
      const imageBase64 = captureFrame();
      if (!imageBase64) {
        setError('Failed to capture image');
        setIsProcessing(false);
        return;
      }

      // Store image in ref for later use
      capturedImageRef.current = imageBase64;

      const response = await axios.post('/api/face-recognition/detect', {
        image: imageBase64
      });

      if (response.data.success) {
        setMessage('Face detected successfully!');
        // Always pass the image as the third parameter, even for detect-only
        if (onFaceDetected) {
          console.log('=== CALLING onFaceDetected from handleDetectOnly ===');
          console.log('Parameters to pass:', {
            param1: response.data.face_encoding ? 'encoding (present)' : 'true',
            param2: 'Face detected successfully!',
            param3: `image (${imageBase64.length} chars)`
          });
          
          if (response.data.face_encoding) {
            console.log('Calling: onFaceDetected(encoding, message, image)');
            onFaceDetected(response.data.face_encoding, 'Face detected successfully!', imageBase64);
          } else {
            console.log('Calling: onFaceDetected(true, message, image)');
            onFaceDetected(true, 'Face detected successfully!', imageBase64);
          }
          console.log('✓ onFaceDetected called successfully with 3 parameters');
        }
      } else {
        setError(response.data.message || 'No face detected. Please try again.');
      }
    } catch (err) {
      console.error('Error detecting face:', err);
      setError(err.response?.data?.message || 'Failed to detect face. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
        <h2 className="text-2xl font-bold mb-4">Face Verification</h2>
        
        {error && (
          <div className="bg-red-100 border-2 border-red-500 text-red-800 px-4 py-3 rounded mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold">✗</span>
              <span className="font-semibold">{error}</span>
            </div>
          </div>
        )}

        {message && !error && (
          <div className={`bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4 ${faceMatched ? 'bg-green-100 border-green-400 text-green-700' : ''}`}>
            {message}
          </div>
        )}

        <div className="relative mb-4">
          <div className="relative">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full rounded-lg"
              style={{ display: isScanning ? 'block' : 'none' }}
            />
            {faceMismatch && isScanning && (
              <div className="absolute inset-0 bg-red-500 bg-opacity-30 flex items-center justify-center rounded-lg">
                <div className="bg-white rounded-lg p-4 border-4 border-red-500">
                  <div className="text-center">
                    <div className="text-6xl mb-2">✗</div>
                    <div className="text-2xl font-bold text-red-600">NOT AUTHORIZED</div>
                    <div className="text-lg text-gray-700 mt-2 font-semibold">You are not authorized to get this item</div>
                  </div>
                </div>
              </div>
            )}
            <canvas
              ref={canvasRef}
              className="hidden"
            />
            <canvas
              ref={overlayCanvasRef}
              className="absolute top-0 left-0 h-full w-full rounded-lg pointer-events-none"
              style={{ display: isScanning ? 'block' : 'none' }}
            />
          </div>
          {!isScanning && (
            <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">Camera not started</p>
            </div>
          )}
        </div>

        <div className="flex gap-4">
          {!isScanning && !faceMatched && (
            <button
              onClick={startCamera}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
            >
              Start Camera
            </button>
          )}
          
          {isScanning && !faceMatched && (
            <>
              {userImageUrl || userEncoding ? (
                <button
                  onClick={handleVerify}
                  disabled={isProcessing}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400"
                >
                  {isProcessing ? 'Verifying...' : 'Verify Face'}
                </button>
              ) : (
                <button
                  onClick={handleDetectOnly}
                  disabled={isProcessing}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400"
                >
                  {isProcessing ? 'Detecting...' : 'Detect Face'}
                </button>
              )}
            </>
          )}
          
          {isScanning && (
            <button
              onClick={stopCamera}
              className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700"
            >
              Stop Camera
            </button>
          )}
          
          {(faceMatched || !isScanning) && (
            <button
              onClick={onClose}
              className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700"
            >
              {faceMatched ? 'Close' : 'Cancel'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FaceScanPython;
