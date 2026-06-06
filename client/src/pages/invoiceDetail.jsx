import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import useAuth from '../hooks/useAuth';

const InvoiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoice();
  }, [id]);

  const getToken = () => localStorage.getItem('token');

  const fetchInvoice = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/invoices/${id}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      setInvoice(res.data);
    } catch (err) {
      alert('Invoice not found');
      navigate('/invoices');
    }
    setLoading(false);
  };

  const downloadPDF = async () => {
  try {
    const res = await axios.get(`http://localhost:5000/api/invoices/${id}/pdf`, {
      headers: { Authorization: `Bearer ${getToken()}` },
      responseType: 'blob'
    });
    
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `invoice-${invoice.invoiceNumber}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (err) {
    alert('Failed to download PDF');
  }
};
  const sendEmail = async () => {
    try {
      await axios.post(`http://localhost:5000/api/invoices/${id}/send`, {}, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      alert('Invoice sent successfully!');
      fetchInvoice();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send email');
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
  if (!invoice) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-indigo-600">QuickBill</h1>
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="text-gray-600 hover:text-indigo-600">Dashboard</Link>
          <Link to="/invoices" className="text-gray-600 hover:text-indigo-600">Invoices</Link>
          <span className="text-sm text-gray-600">{user?.name}</span>
          {user?.isPro && <span className="bg-yellow-400 text-xs px-2 py-1 rounded-full">PRO</span>}
          <button onClick={logout} className="text-sm text-red-500">Logout</button>
        </div>
      </nav>

      <div className="p-8 max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold">Invoice {invoice.invoiceNumber}</h2>
            <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold capitalize ${getStatusColor(invoice.status)}`}>
              {invoice.status}
            </span>
          </div>
          <div className="flex gap-3">
            <button onClick={downloadPDF} className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
              Download PDF
            </button>
            <button onClick={sendEmail} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
              Send Email
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-8">
          <div className="flex justify-between mb-8">
            <div>
              <p className="text-gray-500 text-sm">From</p>
              <p className="font-semibold text-lg">{user?.name}</p>
              <p className="text-gray-600">{user?.email}</p>
            </div>
            <div className="text-right">
              <p className="text-gray-500 text-sm">Bill To</p>
              <p className="font-semibold text-lg">{invoice.clientId?.name}</p>
              <p className="text-gray-600">{invoice.clientId?.email}</p>
              {invoice.clientId?.address && <p className="text-gray-600">{invoice.clientId.address}</p>}
              {invoice.clientId?.phone && <p className="text-gray-600">{invoice.clientId.phone}</p>}
            </div>
          </div>

          <div className="flex justify-between mb-8 text-sm">
            <div>
              <p className="text-gray-500">Issue Date</p>
              <p className="font-medium">{new Date(invoice.issueDate).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-gray-500">Due Date</p>
              <p className="font-medium">{new Date(invoice.dueDate).toLocaleDateString()}</p>
            </div>
          </div>

          <table className="w-full mb-8">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left text-sm">Description</th>
                <th className="p-3 text-center text-sm">Qty</th>
                <th className="p-3 text-right text-sm">Rate</th>
                <th className="p-3 text-right text-sm">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, idx) => (
                <tr key={idx} className="border-t">
                  <td className="p-3">{item.description}</td>
                  <td className="p-3 text-center">{item.quantity}</td>
                  <td className="p-3 text-right">${item.rate.toFixed(2)}</td>
                  <td className="p-3 text-right">${item.amount.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end">
            <div className="w-64">
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">${invoice.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Tax ({invoice.taxRate}%)</span>
                <span className="font-medium">${invoice.taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-3 text-xl font-bold text-indigo-600">
                <span>Total</span>
                <span>${invoice.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {invoice.notes && (
            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 font-semibold mb-1">Notes</p>
              <p className="text-gray-700">{invoice.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetail;