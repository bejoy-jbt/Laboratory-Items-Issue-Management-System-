import { useState, useEffect } from 'react';
import axios from 'axios';

const ViewItems = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterLab, setFilterLab] = useState('ALL');

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/super-admin/items');
      setItems(response.data.items || []);
      setError('');
    } catch (error) {
      console.error('Failed to fetch items:', error);
      setError('Failed to fetch items. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-green-100 text-green-800';
      case 'ISSUED':
        return 'bg-yellow-100 text-yellow-800';
      case 'MAINTENANCE':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get unique labs for filter
  const uniqueLabs = [...new Set(items.map(item => item.lab?.id).filter(Boolean))];
  const labMap = {};
  items.forEach(item => {
    if (item.lab?.id) {
      labMap[item.lab.id] = item.lab;
    }
  });

  // Filter items
  const filteredItems = items.filter(item => {
    const statusMatch = filterStatus === 'ALL' || item.status === filterStatus;
    const labMatch = filterLab === 'ALL' || item.lab?.id === filterLab;
    return statusMatch && labMatch;
  });

  // Get status counts
  const statusCounts = {
    ALL: items.length,
    AVAILABLE: items.filter(i => i.status === 'AVAILABLE').length,
    ISSUED: items.filter(i => i.status === 'ISSUED').length,
    MAINTENANCE: items.filter(i => i.status === 'MAINTENANCE').length
  };

  if (loading) {
    return (
      <div>
        <h2 className="text-2xl font-bold mb-6 text-gray-800">All Items</h2>
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center text-gray-500">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-white-800">All Items</h2>
      
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Status Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="text-sm text-gray-500">Total Items</div>
          <div className="text-2xl font-bold text-gray-800">{statusCounts.ALL}</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="text-sm text-gray-500">Available</div>
          <div className="text-2xl font-bold text-green-600">{statusCounts.AVAILABLE}</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="text-sm text-gray-500">Issued</div>
          <div className="text-2xl font-bold text-yellow-600">{statusCounts.ISSUED}</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="text-sm text-gray-500">Maintenance</div>
          <div className="text-2xl font-bold text-red-600">{statusCounts.MAINTENANCE}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Statuses ({statusCounts.ALL})</option>
              <option value="AVAILABLE">Available ({statusCounts.AVAILABLE})</option>
              <option value="ISSUED">Issued ({statusCounts.ISSUED})</option>
              <option value="MAINTENANCE">Maintenance ({statusCounts.MAINTENANCE})</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Lab</label>
            <select
              value={filterLab}
              onChange={(e) => setFilterLab(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Labs</option>
              {uniqueLabs.map((labId) => {
                const lab = labMap[labId];
                return (
                  <option key={labId} value={labId}>
                    {lab?.name} - {lab?.department}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {filteredItems.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-gray-600 mb-2">No items found.</p>
            <p className="text-sm text-gray-500">Try adjusting your filters.</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lab
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Admin
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Issues
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created At
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredItems.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.category || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.lab?.name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.lab?.department || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.lab?.admin?.name || 'N/A'} ({item.lab?.admin?.email || 'N/A'})
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item._count?.issueRecords || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ViewItems;

