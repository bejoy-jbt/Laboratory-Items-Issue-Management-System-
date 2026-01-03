import { useState, useEffect } from 'react';
import axios from 'axios';

const IssueItems = ({ onUpdate }) => {
  const [items, setItems] = useState([]);
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({
    itemId: '',
    userId: '',
    estimatedReturnTime: ''
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [itemsRes, usersRes] = await Promise.all([
        axios.get('/api/lab-admin/items'),
        axios.get('/api/lab-admin/users')
      ]);
      setItems(itemsRes.data.items.filter(item => item.status === 'AVAILABLE'));
      setUsers(usersRes.data.users || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (!formData.itemId || !formData.userId) {
      setError('Please select an item and a user');
      return;
    }

    if (!formData.estimatedReturnTime) {
      setError('Please select an estimated return time');
      return;
    }

    try {
      await axios.post('/api/lab-admin/issue', formData);
      setMessage('Item issued successfully!');
      setFormData({ itemId: '', userId: '', estimatedReturnTime: '' });
      fetchData();
      if (onUpdate) onUpdate();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to issue item');
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Issue Items</h2>

      {message && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {message}
        </div>
      )}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-xl font-bold mb-4">Issue Item to User</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Item</label>
            <select
              value={formData.itemId}
              onChange={(e) => setFormData({ ...formData, itemId: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select an item</option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} - {item.category}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select User</label>
            <select
              value={formData.userId}
              onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a user</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.email})
                </option>
              ))}
            </select>
            {users.length === 0 && (
              <p className="text-xs text-yellow-600 mt-1">No users found in your lab. Users must be assigned to your lab first.</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Estimated Return Time</label>
            <input
              type="datetime-local"
              value={formData.estimatedReturnTime}
              onChange={(e) => setFormData({ ...formData, estimatedReturnTime: e.target.value })}
              required
              min={new Date().toISOString().slice(0, 16)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Select when the item should be returned</p>
          </div>
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Issue Item
          </button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold mb-4">Available Items</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{item.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.category}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{item.description || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {items.length === 0 && (
            <div className="text-center py-8 text-gray-500">No available items</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IssueItems;

