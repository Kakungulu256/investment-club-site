import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { useSidebar } from '../contexts/SidebarContext';
import axios from 'axios';

const EarlyRepayment = () => {
  const location = useLocation();
  const { collapsed, setCollapsed } = useSidebar();
  const { loanId } = useParams();
  const navigate = useNavigate();
  const [loan, setLoan] = useState(null);
  const [calculation, setCalculation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchLoanDetails = async () => {
      try {
        const response = await axios.get(`/api/loans/${loanId}`);
        if (isMounted) setLoan(response.data);
      } catch (error) {
        console.error('Error fetching loan details:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (loanId) {
      fetchLoanDetails();
    }
    return () => { isMounted = false; };
  }, [loanId]);

  const calculateEarlyRepayment = async () => {
    setRequesting(true);
    try {
      const response = await axios.post(`/api/loans/${loanId}/early-repayment`);
      setCalculation(response.data.calculation);
    } catch (error) {
      console.error('Error calculating early repayment:', error);
    } finally {
      setRequesting(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#f6f3ef]">Loading...</div>;
  if (!loan) return <div className="min-h-screen flex items-center justify-center bg-[#f6f3ef]">Loan not found</div>;

  return (
    <div className="min-h-screen flex bg-[#f6f3ef] text-gray-800">
      <aside className={`transition-all duration-200 bg-white border-r border-gray-200 ${collapsed ? 'w-20' : 'w-64'} fixed h-screen overflow-y-auto`}>
        <div className="h-16 flex items-center justify-between px-4 border-b">
          <div className="text-lg font-semibold">{collapsed ? 'C' : 'Crownzcom'}</div>
          <button onClick={() => setCollapsed(!collapsed)} className="p-2 rounded hover:bg-gray-100">{collapsed ? '»' : '«'}</button>
        </div>
        <nav className="px-2 py-3 space-y-1">
          <Link to="/dashboard" className={`flex items-center gap-3 p-2 rounded transition-colors ${collapsed ? '' : 'w-56'} ${location.pathname === '/dashboard' ? 'bg-amber-50 text-amber-900' : 'hover:bg-gray-50'}`}><span>🏠</span>{!collapsed && <span>Dashboard</span>}</Link>
          <Link to="/loans" className={`flex items-center gap-3 p-2 rounded transition-colors ${collapsed ? '' : 'w-56'} ${location.pathname.includes('/loans') ? 'bg-amber-50 text-amber-900' : 'hover:bg-gray-50'}`}><span>💳</span>{!collapsed && <span>Loans</span>}</Link>
        </nav>
      </aside>

      <div className={`flex-1 p-6 ${collapsed ? 'ml-20' : 'ml-64'} transition-all duration-200`}>
        <div className="flex items-center justify-between mb-6">
          <div className="text-sm text-gray-600">Early Repayment</div>
        </div>

        <div className="max-w-4xl mx-auto px-0 sm:px-0 lg:px-0">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Early Loan Repayment</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Loan Details</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Principal:</span>
                    <span className="font-medium">₦{loan.principal?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Remaining Balance:</span>
                    <span className="font-medium">₦{loan.remaining_balance?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      loan.status === 'approved' ? 'bg-green-100 text-green-800' :
                      loan.status === 'active' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {loan.status}
                    </span>
                  </div>
                </div>
              </div>

              {calculation && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Early Repayment Calculation</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Remaining Balance:</span>
                      <span className="font-medium">₦{calculation.loan.remaining_balance?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Early Repayment Interest (3% of principal):</span>
                      <span className="font-medium">₦{calculation.earlyRepayment.earlyInterest?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-gray-900 font-semibold">Total Payment Required:</span>
                      <span className="font-bold text-lg">₦{calculation.earlyRepayment.totalPayment?.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t pt-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      Early Repayment Information
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>
                        Early repayment incurs a 3% interest charge on the principal amount. 
                        This calculation is for informational purposes. Contact an admin to process the actual payment.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={() => navigate('/loans')}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Back to Loans
                </button>
                
                {!calculation && (
                  <button
                    onClick={calculateEarlyRepayment}
                    disabled={requesting}
                    className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    {requesting ? 'Calculating...' : 'Calculate Early Repayment'}
                  </button>
                )}

                {calculation && (
                  <button
                    onClick={() => alert('Please contact an admin to process this early repayment.')}
                    className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Request Early Repayment
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EarlyRepayment;