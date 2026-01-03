import { useState, useEffect } from 'react';
import axios from 'axios';

const CreateLab = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    department: '',
    empId: ''
  });
  const [admins, setAdmins] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingAdmins, setLoadingAdmins] = useState(true);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      setLoadingAdmins(true);
      const response = await axios.get('/api/super-admin/admins');
      setAdmins(response.data.admins || []);
    } catch (error) {
      console.error('Failed to fetch admins:', error);
      setError('Failed to load admins. Please refresh the page.');
    } finally {
      setLoadingAdmins(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('/api/super-admin/create-lab', formData);
      setMessage('Lab created successfully!');
      setFormData({ name: '', department: '', empId: '' });
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Create lab error:', error);
      setError(error.response?.data?.message || 'Failed to create lab. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loadingAdmins) {
    return (
      <div>
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Create Lab</h2>
        <div className="bg-white rounded-lg shadow-md p-6 max-w-md">
          <div className="text-center py-8">
            <div className="text-gray-600">Loading admins...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Create Lab</h2>
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Lab Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="Enter lab name"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
            <input
              type="text"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              required
              placeholder="Enter department name"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Admin</label>
            <select
              value={formData.empId}
              onChange={(e) => setFormData({ ...formData, empId: e.target.value })}
              required
              disabled={loadingAdmins || admins.length === 0}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">
                {loadingAdmins ? 'Loading admins...' : admins.length === 0 ? 'No admins available' : 'Select an admin'}
              </option>
              {admins.map((admin) => (
                <option key={admin.id} value={admin.id}>
                  {admin.name} ({admin.email})
                </option>
              ))}
            </select>
            {admins.length === 0 && !loadingAdmins && (
              <p className="text-sm text-red-600 mt-1">Please create an admin first before creating a lab.</p>
            )}
          </div>
          <button
            type="submit"
            disabled={loading || admins.length === 0}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating Lab...' : 'Create Lab'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateLab;

