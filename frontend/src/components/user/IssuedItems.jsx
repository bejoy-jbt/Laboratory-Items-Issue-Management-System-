import { useState, useEffect } from 'react';
import axios from 'axios';

const IssuedItems = ({ onUpdate }) => {
  const [issueRecords, setIssueRecords] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const handleReturn = async (issueRecordId) => {
    if (!window.confirm('Are you sure you want to return this item?')) {
      return;
    }

    try {
      await axios.post(`/api/user/return/${issueRecordId}`);
      alert('Item returned successfully!');
      fetchIssuedItems();
      if (onUpdate) onUpdate();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to return item');
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  const activeIssues = issueRecords.filter(r => !r.returnTime);
  const returnedIssues = issueRecords.filter(r => r.returnTime);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-gray-800">My Issued Items</h2>

      {activeIssues.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xl font-bold mb-4 text-gray-700">Active Issues</h3>
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Issue Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Est. Return</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {activeIssues.map((record) => (
                  <tr key={record.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{record.item.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.item.category}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(record.issueTime).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {record.estimatedReturnTime ? (
                        <span className={new Date(record.estimatedReturnTime) < new Date() 
                          ? 'text-red-600 font-semibold' 
                          : 'text-gray-600'}>
                          {new Date(record.estimatedReturnTime).toLocaleString()}
                          {new Date(record.estimatedReturnTime) < new Date() && (
                            <span className="ml-2 text-xs text-red-600">(Overdue)</span>
                          )}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleReturn(record.id)}
                        className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
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
          <h3 className="text-xl font-bold mb-4 text-gray-700">Returned Items</h3>
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Issue Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Est. Return</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Return Time</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {returnedIssues.map((record) => (
                  <tr key={record.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{record.item.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.item.category}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(record.issueTime).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.estimatedReturnTime ? new Date(record.estimatedReturnTime).toLocaleString() : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
        <div className="text-center py-8 text-gray-500 bg-white rounded-lg shadow-md">
          No issued items found
        </div>
      )}
    </div>
  );
};

export default IssuedItems;


