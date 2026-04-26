import { useState, useEffect } from 'react';
import axios from 'axios';
import ConfirmModal from '../ConfirmModal';
import NotificationModal from '../NotificationModal';
import FaceScanPython from '../FaceScanPython';

const IssuedItems = ({ onUpdate }) => {
  const [issueRecords, setIssueRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notification, setNotification] = useState({ type: 'success', message: '' });
  const [selectedRecordId, setSelectedRecordId] = useState(null);
  const [showFaceScan, setShowFaceScan] = useState(false);
  const [liveImage, setLiveImage] = useState(null);

  useEffect(() => {
    fetchIssuedItems();
  }, []);

  const fetchIssuedItems = async () => {
    try {
      const response = await axios.get('/api/user/issued-items');
      setIssueRecords(response.data.issueRecords);
    } catch (error) {
      console.error('Failed to fetch issued items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReturnClick = (issueRecordId) => {
    setSelectedRecordId(issueRecordId);
    setShowFaceScan(true); // Show face scan for verification
  };

  const handleFaceDetected = (...args) => {
    // Extract live image from args
    let capturedImage = null;
    args.forEach(arg => {
      if (typeof arg === 'string' && arg.startsWith('data:image')) {
        capturedImage = arg;
      }
    });

    if (capturedImage) {
      setLiveImage(capturedImage);
      setShowFaceScan(false);
      setShowConfirmModal(true); // Show confirmation after face is captured
    } else {
      setNotification({
        type: 'error',
        title: 'Error',
        message: 'Face verification image is required. Please try scanning your face again.'
      });
      setShowNotification(true);
      setShowFaceScan(false);
    }
  };

  const handleReturn = async () => {
    if (!liveImage) {
      setNotification({
        type: 'error',
        title: 'Error',
        message: 'Face verification is required. Please scan your face first.'
      });
      setShowNotification(true);
      return;
    }

    try {
      await axios.post(`/api/user/return/${selectedRecordId}`, {
        liveImage: liveImage // Send live image for face verification
      });
      setNotification({
        type: 'success',
        title: 'Success',
        message: 'Item returned successfully!'
      });
      setShowNotification(true);
      setLiveImage(null);
      setShowConfirmModal(false);
      fetchIssuedItems();
      if (onUpdate) onUpdate();
    } catch (error) {
      setNotification({
        type: 'error',
        title: 'Error',
        message: error.response?.data?.message || 'Failed to return item'
      });
      setShowNotification(true);
      setShowConfirmModal(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  const activeIssues = issueRecords.filter(r => !r.returnTime);
  const returnedIssues = issueRecords.filter(r => r.returnTime);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-slate-100">My Issued Items</h2>

      {activeIssues.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xl font-bold mb-4 text-slate-200">Active Issues</h3>
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50 text-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide">Item</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide">Issue Time</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide">Est. Return</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200 text-slate-800">
                {activeIssues.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50/80">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">
                      {record.item.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">{record.item.category}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                      {new Date(record.issueTime).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {record.estimatedReturnTime ? (
                        <span className={new Date(record.estimatedReturnTime) < new Date() 
                          ? 'text-red-600 font-semibold' 
                          : 'text-slate-700'}>
                          {new Date(record.estimatedReturnTime).toLocaleString()}
                          {new Date(record.estimatedReturnTime) < new Date() && (
                            <span className="ml-2 text-xs text-red-600">(Overdue)</span>
                          )}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleReturnClick(record.id)}
                        className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                      >
                        Return Item
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {returnedIssues.length > 0 && (
        <div>
          <h3 className="text-xl font-bold mb-4 text-slate-200">Returned Items</h3>
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50 text-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide">Item</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide">Issue Time</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide">Est. Return</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide">Return Time</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200 text-slate-800">
                {returnedIssues.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50/80">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">
                      {record.item.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">{record.item.category}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                      {new Date(record.issueTime).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                      {record.estimatedReturnTime ? new Date(record.estimatedReturnTime).toLocaleString() : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                      {new Date(record.returnTime).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {issueRecords.length === 0 && (
        <div className="text-center py-8 text-slate-700 bg-white rounded-lg shadow-md">
          No issued items found
        </div>
      )}

      {showFaceScan && (
        <FaceScanPython
          onFaceDetected={handleFaceDetected}
          onClose={() => {
            setShowFaceScan(false);
            setSelectedRecordId(null);
          }}
          mode="verify"
          title="Face Verification Required"
          message="Please scan your face to verify your identity before returning the item."
        />
      )}

      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => {
          setShowConfirmModal(false);
          setLiveImage(null);
          setSelectedRecordId(null);
        }}
        onConfirm={handleReturn}
        title="Return Item"
        message="Are you sure you want to return this item? Face verification will be performed."
        confirmText="Return"
        cancelText="Cancel"
        type="info"
      />

      <NotificationModal
        isOpen={showNotification}
        onClose={() => setShowNotification(false)}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        duration={4000}
      />
    </div>
  );
};

export default IssuedItems;


