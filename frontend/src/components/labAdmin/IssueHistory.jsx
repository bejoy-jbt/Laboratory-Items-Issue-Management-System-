import { useState, useEffect } from 'react';
import axios from 'axios';
import NotificationModal from '../NotificationModal';

const IssueHistory = () => {
  const [issueRecords, setIssueRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNotification, setShowNotification] = useState(false);
  const [notification, setNotification] = useState({ type: 'success', message: '' });

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await axios.get('/api/lab-admin/issue-history');
      setIssueRecords(response.data.issueRecords);
    } catch (error) {
      console.error('Failed to fetch issue history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReturn = async (issueRecordId) => {
    try {
      await axios.post(`/api/lab-admin/return/${issueRecordId}`);
      setNotification({
        type: 'success',
        title: 'Success',
        message: 'Item marked as returned successfully!'
      });
      setShowNotification(true);
      fetchHistory();
    } catch (error) {
      console.error('Failed to return item:', error);
      setNotification({
        type: 'error',
        title: 'Error',
        message: error.response?.data?.message || 'Failed to return item'
      });
      setShowNotification(true);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-extrabold tracking-tight mb-6 text-slate-100">Issue History</h2>
      <div className="bg-white rounded-lg shadow-md overflow-hidden text-gray-900">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50 text-slate-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide">User</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide">Item</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide">Issue Time</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide">Est. Return</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide">Return Time</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide">Issue Verification</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide">Return Verification</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide">Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200 text-slate-900">
            {issueRecords.map((record) => (
              <tr key={record.id} className="hover:bg-slate-50/80">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                  {record.user.name} ({record.user.email})
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">
                  {record.item.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                  {new Date(record.issueTime).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                  {record.estimatedReturnTime ? (
                    <span className={new Date(record.estimatedReturnTime) < new Date() && !record.returnTime 
                      ? 'text-red-600 font-semibold' 
                      : ''}>
                      {new Date(record.estimatedReturnTime).toLocaleString()}
                    </span>
                  ) : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                  {record.returnTime ? new Date(record.returnTime).toLocaleString() : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded font-semibold ${
                    record.issueVerificationStatus === 'VERIFIED'
                      ? 'bg-green-100 text-green-800'
                      : record.issueVerificationStatus === 'FAILED'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {record.issueVerificationStatus || 'PENDING'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {record.returnTime ? (
                    <span className={`px-2 py-1 text-xs rounded font-semibold ${
                      record.returnVerificationStatus === 'VERIFIED'
                        ? 'bg-green-100 text-green-800'
                        : record.returnVerificationStatus === 'FAILED'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {record.returnVerificationStatus || 'PENDING'}
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-xs text-slate-600">-</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded ${
                    record.returnTime 
                      ? 'bg-green-100 text-green-800' 
                      : record.estimatedReturnTime && new Date(record.estimatedReturnTime) < new Date()
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {record.returnTime 
                      ? 'Returned' 
                      : record.estimatedReturnTime && new Date(record.estimatedReturnTime) < new Date()
                      ? 'Overdue'
                      : 'Active'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {!record.returnTime && (
                    <button
                      onClick={() => handleReturn(record.id)}
                      className="text-blue-700 hover:text-blue-900 font-semibold"
                    >
                      Mark Returned
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {issueRecords.length === 0 && (
          <div className="text-center py-8 text-slate-700">No issue records found</div>
        )}
      </div>

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

export default IssueHistory;


