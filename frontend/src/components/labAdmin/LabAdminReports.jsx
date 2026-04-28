import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import ReportPie from '../charts/ReportPie';
import ReportLine from '../charts/ReportLine';

const LabAdminReports = () => {
  const [items, setItems] = useState([]);
  const [issueRecords, setIssueRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      try {
        const [itemsRes, historyRes] = await Promise.all([
          axios.get('/api/lab-admin/items'),
          axios.get('/api/lab-admin/issue-history'),
        ]);
        setItems(itemsRes.data.items || []);
        setIssueRecords(historyRes.data.issueRecords || []);
      } catch (e) {
        console.error('Failed to load lab admin reports', e);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const statusCounts = useMemo(() => {
    const counts = { available: 0, issued: 0, maintenance: 0 };
    (items || []).forEach((it) => {
      if (it.status === 'AVAILABLE') counts.available += 1;
      else if (it.status === 'ISSUED') counts.issued += 1;
      else if (it.status === 'MAINTENANCE') counts.maintenance += 1;
    });
    return counts;
  }, [items]);

  if (loading) return <div className="text-slate-200">Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-100">Reports</h2>
        <p className="text-sm text-slate-400 mt-1">Quick visibility into inventory and issue activity.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ReportPie title="Inventory Status (Lab)" data={statusCounts} />
        <ReportLine title="Issues Trend (Lab)" issueRecords={issueRecords} days={14} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-md p-4 text-gray-900">
          <p className="text-sm text-gray-600">Total Items</p>
          <p className="text-2xl font-bold">{items.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 text-gray-900">
          <p className="text-sm text-gray-600">Active Issues</p>
          <p className="text-2xl font-bold text-red-600">{issueRecords.filter((r) => !r.returnTime).length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 text-gray-900">
          <p className="text-sm text-gray-600">Overdue</p>
          <p className="text-2xl font-bold text-amber-700">
            {
              issueRecords.filter(
                (r) => !r.returnTime && r.estimatedReturnTime && new Date(r.estimatedReturnTime) < new Date()
              ).length
            }
          </p>
        </div>
      </div>
    </div>
  );
};

export default LabAdminReports;

