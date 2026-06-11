import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import useAuth from '../hooks/useAuth';
import API_URL from '../config/api';

const Pricing = () => {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    if (!user) {
      alert('Please login first');
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API_URL}/api/payments/create-checkout-session`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      window.location.href = res.data.url;
    } catch (err) {
      alert('Failed to start checkout');
    }
    setLoading(false);
  };

  const testUpgrade = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API_URL}/api/payments/test-upgrade`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(res.data.message);
      window.location.reload();
    } catch (err) {
      alert('Upgrade failed');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm p-4 flex justify-between items-center">
        <Link to="/" className="text-xl font-bold text-indigo-600">QuickBill</Link>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link to="/dashboard" className="text-gray-600 hover:text-indigo-600">Dashboard</Link>
              <span className="text-sm text-gray-600">{user.name}</span>
              {user.isPro && <span className="bg-yellow-400 text-xs px-2 py-1 rounded-full">PRO</span>}
              <button onClick={logout} className="text-sm text-red-500">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-gray-600 hover:text-indigo-600">Login</Link>
              <Link to="/register" className="text-gray-600 hover:text-indigo-600">Register</Link>
            </>
          )}
        </div>
      </nav>

      <div className="p-8 max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-4">Choose Your Plan</h2>
        <p className="text-gray-600 text-center mb-12">Start free, upgrade when you need more</p>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Free Plan */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
            <h3 className="text-xl font-semibold mb-2">Free</h3>
            <div className="text-4xl font-bold mb-6">$0<span className="text-lg text-gray-500 font-normal">/month</span></div>
            
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-2"><span className="text-green-500">✓</span> 5 invoices per month</li>
              <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Client management</li>
              <li className="flex items-center gap-2"><span className="text-green-500">✓</span> PDF generation</li>
              <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Email invoices</li>
              <li className="flex items-center gap-2 text-gray-400"><span>✕</span> "Created with QuickBill" watermark</li>
            </ul>

            <button disabled className="w-full py-3 rounded-lg bg-gray-100 text-gray-500 font-semibold">
              {user?.isPro ? 'Downgraded' : 'Current Plan'}
            </button>
          </div>

          {/* Pro Plan */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-indigo-600 relative">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-indigo-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
              RECOMMENDED
            </div>
            <h3 className="text-xl font-semibold mb-2">Pro</h3>
            <div className="text-4xl font-bold mb-6">$9.99<span className="text-lg text-gray-500 font-normal">/month</span></div>
            
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Unlimited invoices</li>
              <li className="flex items-center gap-2"><span className="text-green-500">✓</span> No watermark on PDFs</li>
              <li className="flex items-center gap-2"><span className="text-green-500">✓</span> All Free features</li>
              <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Cancel anytime</li>
            </ul>

            <div className="space-y-3">
              <button 
                onClick={handleUpgrade}
                disabled={loading || user?.isPro}
                className={`w-full py-3 rounded-lg font-semibold ${
                  user?.isPro ? 'bg-green-100 text-green-700' : 'bg-indigo-600 text-white hover:bg-indigo-700'
                } disabled:opacity-70`}
              >
                {user?.isPro ? 'You are Pro!' : loading ? 'Loading...' : 'Upgrade to Pro'}
              </button>
              
              {!user?.isPro && (
                <button 
                  onClick={testUpgrade}
                  className="w-full py-2 rounded-lg border-2 border-dashed border-gray-300 text-gray-500 hover:border-indigo-400 hover:text-indigo-600 text-sm"
                >
                  ⚡ Test: Activate Pro (Free)
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;