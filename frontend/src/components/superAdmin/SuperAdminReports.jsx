import { useState, useEffect } from 'react';
import axios from 'axios';

const SuperAdminReports = () => {
  const [reportType, setReportType] = useState('overview'); // 'overview', 'admin', 'lab'
  const [admins, setAdmins] = useState([]);
  const [labs, setLabs] = useState([]);
  const [selectedAdmin, setSelectedAdmin] = useState('');
  const [selectedLab, setSelectedLab] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [adminsRes, labsRes] = await Promise.all([
        axios.get('/api/super-admin/admins'),
        axios.get('/api/super-admin/labs')
      ]);
      setAdmins(adminsRes.data.admins || []);
      setLabs(labsRes.data.labs || []);
    } catch (error) {
      console.error('Failed to fetch initial data:', error);
    }
  };

  const fetchReport = async () => {
    setLoading(true);
    try {
      let url = '/api/super-admin/reports';
      const params = new URLSearchParams();
      
      if (reportType === 'admin' && selectedAdmin) {
        params.append('adminId', selectedAdmin);
      } else if (reportType === 'lab' && selectedLab) {
        params.append('labId', selectedLab);
      }
      
      if (params.toString()) {
        url += '?' + params.toString();
      }
      
      const response = await axios.get(url);
      setReport(response.data);
    } catch (error) {
      console.error('Failed to fetch report:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (reportType === 'overview' || (reportType === 'admin' && selectedAdmin) || (reportType === 'lab' && selectedLab)) {
      fetchReport();
    }
  }, [reportType, selectedAdmin, selectedLab]);

  const handleReportTypeChange = (e) => {
    setReportType(e.target.value);
    setSelectedAdmin('');
    setSelectedLab('');
    setReport(null);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-gray-800">System Reports</h2>
      
      <div className="mb-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
          <select
            value={reportType}
            onChange={handleReportTypeChange}
            className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="overview">System Overview</option>
            <option value="admin">Admin Report</option>
            <option value="lab">Lab Report</option>
          </select>
        </div>

        {reportType === 'admin' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Admin</label>
            <select
              value={selectedAdmin}
              onChange={(e) => setSelectedAdmin(e.target.value)}
              className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select an admin</option>
              {admins.map((admin) => (
                <option key={admin.id} value={admin.id}>
                  {admin.name} ({admin.email})
                </option>
              ))}
            </select>
          </div>
        )}

        {reportType === 'lab' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Lab</label>
            <select
              value={selectedLab}
              onChange={(e) => setSelectedLab(e.target.value)}
              className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a lab</option>
              {labs.map((lab) => (
                <option key={lab.id} value={lab.id}>
                  {lab.name} - {lab.department}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {report && (
        <div className="space-y-6">
          {/* Overview Report */}
          {report.type === 'overview' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <div className="bg-white rounded-lg shadow-md p-4">
                  <p className="text-sm text-gray-600">Total Admins</p>
                  <p className="text-2xl font-bold">{report.stats.totalAdmins}</p>
                </div>
                <div className="bg-white rounded-lg shadow-md p-4">
                  <p className="text-sm text-gray-600">Total Labs</p>
                  <p className="text-2xl font-bold">{report.stats.totalLabs}</p>
                </div>
                <div className="bg-white rounded-lg shadow-md p-4">
                  <p className="text-sm text-gray-600">Total Items</p>
                  <p className="text-2xl font-bold">{report.stats.totalItems}</p>
                </div>
                <div className="bg-white rounded-lg shadow-md p-4">
                  <p className="text-sm text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold">{report.stats.totalUsers}</p>
                </div>
                <div className="bg-white rounded-lg shadow-md p-4">
                  <p className="text-sm text-gray-600">Active Issues</p>
                  <p className="text-2xl font-bold text-red-600">{report.stats.activeIssues}</p>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-bold mb-4">Admins Overview</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Labs Managed</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created At</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {report.admins.map((admin) => (
                        <tr key={admin.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{admin.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">{admin.email}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">{admin.labCount}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {new Date(admin.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h3 className="text-xl font-bold mb-4">Labs Overview</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Admin</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Users</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {report.labs.map((lab) => (
                        <tr key={lab.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{lab.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">{lab.department}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {lab.admin?.name} ({lab.admin?.email})
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">{lab._count?.items || 0}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">{lab._count?.users || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {report.users && report.users.length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                  <h3 className="text-xl font-bold mb-4">All Users</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lab</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Admin</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created At</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {report.users.map((user) => (
                          <tr key={user.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{user.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">{user.email}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">{user.lab?.name || 'N/A'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">{user.lab?.department || 'N/A'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {user.lab?.admin?.name || 'N/A'} ({user.lab?.admin?.email || 'N/A'})
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {new Date(user.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {report.labAdmins && report.labAdmins.length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                  <h3 className="text-xl font-bold mb-4">All Lab Admins</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lab</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created At</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {report.labAdmins.map((labAdmin) => (
                          <tr key={labAdmin.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{labAdmin.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">{labAdmin.email}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">{labAdmin.lab?.name || 'N/A'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">{labAdmin.lab?.department || 'N/A'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {new Date(labAdmin.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {report.items && report.items.length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-xl font-bold mb-4">All Items</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lab</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Issues</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {report.items.map((item) => (
                          <tr key={item.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{item.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">{item.category || 'N/A'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">{item.lab?.name || 'N/A'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">{item.lab?.department || 'N/A'}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs rounded ${
                                item.status === 'AVAILABLE' ? 'bg-green-100 text-green-800' :
                                item.status === 'ISSUED' ? 'bg-yellow-100 text-yellow-800' :
                                item.status === 'MAINTENANCE' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {item.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">{item._count?.issueRecords || 0}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Admin Report */}
          {report.type === 'admin' && (
            <>
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h3 className="text-xl font-bold mb-2">Admin Details</h3>
                <p><strong>Name:</strong> {report.admin.name}</p>
                <p><strong>Email:</strong> {report.admin.email}</p>
                <p><strong>Created:</strong> {new Date(report.admin.createdAt).toLocaleDateString()}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow-md p-4">
                  <p className="text-sm text-gray-600">Labs Managed</p>
                  <p className="text-2xl font-bold">{report.stats.totalLabs}</p>
                </div>
                <div className="bg-white rounded-lg shadow-md p-4">
                  <p className="text-sm text-gray-600">Total Items</p>
                  <p className="text-2xl font-bold">{report.stats.totalItems}</p>
                </div>
                <div className="bg-white rounded-lg shadow-md p-4">
                  <p className="text-sm text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold">{report.stats.totalUsers}</p>
                </div>
                <div className="bg-white rounded-lg shadow-md p-4">
                  <p className="text-sm text-gray-600">Active Issues</p>
                  <p className="text-2xl font-bold text-red-600">{report.stats.activeIssues}</p>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h3 className="text-xl font-bold mb-4">Labs Managed</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Users</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Issues</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {report.labs.map((lab) => (
                        <tr key={lab.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{lab.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">{lab.department}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">{lab._count?.items || 0}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">{lab._count?.users || 0}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">{lab._count?.issueRecords || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {report.issueRecords && report.issueRecords.length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-xl font-bold mb-4">Issue Records</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lab</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Issue Time</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {report.issueRecords.slice(0, 50).map((record) => (
                          <tr key={record.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">{record.lab?.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">{record.user.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">{record.item.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {new Date(record.issueTime).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs rounded ${
                                record.returnTime ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {record.returnTime ? 'Returned' : 'Active'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Lab Report */}
          {report.type === 'lab' && (
            <>
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h3 className="text-xl font-bold mb-2">Lab Details</h3>
                <p><strong>Name:</strong> {report.lab.name}</p>
                <p><strong>Department:</strong> {report.lab.department}</p>
                <p><strong>Admin:</strong> {report.lab.admin?.name} ({report.lab.admin?.email})</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow-md p-4">
                  <p className="text-sm text-gray-600">Total Items</p>
                  <p className="text-2xl font-bold">{report.stats.totalItems}</p>
                </div>
                <div className="bg-white rounded-lg shadow-md p-4">
                  <p className="text-sm text-gray-600">Available</p>
                  <p className="text-2xl font-bold text-green-600">{report.stats.availableItems}</p>
                </div>
                <div className="bg-white rounded-lg shadow-md p-4">
                  <p className="text-sm text-gray-600">Issued</p>
                  <p className="text-2xl font-bold text-yellow-600">{report.stats.issuedItems}</p>
                </div>
                <div className="bg-white rounded-lg shadow-md p-4">
                  <p className="text-sm text-gray-600">Active Issues</p>
                  <p className="text-2xl font-bold text-red-600">{report.stats.activeIssues}</p>
                </div>
              </div>

              {report.labAdmins && report.labAdmins.length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                  <h3 className="text-xl font-bold mb-4">Lab Admins</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created At</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {report.labAdmins.map((labAdmin) => (
                          <tr key={labAdmin.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">{labAdmin.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">{labAdmin.email}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {new Date(labAdmin.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {report.users && report.users.length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                  <h3 className="text-xl font-bold mb-4">Users</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created At</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {report.users.map((user) => (
                          <tr key={user.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">{user.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">{user.email}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {new Date(user.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {report.issueRecords && report.issueRecords.length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-xl font-bold mb-4">Issue History</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Issue Time</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Return Time</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {report.issueRecords.map((record) => (
                          <tr key={record.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">{record.user.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">{record.item.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {new Date(record.issueTime).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {record.returnTime ? new Date(record.returnTime).toLocaleString() : '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs rounded ${
                                record.returnTime ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {record.returnTime ? 'Returned' : 'Active'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default SuperAdminReports;

