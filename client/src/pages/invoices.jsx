import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import useAuth from '../hooks/useAuth';
import API_URL from '../config/api';

const Invoices = () => {
  const { user, logout } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const getToken = () => localStorage.getItem('token');

  const fetchInvoices = async () => {
    try {
      const res = await axios.get('http://`${API_URL}`/api/invoices', {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      setInvoices(res.data);
    } catch (err) {
      console.error('Error fetching invoices:', err);
    }
    setLoading(false);
  };

  const updateStatus = async (id, status) => {
    try {
      const token = getToken();
      await axios.put('http://`${API_URL}`/api/invoices/${id}/status', { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchInvoices();
    } catch (err) {
      alert('Error updating status');
    }
  };

  const deleteInvoice = async (id) => {
    if (!confirm('Are you sure?')) return;
    try {
      const token = getToken();
      await axios.delete('http://`${API_URL}`/api/invoices/${id}', {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchInvoices();
    } catch (err) {
      alert('Error deleting invoice');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-indigo-600">QuickBill</h1>
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="text-gray-600 hover:text-indigo-600">Dashboard</Link>
          <Link to="/clients" className="text-gray-600 hover:text-indigo-600">Clients</Link>
          <span className="text-sm text-gray-600">{user?.name}</span>
          {user?.isPro && <span className="bg-yellow-400 text-xs px-2 py-1 rounded-full">PRO</span>}
          <button onClick={logout} className="text-sm text-red-500">Logout</button>
        </div>
      </nav>

      <div className="p-8 max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Invoices</h2>
          <Link to="/invoices/new" className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
            + Create Invoice
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-4 text-left">Invoice #</th>
                <th className="p-4 text-left">Client</th>
                <th className="p-4 text-left">Due Date</th>
                <th className="p-4 text-left">Total</th>
                <th className="p-4 text-left">Status</th>
                <th className="p-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-500">
                    No invoices yet. Create your first invoice!
                  </td>
                </tr>
              ) : (
                invoices.map(invoice => (
                  <tr key={invoice._id} className="border-t hover:bg-gray-50">
                    <td className="p-4 font-medium">
  <Link to={`/invoices/${invoice._id}`} className="text-indigo-600 hover:underline">
    {invoice.invoiceNumber}
  </Link>
</td>
                    <td className="p-4">{invoice.clientId?.name || 'Unknown'}</td>
                    <td className="p-4">{new Date(invoice.dueDate).toLocaleDateString()}</td>
                    <td className="p-4 font-semibold">${invoice.total.toFixed(2)}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs capitalize ${getStatusColor(invoice.status)}`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td className="p-4 flex gap-2">
                      {invoice.status === 'draft' && (
                        <button onClick={() => updateStatus(invoice._id, 'sent')} className="text-blue-600 text-sm hover:underline">
                          Mark Sent
                        </button>
                      )}
                      {invoice.status === 'sent' && (
                        <button onClick={() => updateStatus(invoice._id, 'paid')} className="text-green-600 text-sm hover:underline">
                          Mark Paid
                        </button>
                      )}
                      <button onClick={() => deleteInvoice(invoice._id)} className="text-red-600 text-sm hover:underline">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Invoices;