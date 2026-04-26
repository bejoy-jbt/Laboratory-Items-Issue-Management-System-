import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import FaceScanPython from '../FaceScanPython';

const AvailableItems = () => {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFaceScan, setShowFaceScan] = useState(false);
  const [showReturnTimeModal, setShowReturnTimeModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [estimatedReturnTime, setEstimatedReturnTime] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [currentUserData, setCurrentUserData] = useState(null);
  const [authMessage, setAuthMessage] = useState('');

  useEffect(() => {
    fetchItems();
    fetchCurrentUserData();
  }, []);

  const fetchCurrentUserData = async () => {
    try {
      const response = await axios.get('/api/auth/me');
      if (response.data.user) {
        setCurrentUserData(response.data.user);
      }
    } catch (error) {
      console.error('Failed to fetch current user data:', error);
    }
  };

  const fetchItems = async () => {
    try {
      // includeIssued lets us show "issued by someone else" in the list
      const response = await axios.get('/api/user/items?includeIssued=1');
      setItems(response.data.items);
    } catch (error) {
      console.error('Failed to fetch items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleIssueItem = (item) => {
    setSelectedItem(item);
    setShowReturnTimeModal(true);
    setError('');
    setMessage('');
  };

  const handleFaceDetected = async (...args) => {
    console.log('=== handleFaceDetected CALLED ===');
    console.log('All arguments received:', {
      count: args.length,
      arg0: args[0],
      arg1: args[1],
      arg2: args[2],
      arg3: args[3],
      arg0Type: typeof args[0],
      arg1Type: typeof args[1],
      arg2Type: typeof args[2]
    });
    
    // Extract parameters - handle different calling patterns
    const descriptor = args[0];
    const authSuccessMessage = args[1];
    let liveImage = args[2];
    
    // If third param is not an image, check if second param is the image
    if (!liveImage || (typeof liveImage !== 'string' || !liveImage.startsWith('data:image'))) {
      // Check if args[1] is actually the image
      if (args[1] && typeof args[1] === 'string' && args[1].startsWith('data:image')) {
        liveImage = args[1];
        console.log('Found image in second parameter position');
      } else if (args.length >= 3) {
        // Check all remaining arguments
        for (let i = 2; i < args.length; i++) {
          if (args[i] && typeof args[i] === 'string' && args[i].startsWith('data:image')) {
            liveImage = args[i];
            console.log(`Found image in argument position ${i}`);
            break;
          }
        }
      }
    }
    
    console.log('Extracted parameters:', {
      descriptor: !!descriptor,
      authMessage: authSuccessMessage,
      liveImage: !!liveImage,
      liveImageLength: liveImage?.length,
      liveImageType: typeof liveImage
    });
    
    // Close face scan first
    setShowFaceScan(false);
    
    if (!estimatedReturnTime) {
      setError('Please select an estimated return time');
      return;
    }

    // Validate that we have the live image for backend verification
    if (!liveImage || typeof liveImage !== 'string' || !liveImage.startsWith('data:image') || liveImage.length < 1000) {
      setError('Face verification image is required. Please try scanning your face again.');
      console.error('✗ Live image not provided or invalid:', {
        hasLiveImage: !!liveImage,
        type: typeof liveImage,
        length: liveImage?.length,
        startsWith: liveImage?.substring(0, 20),
        allArgs: args
      });
      return;
    }
    
    console.log('✓ Live image validated. Using image with length:', liveImage.length);

    // Additional validation
    if (typeof liveImage !== 'string' || liveImage.length < 100) {
      setError('Invalid face verification image. Please try scanning again.');
      console.error('Invalid live image:', {
        type: typeof liveImage,
        length: liveImage?.length,
        startsWith: liveImage?.substring(0, 20)
      });
      return;
    }

    console.log('Issuing item with face verification. Image length:', liveImage.length);

    try {
      // Issue the item - backend will verify face matches registered user's face
      const response = await axios.post(`/api/user/issue/${selectedItem.id}`, {
        estimatedReturnTime,
        faceDescriptor: descriptor,
        liveImage: liveImage // Send live image for backend verification
      });
      
      console.log('Item issued successfully after face verification');
      
      // Close face scan
      setShowFaceScan(false);
      
      // Show authentication message first if available
      if (authSuccessMessage) {
        setAuthMessage(authSuccessMessage);
        // After 3 seconds, show item issued message
        setTimeout(() => {
          setAuthMessage('');
          setMessage('Item issued successfully!');
        }, 3000);
      } else {
        setMessage('Item issued successfully!');
      }
      
      setSelectedItem(null);
      setEstimatedReturnTime('');
      fetchItems();
    } catch (error) {
      setShowFaceScan(false);
      setError(error.response?.data?.message || 'Failed to issue item');
      setAuthMessage('');
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">Items</h2>
          <p className="text-sm text-slate-400 mt-1">
            Available items can be issued. Issued items are shown for visibility.
          </p>
        </div>
        <div className="flex gap-2 text-xs">

        </div>
      </div>
      
      {authMessage && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-100 px-4 py-3 rounded-xl mb-4 font-semibold">
          ✓ {authMessage}
        </div>
      )}
      {message && !authMessage && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-100 px-4 py-3 rounded-xl mb-4">
          {message}
        </div>
      )}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-100 px-4 py-3 rounded-xl mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => (
          <div
            key={item.id}
            className="rounded-2xl p-6 border border-white/10 bg-white/5 backdrop-blur-md shadow-[0_10px_30px_rgba(0,0,0,0.35)]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-slate-100 mb-1">{item.name}</h3>
                <p className="text-slate-300 mb-2">
                  <span className="font-medium text-slate-200">Category:</span> {item.category}
                </p>
              </div>
              <span
                className={`shrink-0 px-2 py-1 text-xs rounded-full border ${
                  item.status === 'AVAILABLE'
                    ? 'bg-emerald-500/15 text-emerald-200 border-emerald-500/30'
                    : item.status === 'ISSUED'
                    ? 'bg-amber-500/15 text-amber-200 border-amber-500/30'
                    : item.status === 'MAINTENANCE'
                    ? 'bg-rose-500/15 text-rose-200 border-rose-500/30'
                    : 'bg-slate-500/10 text-slate-200 border-white/10'
                }`}
              >
                {item.status}
              </span>
            </div>

            {item.description && (
              <p className="text-slate-300 mb-4">{item.description}</p>
            )}

            {item.status === 'ISSUED' && item.activeIssue?.user && (
              <div className="mb-4 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3">
                <p className="text-sm text-amber-100 font-semibold">
                  Currently issued to {item.activeIssue.user.name}
                </p>
                <p className="text-xs text-amber-200/80 mt-1">
                  Issued: {item.activeIssue.issueTime ? new Date(item.activeIssue.issueTime).toLocaleString() : '-'}
                  {item.activeIssue.estimatedReturnTime
                    ? ` • Est. return: ${new Date(item.activeIssue.estimatedReturnTime).toLocaleString()}`
                    : ''}
                </p>
              </div>
            )}

            <button
              onClick={() => handleIssueItem(item)}
              disabled={item.status !== 'AVAILABLE'}
              className="w-full py-2.5 px-4 rounded-xl font-semibold transition
                bg-cyan-500 text-slate-950 hover:bg-cyan-400
                disabled:bg-white/10 disabled:text-slate-400 disabled:cursor-not-allowed disabled:hover:bg-white/10"
            >
              {item.status === 'AVAILABLE' ? 'Issue Item' : 'Not Available'}
            </button>
          </div>
        ))}
      </div>
      {items.length === 0 && (
        <div className="text-center py-10 text-slate-300 bg-white/5 border border-white/10 rounded-2xl">
          No items found
        </div>
      )}

      {showReturnTimeModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-slate-950/80 border border-white/10 rounded-2xl p-6 max-w-md w-full mx-4 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
            <h3 className="text-xl font-bold mb-4 text-slate-100">Issue Item: {selectedItem.name}</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-200 mb-2">
                Estimated Return Time
              </label>
              <input
                type="datetime-local"
                value={estimatedReturnTime}
                onChange={(e) => setEstimatedReturnTime(e.target.value)}
                required
                min={new Date().toISOString().slice(0, 16)}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-100
                  focus:outline-none focus:ring-2 focus:ring-cyan-400/60"
              />
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowReturnTimeModal(false);
                  setSelectedItem(null);
                  setEstimatedReturnTime('');
                }}
                className="flex-1 bg-white/10 text-slate-100 py-2.5 px-4 rounded-xl hover:bg-white/15 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (estimatedReturnTime) {
                    setShowReturnTimeModal(false);
                    setShowFaceScan(true);
                  } else {
                    setError('Please select an estimated return time');
                  }
                }}
                disabled={!estimatedReturnTime}
                className="flex-1 bg-cyan-500 text-slate-950 py-2.5 px-4 rounded-xl hover:bg-cyan-400
                  disabled:bg-white/10 disabled:text-slate-400 disabled:hover:bg-white/10 transition"
              >
                Proceed to Face Scan
              </button>
            </div>
          </div>
        </div>
      )}

      {showFaceScan && selectedItem && estimatedReturnTime && (
        <FaceScanPython
          onFaceDetected={handleFaceDetected}
          onClose={() => {
            setShowFaceScan(false);
            setShowReturnTimeModal(false);
            setSelectedItem(null);
            setEstimatedReturnTime('');
          }}
          userId={currentUserData?.id || user?.id}
          userName={currentUserData?.name || user?.name}
          userImageUrl={currentUserData?.imageUrl}
          userEncoding={currentUserData?.faceDescriptor}
        />
      )}
    </div>
  );
};

export default AvailableItems;



