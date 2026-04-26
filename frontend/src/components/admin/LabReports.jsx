import { useState, useEffect } from 'react';
import axios from 'axios';
import ReportPie from '../charts/ReportPie';
import ReportLine from '../charts/ReportLine';

const LabReports = () => {
  const [labs, setLabs] = useState([]);
  const [selectedLab, setSelectedLab] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLabs();
  }, []);

  const fetchLabs = async () => {
    try {
      const response = await axios.get('/api/admin/labs');
      setLabs(response.data.labs);
      if (response.data.labs.length > 0) {
        setSelectedLab(response.data.labs[0].id);
        fetchReport(response.data.labs[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch labs:', error);
    }
  };

  const fetchReport = async (labId) => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/admin/reports/${labId}`);
      setReport(response.data);
    } catch (error) {
      console.error('Failed to fetch report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLabChange = (e) => {
    const labId = e.target.value;
    setSelectedLab(labId);
    if (labId) {
      fetchReport(labId);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-extrabold tracking-tight mb-6 text-slate-100">Lab Reports</h2>
      
      <div className="mb-6">
        <label className="block text-sm font-semibold text-slate-200 mb-2">Select Lab</label>
        <select
          value={selectedLab || ''}
          onChange={handleLabChange}
          className="w-full md:w-64 px-4 py-2.5 rounded-xl bg-white text-gray-900 border border-white/10
            focus:outline-none focus:ring-2 focus:ring-cyan-400/60"
        >
          {labs.map((lab) => (
            <option key={lab.id} value={lab.id}>
              {lab.name} - {lab.department}
            </option>
          ))}
        </select>
      </div>

      {report && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ReportPie
              title="Inventory Status (Lab)"
              data={{
                available: report.stats?.availableItems ?? 0,
                issued: report.stats?.issuedItems ?? 0,
                maintenance: report.stats?.maintenanceItems ?? 0,
              }}
            />
            <ReportLine title="Issues Trend (Lab)" issueRecords={report.issueRecords || []} days={14} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-md p-4 text-gray-900">
              <p className="text-sm text-gray-600">Total Items</p>
              <p className="text-2xl font-bold">{report.stats.totalItems}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4 text-gray-900">
              <p className="text-sm text-gray-600">Available</p>
              <p className="text-2xl font-bold text-green-600">{report.stats.availableItems}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4 text-gray-900">
              <p className="text-sm text-gray-600">Issued</p>
              <p className="text-2xl font-bold text-yellow-600">{report.stats.issuedItems}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4 text-gray-900">
              <p className="text-sm text-gray-600">Active Issues</p>
              <p className="text-2xl font-bold text-red-600">{report.stats.activeIssues}</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 text-gray-900">
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
                <tbody className="bg-white divide-y divide-gray-200 text-gray-900">
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
        </div>
      )}
    </div>
  );
};

export default LabReports;

