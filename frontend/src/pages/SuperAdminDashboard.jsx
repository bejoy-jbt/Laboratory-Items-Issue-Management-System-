import { useState, useEffect } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import StatCard from '../components/StatCard';
import CreateAdmin from '../components/superAdmin/CreateAdmin';
import CreateLab from '../components/superAdmin/CreateLab';
import AssignAdmin from '../components/superAdmin/AssignAdmin';
import ViewAdmins from '../components/superAdmin/ViewAdmins';
import ViewLabs from '../components/superAdmin/ViewLabs';
import ViewUsers from '../components/superAdmin/ViewUsers';
import ViewItems from '../components/superAdmin/ViewItems';
import CreateUser from '../components/superAdmin/CreateUser';
import SuperAdminReports from '../components/superAdmin/SuperAdminReports';

const SuperAdminDashboard = () => {
  const location = useLocation();
  const currentPage = location.pathname.split('/').pop() || 'dashboard';
  const [stats, setStats] = useState({
    totalAdmins: 0,
    totalLabs: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [adminsRes, labsRes] = await Promise.all([
        axios.get('/api/super-admin/admins'),
        axios.get('/api/super-admin/labs')
      ]);
      setStats({
        totalAdmins: adminsRes.data.admins.length,
        totalLabs: labsRes.data.labs.length
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
                <h1 className="text-3xl font-extrabold tracking-tight mb-6 text-slate-100">Super Admin Dashboard</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <StatCard
                    title="Total Admins"
                    value={stats.totalAdmins}
                    icon={<span className="text-2xl">👤</span>}
                    color="blue"
                  />
                  <StatCard
                    title="Total Labs"
                    value={stats.totalLabs}
                    icon={<span className="text-2xl">🏢</span>}
                    color="green"
                  />
                </div>
              </div>
            }
          />
          <Route path="create-admin" element={<CreateAdmin onSuccess={fetchStats} />} />
          <Route path="create-lab" element={<CreateLab onSuccess={fetchStats} />} />
          <Route path="assign-admin" element={<AssignAdmin onSuccess={fetchStats} />} />
          <Route path="admins" element={<ViewAdmins />} />
          <Route path="labs" element={<ViewLabs />} />
          <Route path="create-user" element={<CreateUser onSuccess={fetchStats} />} />
          <Route path="users" element={<ViewUsers />} />
          <Route path="items" element={<ViewItems />} />
          <Route path="reports" element={<SuperAdminReports />} />
          <Route path="*" element={<Navigate to="/super-admin" replace />} />
        </Routes>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;

