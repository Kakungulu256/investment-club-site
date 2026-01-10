import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSidebar } from '../contexts/SidebarContext';
import axios from 'axios';

const Savings = () => {
  const location = useLocation();
  const { collapsed, setCollapsed } = useSidebar();
  const [savings, setSavings] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSavings = async () => {
      try {
        const response = await axios.get('/api/savings/my-savings');
        setSavings(response.data);
        setTransactions(Array.isArray(response.data.transactions) ? response.data.transactions : []);
      } catch (error) {
        console.error('Error fetching savings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSavings();
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#f6f3ef]">Loading...</div>;
  }

  return (
    <div className="min-h-screen flex bg-[#f6f3ef] text-gray-800">
      <aside className={`transition-all duration-200 bg-white border-r border-gray-200 ${collapsed ? 'w-20' : 'w-64'} fixed h-screen overflow-y-auto`}>
        <div className="h-16 flex items-center justify-between px-4 border-b">
          <div className="text-lg font-semibold">{collapsed ? 'C' : 'Crownzcom'}</div>
          <button onClick={() => setCollapsed(!collapsed)} className="p-2 rounded hover:bg-gray-100">{collapsed ? '»' : '«'}</button>
        </div>
        <nav className="px-2 py-3 space-y-1">
          <Link to="/dashboard" className={`flex items-center gap-3 p-2 rounded transition-colors ${collapsed ? '' : 'w-56'} ${location.pathname === '/dashboard' ? 'bg-amber-50 text-amber-900' : 'hover:bg-gray-50'}`}><span>🏠</span>{!collapsed && <span>Dashboard</span>}</Link>
          <Link to="/savings" className={`flex items-center gap-3 p-2 rounded transition-colors ${collapsed ? '' : 'w-56'} ${location.pathname === '/savings' ? 'bg-amber-50 text-amber-900' : 'hover:bg-gray-50'}`}><span>💰</span>{!collapsed && <span>Savings</span>}</Link>
          <Link to="/loans" className={`flex items-center gap-3 p-2 rounded transition-colors ${collapsed ? '' : 'w-56'} ${location.pathname === '/loans' ? 'bg-amber-50 text-amber-900' : 'hover:bg-gray-50'}`}><span>💳</span>{!collapsed && <span>Loans</span>}</Link>
        </nav>
      </aside>

      <div className={`flex-1 p-6 ${collapsed ? 'ml-20' : 'ml-64'} transition-all duration-200`}>
        <div className="flex items-center justify-between mb-6">
          <div className="text-sm text-gray-600">Savings</div>
        </div>

        <div className="max-w-7xl mx-auto px-0 sm:px-0 lg:px-0">
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Savings Summary</h2>
            <div className="text-3xl font-bold text-green-600">
              ₦{savings?.balance?.toLocaleString() || '0'}
            </div>
            <p className="text-gray-600">Total Savings Balance</p>
          </div>

          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Transaction History</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {!Array.isArray(transactions) || transactions.length === 0 ? (
                <div className="px-6 py-4 text-gray-500">No transactions found</div>
              ) : (
                transactions.map((transaction) => (
                  <div key={transaction.id} className="px-6 py-4 flex justify-between items-center">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {transaction.description}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(transaction.transaction_date).toLocaleDateString()}
                      </div>
                    </div>
                    <div className={`text-sm font-medium ${
                      transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.amount > 0 ? '+' : ''}₦{Math.abs(transaction.amount).toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Savings;