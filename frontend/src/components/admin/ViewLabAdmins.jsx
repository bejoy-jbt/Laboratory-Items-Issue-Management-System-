import { useState, useEffect } from 'react';
import axios from 'axios';

const ViewLabAdmins = () => {
  const [labAdmins, setLabAdmins] = useState([]);
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingLabs, setLoadingLabs] = useState(true);
  const [error, setError] = useState('');
  const [editingLabAdmin, setEditingLabAdmin] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', labId: '' });

  useEffect(() => {
    fetchLabAdmins();
    fetchLabs();
  }, []);

  const fetchLabAdmins = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/admin/lab-admins');
      setLabAdmins(response.data.labAdmins || []);
      setError('');
    } catch (error) {
      console.error('Failed to fetch lab admins:', error);
      setError('Failed to fetch lab admins. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchLabs = async () => {
    try {
      setLoadingLabs(true);
      const response = await axios.get('/api/admin/labs');
      setLabs(response.data.labs || []);
    } catch (error) {
      console.error('Failed to fetch labs:', error);
    } finally {
      setLoadingLabs(false);
    }
  };

  const handleEdit = (labAdmin) => {
    setEditingLabAdmin(labAdmin);
    setFormData({ 
      name: labAdmin.name, 
      email: labAdmin.email, 
      password: '',
      labId: labAdmin.lab?.id || ''
    });
    setError('');
  };

  const handleCancelEdit = () => {
    setEditingLabAdmin(null);
    setFormData({ name: '', email: '', password: '', labId: '' });
    setError('');
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const updateData = {
        name: formData.name,
        email: formData.email
      };

      // Only include password if it's provided
      if (formData.password) {
        updateData.password = formData.password;
      }

      // Only include labId if it's provided and different
      if (formData.labId && formData.labId !== editingLabAdmin.lab?.id) {
        updateData.labId = formData.labId;
      }

      await axios.put(`/api/admin/edit-lab-admin/${editingLabAdmin.id}`, updateData);
      await fetchLabAdmins();
      handleCancelEdit();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update lab admin');
    }
  };

  const handleDeleteClick = (labAdmin) => {
    setDeleteConfirm(labAdmin);
  };

  const handleDeleteConfirm = async () => {
    try {
      await axios.delete(`/api/admin/delete-lab-admin/${deleteConfirm.id}`);
      await fetchLabAdmins();
      setDeleteConfirm(null);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to delete lab admin');
      setDeleteConfirm(null);
    }
  };

  if (loading) {
    return (
      <div>
        <h2 className="text-2xl font-bold mb-6 text-gray-800">My Lab Admins</h2>
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center text-gray-500">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-gray-800">My Lab Admins</h2>
      
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {labAdmins.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-gray-600 mb-2">No lab admins found.</p>
            <p className="text-sm text-gray-500">Create lab admins for your labs to see them here.</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lab
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created At
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {labAdmins.map((labAdmin) => (
                <tr key={labAdmin.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {labAdmin.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {labAdmin.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {labAdmin.lab?.name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {labAdmin.lab?.department || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(labAdmin.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(labAdmin)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteClick(labAdmin)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Edit Modal */}
      {editingLabAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Edit Lab Admin</h3>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lab
                </label>
                <select
                  value={formData.labId}
                  onChange={(e) => setFormData({ ...formData, labId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  disabled={loadingLabs}
                  required
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password (leave blank to keep current)
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              {error && (
                <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
                  {error}
                </div>
              )}
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Confirm Delete</h3>
            <p className="mb-4">
              Are you sure you want to delete lab admin <strong>{deleteConfirm.name}</strong> ({deleteConfirm.email})?
            </p>
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
                {error}
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setDeleteConfirm(null);
                  setError('');
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewLabAdmins;

