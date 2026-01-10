import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSidebar } from '../contexts/SidebarContext';
import axios from 'axios';

const DistributeInterest = () => {
  const location = useLocation();
  const { collapsed, setCollapsed } = useSidebar();
  const [distributionType, setDistributionType] = useState('loan_interest');
  const [formData, setFormData] = useState({
    total_amount: '',
    retained_earnings: ''
  });
  const [preview, setPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const calculateDistribution = async () => {
    if (!formData.total_amount || parseFloat(formData.total_amount) <= 0) {
      setMessage('Please enter a valid total amount');
      return;
    }

    try {
      const endpoint = distributionType === 'loan_interest' 
        ? '/api/savings/distribute-loan-interest'
        : '/api/savings/distribute-trust-earnings';

      const payload = distributionType === 'loan_interest'
        ? {
            total_interest: parseFloat(formData.total_amount),
            retained_earnings: parseFloat(formData.retained_earnings) || 0
          }
        : {
            total_earnings: parseFloat(formData.total_amount),
            retained_earnings: parseFloat(formData.retained_earnings) || 0
          };

      const response = await axios.post(endpoint, payload);
      setPreview(response.data);
      setMessage('');
    } catch (error) {
      setMessage(error.response?.data?.error || 'Error calculating distribution');
      setPreview(null);
    }
  };

  const executeDistribution = async () => {
    if (!preview) return;

    setSubmitting(true);
    try {
      setMessage('Distribution completed successfully');
      setPreview(null);
      setFormData({ total_amount: '', retained_earnings: '' });
    } catch (error) {
      setMessage(error.response?.data?.error || 'Error executing distribution');
    } finally {
      setSubmitting(false);
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
          <Link to="/admin" className={`flex items-center gap-3 p-2 rounded transition-colors ${collapsed ? '' : 'w-56'} ${location.pathname === '/admin' ? 'bg-amber-50 text-amber-900' : 'hover:bg-gray-50'}`}><span>🏠</span>{!collapsed && <span>Admin</span>}</Link>
          <Link to="/admin/distribute-interest" className={`flex items-center gap-3 p-2 rounded transition-colors ${collapsed ? '' : 'w-56'} ${location.pathname === '/admin/distribute-interest' ? 'bg-amber-50 text-amber-900' : 'hover:bg-gray-50'}`}><span>🔁</span>{!collapsed && <span>Distribute Interest</span>}</Link>
        </nav>
      </aside>

      <div className={`flex-1 p-6 ${collapsed ? 'ml-20' : 'ml-64'} transition-all duration-200`}>
        <div className="flex items-center justify-between mb-6">
          <div className="text-sm text-gray-600">Distribute Interest</div>
        </div>

        <div className="max-w-4xl mx-auto px-0 sm:px-0 lg:px-0">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Distribute Interest & Earnings</h2>
            
            {message && (
              <div className={`mb-6 p-4 rounded-md ${
                message.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
              }`}>
                {message}
              </div>
            )}

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Distribution Type
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="loan_interest"
                      checked={distributionType === 'loan_interest'}
                      onChange={(e) => setDistributionType(e.target.value)}
                      className="mr-2"
                    />
                    <span>Loan Interest (Equal distribution among all members)</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="trust_earnings"
                      checked={distributionType === 'trust_earnings'}
                      onChange={(e) => setDistributionType(e.target.value)}
                      className="mr-2"
                    />
                    <span>Trust Earnings (Proportional to savings balance)</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total {distributionType === 'loan_interest' ? 'Interest' : 'Earnings'} Amount (₦)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.total_amount}
                  onChange={(e) => setFormData({...formData, total_amount: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter total amount to distribute"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Retained Earnings (₦) - Optional
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.retained_earnings}
                  onChange={(e) => setFormData({...formData, retained_earnings: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Amount to retain (optional)"
                />
              </div>

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={calculateDistribution}
                  className="flex-1 py-2 px-4 border border-indigo-600 rounded-md shadow-sm text-sm font-medium text-indigo-600 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Calculate Distribution
                </button>
              </div>

              {preview && (
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Distribution Preview</h3>
                  
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Total Amount:</span>
                        <span className="font-medium ml-2">₦{preview.total_interest?.toLocaleString() || preview.total_earnings?.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Retained Earnings:</span>
                        <span className="font-medium ml-2">₦{preview.retained_earnings?.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Distributed Amount:</span>
                        <span className="font-medium ml-2">₦{preview.distributed_amount?.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Members Count:</span>
                        <span className="font-medium ml-2">{preview.members_count || preview.distributions?.length}</span>
                      </div>
                      {preview.amount_per_member && (
                        <div className="col-span-2">
                          <span className="text-gray-600">Amount per Member:</span>
                          <span className="font-medium ml-2">₦{preview.amount_per_member?.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {preview.distributions && (
                    <div className="max-h-60 overflow-y-auto">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Individual Distributions:</h4>
                      <div className="space-y-2">
                        {preview.distributions.map((dist, index) => (
                          <div key={index} className="flex justify-between items-center py-2 px-3 bg-white rounded border">
                            <span className="text-sm">Member {dist.user_id}</span>
                            <span className="text-sm font-medium">₦{dist.amount?.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex space-x-4 mt-6">
                    <button
                      type="button"
                      onClick={() => setPreview(null)}
                      className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={executeDistribution}
                      disabled={submitting}
                      className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                    >
                      {submitting ? 'Executing...' : 'Execute Distribution'}
                    </button>
                  </div>
                </div>
              )}

              {!preview && (
                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => navigate('/admin')}
                    className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Back to Admin
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DistributeInterest;