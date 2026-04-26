import { useState, useEffect } from 'react';
import axios from 'axios';

const MyLabs = () => {
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLabs();
  }, []);

  const fetchLabs = async () => {
    try {
      const response = await axios.get('/api/admin/labs');
      setLabs(response.data.labs);
    } catch (error) {
      console.error('Failed to fetch labs:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-extrabold tracking-tight mb-6 text-slate-100">My Labs</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {labs.map((lab) => (
          <div key={lab.id} className="bg-white rounded-lg shadow-md p-6 text-slate-900">
            <h3 className="text-xl font-bold text-slate-900 mb-2">{lab.name}</h3>
            <p className="text-slate-700 mb-4">{lab.department}</p>
            <div className="space-y-2 text-sm text-slate-900">
              <p><span className="font-semibold text-slate-900">Items:</span> <span className="text-slate-900">{lab._count?.items || 0}</span></p>
              <p><span className="font-semibold text-slate-900">Users:</span> <span className="text-slate-900">{lab._count?.users || 0}</span></p>
              <p><span className="font-semibold text-slate-900">Issues:</span> <span className="text-slate-900">{lab._count?.issueRecords || 0}</span></p>
            </div>
          </div>
        ))}
      </div>
      {labs.length === 0 && (
        <div className="text-center py-8 text-slate-700 bg-white rounded-lg shadow-md">
          No labs assigned to you
        </div>
      )}
    </div>
  );
};

export default MyLabs;

