import { useState, useEffect } from 'react';
import axios from 'axios';

const AssignAdmin = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    labId: '',
    empId: ''
  });
  const [labs, setLabs] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [labsRes, adminsRes] = await Promise.all([
        axios.get('/api/super-admin/labs'),
        axios.get('/api/super-admin/admins')
      ]);
      setLabs(labsRes.data.labs);
      setAdmins(adminsRes.data.admins);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      await axios.put(`/api/super-admin/assign-admin/${formData.labId}`, {
        empId: formData.empId
      });
      setMessage('Admin assigned to lab successfully!');
      setFormData({ labId: '', empId: '' });
      if (onSuccess) onSuccess();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to assign admin');
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-white-800">Assign Admin to Lab</h2>
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
              className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Admin</label>
            <select
              value={formData.empId}
              onChange={(e) => setFormData({ ...formData, empId: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select an admin</option>
              {admins.map((admin) => (
                <option key={admin.id} value={admin.id}>
                  {admin.name} ({admin.email})
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
          >
            Assign Admin
          </button>
        </form>
      </div>
    </div>
  );
};

export default AssignAdmin;

