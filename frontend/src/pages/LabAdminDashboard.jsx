import { useState, useEffect } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import StatCard from '../components/StatCard';
import ManageItems from '../components/labAdmin/ManageItems';
import IssueItems from '../components/labAdmin/IssueItems';
import IssueHistory from '../components/labAdmin/IssueHistory';
import ViewUsers from '../components/labAdmin/ViewUsers';
import LabAdminReports from '../components/labAdmin/LabAdminReports';

const LabAdminDashboard = () => {
  const location = useLocation();
  const currentPage = location.pathname.split('/').pop() || 'dashboard';
  const [stats, setStats] = useState({
    totalItems: 0,
    availableItems: 0,
    issuedItems: 0,
    activeIssues: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/lab-admin/stats');
      setStats(response.data.stats);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  return (
    <div className="flex min-h-screen font-display">
      <Sidebar currentPage={currentPage} />
      <div className="flex-1 p-6 md:p-8">
        <Routes>
          <Route
            index
            element={
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight mb-6 text-slate-100">Lab Admin Dashboard</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <StatCard
                    title="Total Items"
                    value={stats.totalItems}
                    icon={<span className="text-2xl">📦</span>}
                    color="blue"
                  />
                  <StatCard
                    title="Available"
                    value={stats.availableItems}
                    icon={<span className="text-2xl">✅</span>}
                    color="green"
                  />
                  <StatCard
                    title="Issued"
                    value={stats.issuedItems}
                    icon={<span className="text-2xl">📤</span>}
                    color="yellow"
                  />
                  <StatCard
                    title="Active Issues"
                    value={stats.activeIssues}
                    icon={<span className="text-2xl">⏱️</span>}
                    color="red"
                  />
                </div>
              </div>
            }
          />
          <Route path="items" element={<ManageItems onUpdate={fetchStats} />} />
          <Route path="issue" element={<IssueItems onUpdate={fetchStats} />} />
          <Route path="history" element={<IssueHistory />} />
          <Route path="reports" element={<LabAdminReports />} />
          <Route path="users" element={<ViewUsers />} />
          <Route path="*" element={<Navigate to="/lab-admin" replace />} />
        </Routes>
      </div>
    </div>
  );
};

export default LabAdminDashboard;

