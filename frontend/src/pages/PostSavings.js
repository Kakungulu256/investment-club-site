import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSidebar } from '../contexts/SidebarContext';
import axios from 'axios';

const PostSavings = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { collapsed, setCollapsed } = useSidebar();
  const [members, setMembers] = useState([]);
  const [formData, setFormData] = useState({
    user_id: '',
    amount: '',
    description: '',
    transaction_date: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const response = await axios.get('/api/auth/members');
        setMembers(response.data || []);
      } catch (error) {
        console.error('Error fetching members:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');

    try {
      await axios.post('/api/savings/post', {
        user_id: parseInt(formData.user_id),
        amount: parseFloat(formData.amount),
        description: formData.description,
        transaction_date: formData.transaction_date
      });

      setMessage('Savings posted successfully');
      setFormData({
        user_id: '',
        amount: '',
        description: '',
        transaction_date: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      setMessage(error.response?.data?.error || 'Error posting savings');
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
          <Link to="/admin/post-savings" className={`flex items-center gap-3 p-2 rounded transition-colors ${collapsed ? '' : 'w-56'} ${location.pathname === '/admin/post-savings' ? 'bg-amber-50 text-amber-900' : 'hover:bg-gray-50'}`}><span>➕</span>{!collapsed && <span>Post Savings</span>}</Link>
        </nav>
      </aside>

      <div className={`flex-1 p-6 ${collapsed ? 'ml-20' : 'ml-64'} transition-all duration-200`}>
        <div className="flex items-center justify-between mb-6">
          <div className="text-sm text-gray-600">Post Member Savings</div>
        </div>

        <div className="max-w-2xl mx-auto px-0 sm:px-0 lg:px-0">
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
                  Select Member
                </label>
                <select
                  required
                  value={formData.user_id}
                  onChange={(e) => setFormData({...formData, user_id: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Choose a member</option>
                  {members.map(member => (
                    <option key={member.id} value={member.id}>
                      {member.full_name} (@{member.username})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount (₦)
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
                  Description
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Monthly savings deposit"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Transaction Date
                </label>
                <input
                  type="date"
                  required
                  value={formData.transaction_date}
                  onChange={(e) => setFormData({...formData, transaction_date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
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
                  {submitting ? 'Posting...' : 'Post Savings'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostSavings;