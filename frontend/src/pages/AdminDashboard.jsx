import { useState, useEffect } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import StatCard from '../components/StatCard';
import MyLabs from '../components/admin/MyLabs';
import CreateLabAdmin from '../components/admin/CreateLabAdmin';
import CreateUser from '../components/admin/CreateUser';
import LabReports from '../components/admin/LabReports';
import ViewLabAdmins from '../components/admin/ViewLabAdmins';
import ViewUsers from '../components/admin/ViewUsers';

const AdminDashboard = () => {
  const location = useLocation();
  const currentPage = location.pathname.split('/').pop() || 'dashboard';
  const [stats, setStats] = useState({
    totalLabs: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/admin/labs');
      setStats({
        totalLabs: response.data.labs.length
      });
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
                <h1 className="text-3xl font-extrabold tracking-tight mb-6 text-slate-100">Admin Dashboard</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <StatCard
                    title="My Labs"
                    value={stats.totalLabs}
                    icon={<span className="text-2xl">🏢</span>}
                    color="blue"
                  />
                </div>
              </div>
            }
          />
          <Route path="labs" element={<MyLabs />} />
          <Route path="create-lab-admin" element={<CreateLabAdmin onSuccess={fetchStats} />} />
          <Route path="create-user" element={<CreateUser onSuccess={fetchStats} />} />
          <Route path="users" element={<ViewUsers />} />
          <Route path="lab-admins" element={<ViewLabAdmins />} />
          <Route path="reports" element={<LabReports />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </div>
    </div>
  );
};

export default AdminDashboard;

