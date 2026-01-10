import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSidebar } from '../contexts/SidebarContext';
import axios from 'axios';

const AdminConfig = () => {
  const location = useLocation();
  const { collapsed, setCollapsed } = useSidebar();
  const [config, setConfig] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await axios.get('/api/admin/config');
        const configObj = {};
        response.data.forEach(item => {
          configObj[item.key] = item.value;
        });
        setConfig(configObj);
      } catch (error) {
        console.error('Error fetching config:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, []);

  const handleConfigChange = (key, value) => {
    setConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    
    try {
      const configs = Object.entries(config).map(([key, value]) => ({
        key,
        value: value.toString()
      }));

      await axios.put('/api/admin/config', { configs });
      setMessage('Configuration updated successfully');
    } catch (error) {
      setMessage('Error updating configuration');
      console.error('Error saving config:', error);
    } finally {
      setSaving(false);
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
          <Link to="/admin/config" className={`flex items-center gap-3 p-2 rounded transition-colors ${collapsed ? '' : 'w-56'} ${location.pathname === '/admin/config' ? 'bg-amber-50 text-amber-900' : 'hover:bg-gray-50'}`}><span>⚙️</span>{!collapsed && <span>Config</span>}</Link>
        </nav>
      </aside>

      <div className={`flex-1 p-6 ${collapsed ? 'ml-20' : 'ml-64'} transition-all duration-200`}>
        <div className="flex items-center justify-between mb-6">
          <div className="text-sm text-gray-600">System Configuration</div>
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

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Annual Subscription Fee (₦)
                </label>
                <input
                  type="number"
                  value={config.annual_subscription_fee || ''}
                  onChange={(e) => handleConfigChange('annual_subscription_fee', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Annual membership fee required before loan applications
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loan Interest Rate (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={config.loan_interest_rate ? (parseFloat(config.loan_interest_rate) * 100).toFixed(2) : ''}
                  onChange={(e) => handleConfigChange('loan_interest_rate', (parseFloat(e.target.value) / 100).toString())}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Standard interest rate applied to all loans (default: 2%)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Early Repayment Interest Rate (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={config.early_repayment_rate ? (parseFloat(config.early_repayment_rate) * 100).toFixed(2) : ''}
                  onChange={(e) => handleConfigChange('early_repayment_rate', (parseFloat(e.target.value) / 100).toString())}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Additional interest rate for early loan repayments (default: 3%)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Repayment Period (months)
                </label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={config.max_repayment_period || ''}
                  onChange={(e) => handleConfigChange('max_repayment_period', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Maximum loan repayment period in months (default: 6)
                </p>
              </div>
            </div>

            <div className="mt-8 flex space-x-4">
              <Link
                to="/admin"
                className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 text-center"
              >
                Back to Admin
              </Link>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminConfig;