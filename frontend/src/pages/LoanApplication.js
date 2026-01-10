import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useSidebar } from '../contexts/SidebarContext';
import axios from 'axios';

const LoanApplication = () => {
  const location = useLocation();
  const { collapsed, setCollapsed } = useSidebar();
  const [formData, setFormData] = useState({
    principal: '',
    repayment_period: '',
    custom_amounts: {}
  });
  const [showCustomSchedule, setShowCustomSchedule] = useState(false);
  const [customAmounts, setCustomAmounts] = useState({});
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const calculatePreview = async () => {
    if (!formData.principal || !formData.repayment_period) return;
    
    try {
      // Get user's savings balance and existing loans
      const [savingsRes, loansRes] = await Promise.all([
        axios.get('/api/savings/my-savings'),
        axios.get('/api/loans/my-loans')
      ]);
      
      const savingsBalance = savingsRes.data.balance || 0;
      const loans = Array.isArray(loansRes.data) ? loansRes.data : [];
      
      // Calculate total outstanding loan balance
      const totalLoanBalance = loans
        .filter(loan => loan.status === 'approved' || loan.status === 'active')
        .reduce((sum, loan) => sum + (loan.remaining_balance || 0), 0);
      
      // Calculate maximum borrowable amount: 80% of savings minus outstanding loans
      const maxLoanAmount = (savingsBalance * 0.8) - totalLoanBalance;
      
      if (maxLoanAmount <= 0) {
        setError(`You cannot borrow more. Outstanding loans: ₦${totalLoanBalance.toLocaleString()}, 80% of savings: ₦${(savingsBalance * 0.8).toLocaleString()}`);
        return;
      }
      
      if (parseFloat(formData.principal) > maxLoanAmount) {
        setError(`Loan amount cannot exceed ₦${maxLoanAmount.toLocaleString()} (80% of savings minus outstanding loans)`);
        return;
      }
      
      // Get system configuration
      const configRes = await axios.get('/api/admin/config');
      const config = {};
      configRes.data.forEach(item => {
        config[item.key] = parseFloat(item.value);
      });
      
      const principal = parseFloat(formData.principal);
      const period = parseInt(formData.repayment_period);
      const interestRate = config.loan_interest_rate || 0.02;
      
      const interest = principal * interestRate;
      const totalAmount = principal + interest; // No processing fee in calculation
      
      // Calculate schedule with custom amounts
      const schedule = [];
      let remainingAmount = totalAmount;
      const customTotal = Object.values(customAmounts).reduce((sum, amount) => sum + (parseFloat(amount) || 0), 0);
      
      for (let month = 1; month <= period; month++) {
        let amount;
        if (customAmounts[month]) {
          amount = parseFloat(customAmounts[month]);
        } else if (month === period) {
          // Last month gets remaining balance
          amount = remainingAmount;
        } else {
          // Equal distribution for non-custom months
          const remainingMonths = period - Object.keys(customAmounts).filter(m => parseInt(m) < month).length;
          const remainingForDistribution = totalAmount - customTotal;
          amount = Math.round(remainingForDistribution / remainingMonths);
        }
        
        schedule.push({ month, amount });
        remainingAmount -= amount;
      }
      
      setPreview({
        principal,
        interest,
        totalAmount,
        schedule,
        maxLoanAmount,
        savingsBalance,
        totalLoanBalance
      });
      setError('');
    } catch (error) {
      setError('Error calculating loan preview');
    }
  };

  const handleCustomAmountChange = (month, amount) => {
    const newCustomAmounts = { ...customAmounts };
    if (amount) {
      newCustomAmounts[month] = amount;
    } else {
      delete newCustomAmounts[month];
    }
    setCustomAmounts(newCustomAmounts);
    setFormData({ ...formData, custom_amounts: newCustomAmounts });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await axios.post('/api/loans/apply', {
        principal: parseFloat(formData.principal),
        repayment_period: parseInt(formData.repayment_period),
        custom_amounts: formData.custom_amounts
      });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Application failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#f6f3ef] text-gray-800">
      <aside className={`transition-all duration-200 bg-white border-r border-gray-200 ${collapsed ? 'w-20' : 'w-64'} fixed h-screen overflow-y-auto`}>
        <div className="h-16 flex items-center justify-between px-4 border-b">
          <div className="text-lg font-semibold">{collapsed ? 'C' : 'Crownzcom'}</div>
          <button onClick={() => setCollapsed(!collapsed)} className="p-2 rounded hover:bg-gray-100">{collapsed ? '»' : '«'}</button>
        </div>
        <nav className="px-2 py-3 space-y-1">
          <Link to="/dashboard" className={`flex items-center gap-3 p-2 rounded transition-colors ${collapsed ? '' : 'w-56'} ${location.pathname === '/dashboard' ? 'bg-amber-50 text-amber-900' : 'hover:bg-gray-50'}`}><span>🏠</span>{!collapsed && <span>Dashboard</span>}</Link>
          <Link to="/apply-loan" className={`flex items-center gap-3 p-2 rounded transition-colors ${collapsed ? '' : 'w-56'} ${location.pathname === '/apply-loan' ? 'bg-amber-50 text-amber-900' : 'hover:bg-gray-50'}`}><span>➕</span>{!collapsed && <span>Apply Loan</span>}</Link>
        </nav>
      </aside>

      <div className={`flex-1 p-6 ${collapsed ? 'ml-20' : 'ml-64'} transition-all duration-200`}>
        <div className="flex items-center justify-between mb-6">
          <div className="text-sm text-gray-600">Loan Application</div>
        </div>

        <div className="max-w-4xl mx-auto px-0 sm:px-0 lg:px-0">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Apply for Loan</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Loan Amount (₦)
                  </label>
                  <input
                    type="number"
                    required
                    min="1000"
                    value={formData.principal}
                    onChange={(e) => {
                      setFormData({...formData, principal: e.target.value});
                      setPreview(null);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Repayment Period (months)
                  </label>
                  <select
                    required
                    value={formData.repayment_period}
                    onChange={(e) => {
                      setFormData({...formData, repayment_period: e.target.value});
                      setCustomAmounts({});
                      setPreview(null);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Select period</option>
                    <option value="3">3 months</option>
                    <option value="6">6 months</option>
                    <option value="12" disabled>12 months (Long-term - Coming Soon)</option>
                  </select>
                </div>
              </div>

              {formData.repayment_period && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-sm font-medium text-gray-700">
                      Custom Repayment Schedule (Optional)
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowCustomSchedule(!showCustomSchedule)}
                      className="text-sm text-indigo-600 hover:text-indigo-500"
                    >
                      {showCustomSchedule ? 'Use Default Schedule' : 'Customize Schedule'}
                    </button>
                  </div>

                  {showCustomSchedule && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 mb-4">
                        Specify custom amounts for specific months. Remaining months will be auto-calculated.
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {Array.from({ length: parseInt(formData.repayment_period) }, (_, i) => i + 1).map(month => (
                          <div key={month}>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Month {month} (₦)
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={customAmounts[month] || ''}
                              onChange={(e) => handleCustomAmountChange(month, e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                              placeholder="Auto"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={calculatePreview}
                  disabled={!formData.principal || !formData.repayment_period}
                  className="px-4 py-2 border border-indigo-600 rounded-md shadow-sm text-sm font-medium text-indigo-600 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  Preview Loan
                </button>
              </div>

              {preview && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-blue-900 mb-3">Loan Preview</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                    <div>
                      <span className="text-blue-700">Principal:</span>
                      <span className="font-medium ml-2">₦{preview.principal.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-blue-700">Interest (2% of principal):</span>
                      <span className="font-medium ml-2">₦{preview.interest.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-blue-700">Savings Balance:</span>
                      <span className="font-medium ml-2">₦{preview.savingsBalance?.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-blue-700">Outstanding Loans:</span>
                      <span className="font-medium ml-2">₦{preview.totalLoanBalance?.toLocaleString()}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-blue-700 font-semibold">Total Amount:</span>
                      <span className="font-bold ml-2">₦{preview.totalAmount.toLocaleString()}</span>
                    </div>
                    <div className="col-span-2 text-xs text-blue-600">
                      Available to borrow: ₦{preview.maxLoanAmount?.toLocaleString()} (80% of savings minus outstanding loans)
                    </div>
                    <div className="col-span-2 text-xs text-blue-600">
                      Note: Processing fee will be added by admin after loan approval
                    </div>
                  </div>
                  
                  <h4 className="text-sm font-medium text-blue-900 mb-2">Repayment Schedule:</h4>
                  <div className="space-y-1">
                    {preview.schedule.map(payment => (
                      <div key={payment.month} className="flex justify-between text-sm">
                        <span>Month {payment.month}:</span>
                        <span className="font-medium">₦{payment.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {error && (
                <div className="text-red-600 text-sm">{error}</div>
              )}

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !preview}
                  className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {loading ? 'Submitting...' : 'Apply for Loan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoanApplication;