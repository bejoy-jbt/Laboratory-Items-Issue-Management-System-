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
      <h2 className="text-2xl font-bold mb-6 text-gray-800">My Labs</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {labs.map((lab) => (
          <div key={lab.id} className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-2">{lab.name}</h3>
            <p className="text-gray-600 mb-4">{lab.department}</p>
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">Items:</span> {lab._count?.items || 0}</p>
              <p><span className="font-medium">Users:</span> {lab._count?.users || 0}</p>
              <p><span className="font-medium">Issues:</span> {lab._count?.issueRecords || 0}</p>
            </div>
          </div>
        ))}
      </div>
      {labs.length === 0 && (
        <div className="text-center py-8 text-gray-500 bg-white rounded-lg shadow-md">
          No labs assigned to you
        </div>
      )}
    </div>
  );
};

export default MyLabs;

