import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSidebar } from '../contexts/SidebarContext';
import axios from 'axios';

const RecordRepayment = () => {
  const location = useLocation();
  const { collapsed, setCollapsed } = useSidebar();
  const [activeLoans, setActiveLoans] = useState([]);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [formData, setFormData] = useState({
    loan_id: '',
    schedule_id: '',
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    transaction_type: 'regular',
    notes: ''
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    const fetchActiveLoans = async () => {
      try {
        const response = await axios.get('/api/loans/admin/active');
        setActiveLoans(response.data || []);
      } catch (error) {
        console.error('Error fetching active loans:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchActiveLoans();
  }, []);

  const handleLoanSelect = async (loanId) => {
    if (!loanId) {
      setSelectedLoan(null);
      setFormData({...formData, loan_id: '', schedule_id: '', amount: ''});
      return;
    }

    try {
      const response = await axios.get(`/api/loans/${loanId}`);
      setSelectedLoan(response.data);
      setFormData({...formData, loan_id: loanId, schedule_id: '', amount: ''});
    } catch (error) {
      console.error('Error fetching loan details:', error);
    }
  };

  const handleScheduleSelect = (scheduleId) => {
    const schedule = selectedLoan?.schedule?.find(s => s.id === parseInt(scheduleId));
    setFormData({
      ...formData, 
      schedule_id: scheduleId,
      amount: schedule ? schedule.scheduled_amount.toString() : ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');

    try {
      await axios.post(`/api/loans/${formData.loan_id}/repayment`, {
        amount: parseFloat(formData.amount),
        payment_date: formData.payment_date,
        schedule_id: parseInt(formData.schedule_id),
        transaction_type: formData.transaction_type,
        notes: formData.notes
      });

      setMessage('Repayment recorded successfully');
      setFormData({
        loan_id: '',
        schedule_id: '',
        amount: '',
        payment_date: new Date().toISOString().split('T')[0],
        transaction_type: 'regular',
        notes: ''
      });
      setSelectedLoan(null);
      
      // Refresh active loans
      const response = await axios.get('/api/loans/admin/active');
      setActiveLoans(response.data || []);
    } catch (error) {
      setMessage(error.response?.data?.error || 'Error recording repayment');
    } finally {
      setSubmitting(false);
    }
  };

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
          <Link to="/admin" className={`flex items-center gap-3 p-2 rounded transition-colors ${collapsed ? '' : 'w-56'} ${location.pathname === '/admin' ? 'bg-amber-50 text-amber-900' : 'hover:bg-gray-50'}`}><span>🏠</span>{!collapsed && <span>Admin</span>}</Link>
          <Link to="/admin/record-repayment" className={`flex items-center gap-3 p-2 rounded transition-colors ${collapsed ? '' : 'w-56'} ${location.pathname === '/admin/record-repayment' ? 'bg-amber-50 text-amber-900' : 'hover:bg-gray-50'}`}><span>✅</span>{!collapsed && <span>Record Repayment</span>}</Link>
        </nav>
      </aside>

      <div className={`flex-1 p-6 ${collapsed ? 'ml-20' : 'ml-64'} transition-all duration-200`}>
        <div className="flex items-center justify-between mb-6">
          <div className="text-sm text-gray-600">Record Repayment</div>
        </div>

        <div className="max-w-4xl mx-auto px-0 sm:px-0 lg:px-0">
          <div className="bg-white rounded-lg shadow p-6">
            {message && (
              <div className={`mb-6 p-4 rounded-md ${
                message.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
              }`}>
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Active Loan
                </label>
                <select
                  required
                  value={formData.loan_id}
                  onChange={(e) => handleLoanSelect(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Choose a loan</option>
                  {Array.isArray(activeLoans) && activeLoans.length === 0 ? (
                    <option value="">No active loans available</option>
                  ) : (
                    Array.isArray(activeLoans) && activeLoans.map(loan => (
                      <option key={loan.id} value={loan.id}>
                        {loan.full_name} - ₦{loan.principal?.toLocaleString()} (Remaining: ₦{loan.remaining_balance?.toLocaleString()})
                      </option>
                    ))
                  )}
                </select>
              </div>

              {selectedLoan && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Payment Schedule
                  </label>
                  <select
                    required
                    value={formData.schedule_id}
                    onChange={(e) => handleScheduleSelect(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Choose a schedule</option>
                    {selectedLoan.schedule?.filter(s => s.status === 'pending').map(schedule => (
                      <option key={schedule.id} value={schedule.id}>
                        Month {schedule.month_number} - ₦{schedule.scheduled_amount?.toLocaleString()} (Due: {new Date(schedule.due_date).toLocaleDateString()})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Amount (₦)
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Date
                </label>
                <input
                  type="date"
                  required
                  value={formData.payment_date}
                  onChange={(e) => setFormData({...formData, payment_date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Transaction Type
                </label>
                <select
                  value={formData.transaction_type}
                  onChange={(e) => setFormData({...formData, transaction_type: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="regular">Regular Payment</option>
                  <option value="early">Early Payment</option>
                  <option value="partial">Partial Payment</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Additional notes about this payment"
                />
              </div>

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => navigate('/admin')}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {submitting ? 'Recording...' : 'Record Repayment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecordRepayment;