import { useState, useEffect } from 'react';
import axios from 'axios';

const AvailableItems = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const response = await axios.get('/api/user/items');
      setItems(response.data.items);
    } catch (error) {
      console.error('Failed to fetch items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestIssue = async (itemId) => {
    try {
      const response = await axios.post(`/api/user/request-issue/${itemId}`);
      alert(response.data.message || 'Request submitted. Please contact Lab Admin.');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to request item');
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Available Items</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => (
          <div key={item.id} className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-2">{item.name}</h3>
            <p className="text-gray-600 mb-2">
              <span className="font-medium">Category:</span> {item.category}
            </p>
            {item.description && (
              <p className="text-gray-600 mb-4">{item.description}</p>
            )}
            <button
              onClick={() => handleRequestIssue(item.id)}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
            >
              Request Issue
            </button>
          </div>
        ))}
      </div>
      {items.length === 0 && (
        <div className="text-center py-8 text-gray-500 bg-white rounded-lg shadow-md">
          No available items
        </div>
      )}
    </div>
  );
};

export default AvailableItems;



