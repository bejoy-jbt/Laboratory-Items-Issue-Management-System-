import { useState, useRef, useEffect } from 'react';
import * as faceapi from 'face-api.js';

const FaceScan = ({ onFaceDetected, onClose, userId, userImageUrl }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [faceMatched, setFaceMatched] = useState(false);
  const [liveDescriptor, setLiveDescriptor] = useState([]);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    loadModels();
    return () => {
      stopCamera();
    };
  }, []);

  const loadModels = async () => {
    try {
      setIsLoading(true);
      const MODEL_URL = '/models';
      
      // Load face detection and recognition models
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)
      ]);
      
      setIsLoading(false);
      setMessage('Models loaded. Click "Start Scan" to begin face verification.');
    } catch (err) {
      console.error('Error loading models:', err);
      setError('Failed to load face recognition models. Please ensure models are available in /public/models directory.');
      setIsLoading(false);
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
      
      // Start face detection
      detectFace();
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
    setLiveDescriptor([]);
    setIsScanning(false);
  };

  const detectFace = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const displaySize = { width: video.width, height: video.height };

    faceapi.matchDimensions(canvas, displaySize);

    intervalRef.current = setInterval(async () => {
      if (!video || video.readyState !== video.HAVE_ENOUGH_DATA) return;

      const detections = await faceapi
        .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptors();

      const resizedDetections = faceapi.resizeResults(detections, displaySize);
      
      // Clear canvas
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw detections
      faceapi.draw.drawDetections(canvas, resizedDetections);
      faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);

      if (detections.length > 0) {
        const descriptor = detections[0].descriptor;
        setLiveDescriptor(Array.from(descriptor));
        
        // If we have a user image to compare with
        if (userId && userImageUrl) {
          try {
            const match = await compareWithUserImage(descriptor, userImageUrl);
            if (match) {
              setFaceMatched(true);
              setMessage('Face verified successfully!');
              stopCamera();
              if (onFaceDetected) {
                onFaceDetected(descriptor);
              }
            }
          } catch (err) {
            console.error('Error comparing faces:', err);
          }
        } else {
          // Just detect face without comparison
          if (detections.length === 1) {
            setMessage('Face detected. Click "Verify" to proceed.');
          } else if (detections.length > 1) {
            setMessage('Multiple faces detected. Please ensure only one person is in the frame.');
          }
        }
      } else {
        setLiveDescriptor([]);
        setMessage('No face detected. Please position your face in the frame.');
      }
    }, 100);
  };

  const compareWithUserImage = async (liveDescriptor, userImageUrl) => {
    try {
      // Load user image
      const userImage = await faceapi.fetchImage(userImageUrl);
      
      // Detect face in user image
      const userDetections = await faceapi
        .detectAllFaces(userImage, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptors();

      if (userDetections.length === 0) {
        throw new Error('No face found in user image');
      }

      const userDescriptor = userDetections[0].descriptor;
      
      // Calculate distance between descriptors
      const distance = faceapi.euclideanDistance(liveDescriptor, userDescriptor);
      
      // Threshold for face matching (lower is more strict)
      const threshold = 0.6;
      
      return distance < threshold;
    } catch (err) {
      console.error('Error comparing with user image:', err);
      return false;
    }
  };

  const handleVerify = async () => {
    if (!videoRef.current) return;

    try {
      const detections = await faceapi
        .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptors();

      if (detections.length === 0) {
        setError('No face detected. Please try again.');
        return;
      }

      if (detections.length > 1) {
        setError('Multiple faces detected. Please ensure only one person is in the frame.');
        return;
      }

      const descriptor = detections[0].descriptor;
      
      // Convert descriptor to base64 for storage
      const descriptorArray = Array.from(descriptor);
      const descriptorBase64 = btoa(JSON.stringify(descriptorArray));
      
      setFaceMatched(true);
      setMessage('Face verified successfully!');
      stopCamera();
      
      if (onFaceDetected) {
        onFaceDetected(descriptorBase64);
      }
    } catch (err) {
      console.error('Error verifying face:', err);
      setError('Failed to verify face. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
        <h2 className="text-2xl font-bold mb-4">Face Verification</h2>
        
        {isLoading && (
          <div className="text-center py-8">
            <p>Loading face recognition models...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {message && !error && (
          <div className={`bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4 ${faceMatched ? 'bg-green-100 border-green-400 text-green-700' : ''}`}>
            {message}
          </div>
        )}

        <div className="relative mb-4">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full rounded-lg"
            style={{ display: isScanning ? 'block' : 'none' }}
          />
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 w-full rounded-lg"
            style={{ display: isScanning ? 'block' : 'none' }}
          />
          {!isScanning && (
            <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">Camera not started</p>
            </div>
          )}
        </div>

        {isScanning && liveDescriptor.length > 0 && (
          <div className="mb-4 rounded-lg border border-gray-300 bg-gray-50 p-3">
            <p className="mb-2 text-sm font-semibold text-gray-800">
              Realtime 128-d Descriptor Vector
            </p>
            <div className="max-h-32 overflow-y-auto rounded bg-white p-2 font-mono text-xs text-gray-700">
              [{liveDescriptor.map((value) => value.toFixed(5)).join(', ')}]
            </div>
          </div>
        )}

        <div className="flex gap-4">
          {!isScanning && !faceMatched && (
            <button
              onClick={startCamera}
              disabled={isLoading}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            >
              Start Scan
            </button>
          )}
          
          {isScanning && !faceMatched && (
            <button
              onClick={handleVerify}
              className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
            >
              Verify Face
            </button>
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

export default FaceScan;

