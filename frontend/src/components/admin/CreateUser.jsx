import { useState, useEffect } from 'react';
import axios from 'axios';
import FaceScanPython from '../FaceScanPython';

const CreateUser = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    labId: ''
  });
  const [labs, setLabs] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showFaceScan, setShowFaceScan] = useState(false);
  const [faceDescriptor, setFaceDescriptor] = useState(null);
  const [faceImage, setFaceImage] = useState(null); // Store the captured face image as base64

  useEffect(() => {
    fetchLabs();
  }, []);

  const fetchLabs = async () => {
    try {
      const response = await axios.get('/api/admin/labs');
      setLabs(response.data.labs);
    } catch (error) {
      console.error('Failed to fetch labs:', error);
    }
  };

  const handleFaceDetected = (...args) => {
    console.log('=== handleFaceDetected in CreateUser ===');
    console.log('All arguments received:', { count: args.length, allArgs: args });

    let descriptor = null;
    let capturedImage = null;

    // Extract descriptor and image from args
    args.forEach(arg => {
      if (typeof arg === 'string' && arg.startsWith('data:image')) {
        capturedImage = arg;
      } else if (arg !== true && arg !== false && arg !== null && typeof arg !== 'undefined') {
        // This might be the descriptor
        descriptor = arg;
      }
    });

    console.log('Extracted:', { hasDescriptor: !!descriptor, hasImage: !!capturedImage });

    if (capturedImage) {
      setFaceImage(capturedImage);
    }
    if (descriptor) {
      setFaceDescriptor(descriptor);
    }
    setShowFaceScan(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    
    if (!faceImage) {
      setError('Please scan your face for verification');
      return;
    }

    setLoading(true);

    try {
      // Send as JSON since faceImage is a base64 string, not a file
      const submitData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        labId: formData.labId,
        faceImage: faceImage // Send base64 image
      };
      
      if (faceDescriptor) {
        submitData.faceDescriptor = faceDescriptor;
      }

      await axios.post('/api/admin/create-user', submitData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      setMessage('User created successfully!');
      setFormData({ name: '', email: '', password: '', labId: '' });
      setFaceImage(null);
      setFaceDescriptor(null);
      if (onSuccess) onSuccess();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-white-800">Create User</h2>
      <div className="bg-white rounded-lg shadow-md p-6 max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          {message && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
              {message}
            </div>
          )}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Lab</label>
            <select
              value={formData.labId}
              onChange={(e) => setFormData({ ...formData, labId: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a lab</option>
              {labs.map((lab) => (
                <option key={lab.id} value={lab.id}>
                  {lab.name} - {lab.department}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="Enter user's full name"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              placeholder="Enter user's email"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              placeholder="Enter initial password"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">User will use this password to login</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Face Verification</label>
            <button
              type="button"
              onClick={() => setShowFaceScan(true)}
              className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed mb-2"
            >
              {faceImage ? '✓ Face Scanned - Click to Rescan' : 'Scan Face for Verification'}
            </button>
            {faceImage && (
              <div className="mt-2">
                <img
                  src={faceImage}
                  alt="Face Preview"
                  className="w-32 h-32 object-cover rounded-md border border-gray-300"
                />
              </div>
            )}
            <p className="text-xs text-gray-500 mt-1">Face scanning is required for user verification during item issuance</p>
          </div>
          <button
            type="submit"
            disabled={loading || labs.length === 0 || !faceImage}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating User...' : 'Create User'}
          </button>
        </form>
        {showFaceScan && (
          <FaceScanPython
            onFaceDetected={handleFaceDetected}
            onClose={() => setShowFaceScan(false)}
          />
        )}
      </div>
    </div>
  );
};

export default CreateUser;

