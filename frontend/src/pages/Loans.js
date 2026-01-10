import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSidebar } from '../contexts/SidebarContext';
import axios from 'axios';

const Loans = () => {
  const location = useLocation();
  const { collapsed, setCollapsed } = useSidebar();
  const [loans, setLoans] = useState([]);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchLoans = async () => {
      try {
        const response = await axios.get('/api/loans/my-loans');
        if (isMounted) setLoans(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error('Error fetching loans:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchLoans();
    return () => { isMounted = false; };
  }, []);

  const fetchLoanDetails = async (loanId) => {
    try {
      const response = await axios.get(`/api/loans/${loanId}`);
      setSelectedLoan(response.data);
    } catch (error) {
      console.error('Error fetching loan details:', error);
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
          <Link to="/dashboard" className={`flex items-center gap-3 p-2 rounded transition-colors ${collapsed ? '' : 'w-56'} ${location.pathname === '/dashboard' ? 'bg-amber-50 text-amber-900' : 'hover:bg-gray-50'}`}><span>🏠</span>{!collapsed && <span>Dashboard</span>}</Link>
          <Link to="/loans" className={`flex items-center gap-3 p-2 rounded transition-colors ${collapsed ? '' : 'w-56'} ${location.pathname === '/loans' ? 'bg-amber-50 text-amber-900' : 'hover:bg-gray-50'}`}><span>💳</span>{!collapsed && <span>Loans</span>}</Link>
          <Link to="/savings" className={`flex items-center gap-3 p-2 rounded transition-colors ${collapsed ? '' : 'w-56'} ${location.pathname === '/savings' ? 'bg-amber-50 text-amber-900' : 'hover:bg-gray-50'}`}><span>💰</span>{!collapsed && <span>Savings</span>}</Link>
        </nav>
      </aside>

      <div className={`flex-1 p-6 ${collapsed ? 'ml-20' : 'ml-64'} transition-all duration-200`}>
        <div className="flex items-center justify-between mb-6">
          <div className="text-sm text-gray-600">Loans</div>
        </div>

        <div className="max-w-7xl mx-auto px-0 sm:px-0 lg:px-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">My Loans</h3>
              </div>
              <div className="divide-y divide-gray-200">
                {loans.length === 0 ? (
                  <div className="px-6 py-4 text-gray-500">No loans found</div>
                ) : (
                  loans.map((loan) => (
                    <div 
                      key={loan.id} 
                      className="px-6 py-4 cursor-pointer hover:bg-gray-50"
                      onClick={() => fetchLoanDetails(loan.id)}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            ₦{loan.principal?.toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-500">
                            {loan.repayment_period} months
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          loan.status === 'approved' ? 'bg-green-100 text-green-800' :
                          loan.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {loan.status}
                        </span>
                        {loan.status === 'approved' && (
                          <Link
                            to={`/early-repayment/${loan.id}`}
                            className="ml-2 text-xs text-indigo-600 hover:text-indigo-500"
                          >
                            Early Repayment
                          </Link>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {selectedLoan && (
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Repayment Schedule</h3>
                </div>
                <div className="p-6">
                  <div className="mb-4">
                    <div className="text-2xl font-bold text-gray-900">
                      ₦{selectedLoan.principal?.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500">
                      {selectedLoan.repayment_period} months • {selectedLoan.status}
                    </div>
                  </div>
                  <div className="space-y-3">
                    {selectedLoan.schedule?.map((payment) => (
                      <div key={payment.id} className="flex justify-between items-center py-2 border-b border-gray-100">
                        <div>
                          <div className="text-sm font-medium">Month {payment.month}</div>
                          <div className="text-xs text-gray-500">
                            Due: {new Date(payment.due_date).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            ₦{payment.amount?.toLocaleString()}
                          </div>
                          <div className={`text-xs ${
                            payment.paid ? 'text-green-600' : 'text-gray-500'
                          }`}>
                            {payment.paid ? 'Paid' : 'Pending'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Loans;