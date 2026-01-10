import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSidebar } from '../contexts/SidebarContext';
import axios from 'axios';

const AdminDashboard = () => {
  const location = useLocation();
  const { collapsed, setCollapsed } = useSidebar();
  const { logout } = useAuth();
  const [pendingLoans, setPendingLoans] = useState([]);
  const [activeLoans, setActiveLoans] = useState([]);
  const [summary, setSummary] = useState(null);
  const [savingsSummary, setSavingsSummary] = useState(null);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pendingRes, activeRes, savingsRes] = await Promise.all([
          axios.get('/api/loans/admin/pending'),
          axios.get('/api/loans/admin/active'),
          axios.get('/api/savings/balances')
        ]);
        setPendingLoans(pendingRes.data || []);
        setActiveLoans(activeRes.data || []);
        setSavingsSummary(savingsRes.data || []);
        
        // Calculate summary from the data
        const totalMembers = savingsRes.data?.length || 0;
        const totalSavings = savingsRes.data?.reduce((sum, member) => sum + (member.balance || 0), 0) || 0;
        const totalLoans = activeRes.data?.reduce((sum, loan) => sum + (loan.remaining_balance || 0), 0) || 0;
        
        setSummary({
          total_members: totalMembers,
          total_savings: totalSavings,
          total_loans: totalLoans
        });
      } catch (error) {
        console.error('Error fetching admin data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const approveLoan = async (loanId) => {
    try {
      await axios.post(`/api/loans/${loanId}/approve`, {
        disbursement_date: new Date().toISOString().split('T')[0]
      });
      setPendingLoans(pendingLoans.filter(loan => loan.id !== loanId));
      // Refresh data
      await refreshData();
    } catch (error) {
      console.error('Error approving loan:', error);
    }
  };

  const rejectLoan = async (loanId) => {
    try {
      await axios.post(`/api/loans/${loanId}/reject`, {
        reason: 'Rejected by admin'
      });
      setPendingLoans(pendingLoans.filter(loan => loan.id !== loanId));
      // Refresh data
      await refreshData();
    } catch (error) {
      console.error('Error rejecting loan:', error);
    }
  };

  const refreshData = async () => {
    try {
      const [pendingRes, activeRes, savingsRes] = await Promise.all([
        axios.get('/api/loans/admin/pending'),
        axios.get('/api/loans/admin/active'),
        axios.get('/api/savings/balances')
      ]);
      setPendingLoans(pendingRes.data || []);
      setActiveLoans(activeRes.data || []);
      setSavingsSummary(savingsRes.data || []);
      
      // Calculate summary from the data
      const totalMembers = savingsRes.data?.length || 0;
      const totalSavings = savingsRes.data?.reduce((sum, member) => sum + (member.balance || 0), 0) || 0;
      const totalLoans = activeRes.data?.reduce((sum, loan) => sum + (loan.remaining_balance || 0), 0) || 0;
      
      setSummary({
        total_members: totalMembers,
        total_savings: totalSavings,
        total_loans: totalLoans
      });
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
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
          <button type="button" onClick={() => setSelectedTab('overview')} className={`w-full text-left flex items-center gap-3 p-2 rounded transition-colors ${selectedTab === 'overview' ? 'bg-amber-50 text-amber-900' : 'hover:bg-gray-50'}`}>
            <span>📊</span>{!collapsed && <span>Overview</span>}
          </button>
          <button type="button" onClick={() => setSelectedTab('loans')} className={`w-full text-left flex items-center gap-3 p-2 rounded transition-colors ${selectedTab === 'loans' ? 'bg-amber-50 text-amber-900' : 'hover:bg-gray-50'}`}>
            <span>💳</span>{!collapsed && <span>Loans</span>}
          </button>
          <button type="button" onClick={() => setSelectedTab('savings')} className={`w-full text-left flex items-center gap-3 p-2 rounded transition-colors ${selectedTab === 'savings' ? 'bg-amber-50 text-amber-900' : 'hover:bg-gray-50'}`}>
            <span>💰</span>{!collapsed && <span>Savings</span>}
          </button>
          <Link to="/admin/post-savings" className={`flex items-center gap-3 p-2 rounded transition-colors ${collapsed ? '' : 'w-56'} ${location.pathname === '/admin/post-savings' ? 'bg-amber-50 text-amber-900' : 'hover:bg-gray-50'}`}>
            <span>➕</span>{!collapsed && <span>Post Savings</span>}
          </Link>
          <Link to="/admin/record-repayment" className={`flex items-center gap-3 p-2 rounded transition-colors ${collapsed ? '' : 'w-56'} ${location.pathname === '/admin/record-repayment' ? 'bg-amber-50 text-amber-900' : 'hover:bg-gray-50'}`}>
            <span>✅</span>{!collapsed && <span>Record Repayment</span>}
          </Link>
          <Link to="/admin/distribute-interest" className={`flex items-center gap-3 p-2 rounded transition-colors ${collapsed ? '' : 'w-56'} ${location.pathname === '/admin/distribute-interest' ? 'bg-amber-50 text-amber-900' : 'hover:bg-gray-50'}`}>
            <span>🔁</span>{!collapsed && <span>Distribute Interest</span>}
          </Link>
          <Link to="/admin/config" className={`flex items-center gap-3 p-2 rounded transition-colors ${collapsed ? '' : 'w-56'} ${location.pathname === '/admin/config' ? 'bg-amber-50 text-amber-900' : 'hover:bg-gray-50'}`}>
            <span>⚙️</span>{!collapsed && <span>Config</span>}
          </Link>
        </nav>
      </aside>

      <div className={`flex-1 p-6 ${collapsed ? 'ml-20' : 'ml-64'} transition-all duration-200`}>
        <div className="flex items-center justify-between mb-6">
          <div className="text-sm text-gray-600">Admin Panel</div>
          <div className="flex items-center gap-3">
            <Link to="/admin/config" className="text-sm text-gray-700 px-3 py-1 rounded bg-white/50">Config</Link>
            <button onClick={logout} className="bg-red-600 text-white px-3 py-1 rounded">Logout</button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-0 sm:px-0 lg:px-0">
          {selectedTab === 'overview' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <div className="text-xs text-gray-500">Total Members</div>
                  <div className="mt-3 text-3xl font-bold text-blue-600">{summary?.total_members || 0}</div>
                </div>
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <div className="text-xs text-gray-500">Total Savings</div>
                  <div className="mt-3 text-3xl font-bold text-green-600">₦{summary?.total_savings?.toLocaleString() || '0'}</div>
                </div>
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <div className="text-xs text-gray-500">Active Loans (Outstanding)</div>
                  <div className="mt-3 text-3xl font-bold text-orange-600">₦{summary?.total_loans?.toLocaleString() || '0'}</div>
                </div>
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <div className="text-xs text-gray-500">Pending Approvals</div>
                  <div className="mt-3 text-3xl font-bold text-red-600">{pendingLoans.length}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Link to="/admin/post-savings" className="p-6 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 text-center font-medium">Post Member Savings</Link>
                <Link to="/admin/record-repayment" className="p-6 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 text-center font-medium">Record Loan Repayment</Link>
                <Link to="/admin/distribute-interest" className="p-6 bg-purple-600 text-white rounded-lg shadow hover:bg-purple-700 text-center font-medium">Distribute Interest</Link>
              </div>
            </>
          )}

          {selectedTab === 'loans' && (
            <div className="space-y-8">
              {/* Pending Loans */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Pending Loan Applications ({pendingLoans.length})</h3>
                </div>
                <div className="divide-y divide-gray-200">
                  {pendingLoans.length === 0 ? (
                    <div className="px-6 py-4 text-gray-500">No pending applications</div>
                  ) : (
                    pendingLoans.map((loan) => (
                      <div key={loan.id} className="px-6 py-4">
                        <div className="flex justify-between items-center">
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">
                              {loan.full_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              ₦{loan.principal?.toLocaleString()} • {loan.repayment_period} months
                            </div>
                            <div className="text-xs text-gray-400">
                              Applied: {new Date(loan.application_date).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => approveLoan(loan.id)}
                              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => rejectLoan(loan.id)}
                              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Active Loans */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Active Loans ({activeLoans.length})</h3>
                </div>
                <div className="divide-y divide-gray-200">
                  {activeLoans.length === 0 ? (
                    <div className="px-6 py-4 text-gray-500">No active loans</div>
                  ) : (
                    activeLoans.map((loan) => (
                      <div key={loan.id} className="px-6 py-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {loan.full_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              ₦{loan.principal?.toLocaleString()} • Remaining: ₦{loan.remaining_balance?.toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-400">
                              Disbursed: {new Date(loan.disbursement_date).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">
                              {Math.round((1 - loan.remaining_balance / loan.total_amount) * 100)}% paid
                            </div>
                            <div className="w-24 bg-gray-200 rounded-full h-2 mt-1">
                              <div 
                                className="bg-green-600 h-2 rounded-full" 
                                style={{ width: `${Math.round((1 - loan.remaining_balance / loan.total_amount) * 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {selectedTab === 'savings' && (
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Member Savings Balances</h3>
              </div>
              <div className="divide-y divide-gray-200">
                {Array.isArray(savingsSummary) && savingsSummary.length === 0 ? (
                  <div className="px-6 py-4 text-gray-500">No savings data</div>
                ) : (
                  Array.isArray(savingsSummary) && savingsSummary.map((member) => (
                    <div key={member.id} className="px-6 py-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {member.full_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            @{member.username}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            ₦{member.balance?.toLocaleString() || '0'}
                          </div>
                          <div className={`text-xs ${
                            member.balance > 0 ? 'text-green-600' : 'text-gray-500'
                          }`}>
                            {member.balance > 0 ? 'Active' : 'No savings'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;