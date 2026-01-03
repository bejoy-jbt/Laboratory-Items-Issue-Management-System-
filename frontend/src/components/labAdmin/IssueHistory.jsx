import { useState, useEffect } from 'react';
import axios from 'axios';

const IssueHistory = () => {
  const [issueRecords, setIssueRecords] = useState([]);
  const [loading, setLoading] = useState(true);

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
      fetchHistory();
    } catch (error) {
      console.error('Failed to return item:', error);
      alert(error.response?.data?.message || 'Failed to return item');
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Issue History</h2>
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Issue Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Est. Return</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Return Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {issueRecords.map((record) => (
              <tr key={record.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {record.user.name} ({record.user.email})
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{record.item.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {new Date(record.issueTime).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {record.estimatedReturnTime ? (
                    <span className={new Date(record.estimatedReturnTime) < new Date() && !record.returnTime 
                      ? 'text-red-600 font-semibold' 
                      : ''}>
                      {new Date(record.estimatedReturnTime).toLocaleString()}
                    </span>
                  ) : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {record.returnTime ? new Date(record.returnTime).toLocaleString() : '-'}
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
                      className="text-blue-600 hover:text-blue-800"
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
          <div className="text-center py-8 text-gray-500">No issue records found</div>
        )}
      </div>
    </div>
  );
};

export default IssueHistory;


