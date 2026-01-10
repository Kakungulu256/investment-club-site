import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSidebar } from '../contexts/SidebarContext';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';

const MemberDashboard = () => {
  const location = useLocation();
  const { collapsed, setCollapsed } = useSidebar();
  const { user, logout } = useAuth();
  const [savings, setSavings] = useState(null);
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [savingsRes, loansRes] = await Promise.all([
          axios.get('/api/savings/my-savings'),
          axios.get('/api/loans/my-loans')
        ]);
        setSavings(savingsRes.data);
        setLoans(Array.isArray(loansRes.data) ? loansRes.data : []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f6f3ef]">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#f6f3ef] text-gray-800">
      <aside className={`transition-all duration-200 bg-white border-r border-gray-200 ${collapsed ? 'w-20' : 'w-64'} fixed h-screen overflow-y-auto`}>
        <div className="h-16 flex items-center justify-between px-4 border-b">
          <div className="text-lg font-semibold">{collapsed ? 'C' : 'Crownzcom'}</div>
          <button onClick={() => setCollapsed(!collapsed)} className="p-2 rounded hover:bg-gray-100">{collapsed ? '»' : '«'}</button>
        </div>
        <nav className="px-2 py-3 space-y-1">
          <Link to="/dashboard" className={`flex items-center gap-3 p-2 rounded transition-colors ${collapsed ? '' : 'w-56'} ${location.pathname === '/dashboard' ? 'bg-amber-50 text-amber-900' : 'hover:bg-gray-50'}`}>
            <span>🏠</span>{!collapsed && <span>Dashboard</span>}
          </Link>
          <Link to="/loans" className={`flex items-center gap-3 p-2 rounded transition-colors ${collapsed ? '' : 'w-56'} ${location.pathname === '/loans' ? 'bg-amber-50 text-amber-900' : 'hover:bg-gray-50'}`}>
            <span>💳</span>{!collapsed && <span>Loans</span>}
          </Link>
          <Link to="/savings" className={`flex items-center gap-3 p-2 rounded transition-colors ${collapsed ? '' : 'w-56'} ${location.pathname === '/savings' ? 'bg-amber-50 text-amber-900' : 'hover:bg-gray-50'}`}>
            <span>💰</span>{!collapsed && <span>Savings</span>}
          </Link>
          <Link to="/apply-loan" className={`flex items-center gap-3 p-2 rounded transition-colors ${collapsed ? '' : 'w-56'} ${location.pathname === '/apply-loan' ? 'bg-amber-50 text-amber-900' : 'hover:bg-gray-50'}`}>
            <span>➕</span>{!collapsed && <span>Apply Loan</span>}
          </Link>
        </nav>
      </aside>

      <div className={`flex-1 p-6 ${collapsed ? 'ml-20' : 'ml-64'} transition-all duration-200`}>
        <div className="flex items-center justify-between mb-6">
          <div className="text-sm text-gray-600">Member Dashboard</div>
          <div className="flex items-center gap-3">
            <span className="text-sm">{user?.full_name}</span>
            <button onClick={logout} className="bg-red-600 text-white px-3 py-1 rounded">Logout</button>
          </div>
        </div>

        <main className="max-w-7xl mx-auto py-0 sm:px-0 lg:px-0">
          <div className="px-4 py-6 sm:px-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-white font-bold">₦</div>
                  <div className="ml-4">
                    <div className="text-xs text-gray-500">Total Savings</div>
                    <div className="text-2xl font-semibold">₦{savings?.balance?.toLocaleString() || '0'}</div>
                  </div>
                </div>
                <div className="mt-4">
                  <Link to="/savings" className="text-sm text-indigo-600 hover:underline">View details →</Link>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">L</div>
                  <div className="ml-4">
                    <div className="text-xs text-gray-500">Active Loans</div>
                    <div className="text-2xl font-semibold">{Array.isArray(loans) ? loans.filter(loan => loan.status === 'approved').length : 0}</div>
                  </div>
                </div>
                <div className="mt-4">
                  <Link to="/loans" className="text-sm text-indigo-600 hover:underline">View details →</Link>
                </div>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link to="/apply-loan" className="bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-lg text-center font-medium">Apply for Loan</Link>
              <Link to="/savings" className="bg-green-600 hover:bg-green-700 text-white p-4 rounded-lg text-center font-medium">View Savings</Link>
            </div>

            <div className="mt-8">
              <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <div className="px-4 py-5 sm:px-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Loans</h3>
                </div>
                <ul className="divide-y divide-gray-200">
                  {!Array.isArray(loans) || loans.length === 0 ? (
                    <li className="px-4 py-4 text-gray-500">No loans found</li>
                  ) : (
                    loans.map((loan) => (
                      <li key={loan.id} className="px-4 py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-700">₦</div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">₦{loan.principal?.toLocaleString()}</div>
                              <div className="text-sm text-gray-500">{loan.repayment_period} months</div>
                            </div>
                          </div>
                          <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium">
                            <span className={`px-2 py-1 rounded-full text-xs ${loan.status === 'approved' ? 'bg-green-100 text-green-800' : loan.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                              {loan.status}
                            </span>
                          </div>
                        </div>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default MemberDashboard;