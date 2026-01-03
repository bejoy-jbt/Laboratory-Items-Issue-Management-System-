import { useState, useEffect } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import StatCard from '../components/StatCard';
import AvailableItems from '../components/user/AvailableItems';
import IssuedItems from '../components/user/IssuedItems';

const UserDashboard = () => {
  const location = useLocation();
  const currentPage = location.pathname.split('/').pop() || 'dashboard';
  const [stats, setStats] = useState({
    totalIssues: 0,
    activeIssues: 0,
    returnedIssues: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/user/stats');
      setStats(response.data.stats);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar currentPage={currentPage} />
      <div className="flex-1 p-8">
        <Routes>
          <Route
            index
            element={
              <div>
                <h1 className="text-3xl font-bold mb-6 text-gray-800">User Dashboard</h1>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <StatCard
                    title="Total Issues"
                    value={stats.totalIssues}
                    icon={<span className="text-white text-2xl">📋</span>}
                    color="blue"
                  />
                  <StatCard
                    title="Active Issues"
                    value={stats.activeIssues}
                    icon={<span className="text-white text-2xl">⏱️</span>}
                    color="yellow"
                  />
                  <StatCard
                    title="Returned"
                    value={stats.returnedIssues}
                    icon={<span className="text-white text-2xl">✅</span>}
                    color="green"
                  />
                </div>
              </div>
            }
          />
          <Route path="items" element={<AvailableItems />} />
          <Route path="issued" element={<IssuedItems onUpdate={fetchStats} />} />
          <Route path="*" element={<Navigate to="/user" replace />} />
        </Routes>
      </div>
    </div>
  );
};

export default UserDashboard;

