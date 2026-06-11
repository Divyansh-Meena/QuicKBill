import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import useAuth from '../hooks/useAuth';
import API_URL from '../config/api';

const CreateInvoice = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    clientId: '',
    dueDate: '',
    taxRate: 0,
    notes: '',
    items: [{ description: '', quantity: 1, rate: 0 }]
  });

  useEffect(() => {
    fetchClients();
  }, []);

  const getToken = () => localStorage.getItem('token');

  const fetchClients = async () => {
  try {
    const token = getToken();
    console.log("🔑 Token:", token ? "Found" : "MISSING!");
    
    const res = await axios.get(`${API_URL}/api/clients`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log("✅ Clients fetched:", res.data);
    console.log("📊 Number of clients:", res.data.length);
    setClients(res.data);
  } catch (err) {
    console.error("❌ Error fetching clients:", err);
    console.error("❌ Error response:", err.response?.data);
    alert("Failed to load clients: " + (err.response?.data?.message || err.message));
  }
};

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { description: '', quantity: 1, rate: 0 }]
    });
  };

  const removeItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const updateItem = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    setFormData({ ...formData, items: newItems });
  };

  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => {
      const qty = Number(item.quantity) || 0;
      const rate = Number(item.rate) || 0;
      return sum + (qty * rate);
    }, 0);
    const taxAmount = (subtotal * (Number(formData.taxRate) || 0)) / 100;
    const total = subtotal + taxAmount;
    return { subtotal, taxAmount, total };
  };

  const { subtotal, taxAmount, total } = calculateTotals();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.clientId || !formData.dueDate) {
      alert('Please select a client and due date');
      return;
    }

    setLoading(true);
    try {
      const token = getToken();
      await axios.post(`${API_URL}/api/invoices`, {
        ...formData,
        items: formData.items.map(item => ({
          ...item,
          quantity: Number(item.quantity),
          rate: Number(item.rate)
        }))
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Invoice created successfully!');
      navigate('/invoices');
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating invoice');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-indigo-600">QuickBill</h1>
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="text-gray-600 hover:text-indigo-600">Dashboard</Link>
          <Link to="/clients" className="text-gray-600 hover:text-indigo-600">Clients</Link>
          <Link to="/invoices" className="text-gray-600 hover:text-indigo-600">Invoices</Link>
          <span className="text-sm text-gray-600">{user?.name}</span>
          {user?.isPro && <span className="bg-yellow-400 text-xs px-2 py-1 rounded-full">PRO</span>}
          <button onClick={logout} className="text-sm text-red-500">Logout</button>
        </div>
      </nav>

      <div className="p-8 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold mb-6">Create Invoice</h2>

        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow space-y-6">
          {/* Client & Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Client *</label>
              <div>
  <select
    className="w-full p-3 border rounded-lg"
    value={formData.clientId}
    onChange={(e) => setFormData({...formData, clientId: e.target.value})}
    required
  >
    <option value="">Select a client</option>
    {clients.length === 0 ? (
      <option value="" disabled>⚠️ No clients found — add clients first</option>
    ) : (
      clients.map(client => (
        <option key={client._id} value={client._id}>{client.name} ({client.email})</option>
      ))
    )}
  </select>
  {clients.length === 0 && (
    <p className="text-red-500 text-sm mt-2">
      <Link to="/clients" className="underline">Go to Clients page →</Link> to add a client first.
    </p>
  )}
</div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Due Date *</label>
              <input
                type="date"
                className="w-full p-3 border rounded-lg"
                value={formData.dueDate}
                onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                required
              />
            </div>
          </div>

          {/* Line Items */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="text-sm font-medium">Line Items</label>
              <button
                type="button"
                onClick={addItem}
                className="text-indigo-600 text-sm hover:underline"
              >
                + Add Item
              </button>
            </div>
            
            {formData.items.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 mb-2 items-center">
                <div className="col-span-6">
                  <input
                    type="text"
                    placeholder="Description"
                    className="w-full p-2 border rounded"
                    value={item.description}
                    onChange={(e) => updateItem(index, 'description', e.target.value)}
                    required
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    placeholder="Qty"
                    className="w-full p-2 border rounded"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                    min="1"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    placeholder="Rate"
                    className="w-full p-2 border rounded"
                    value={item.rate}
                    onChange={(e) => updateItem(index, 'rate', e.target.value)}
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                <div className="col-span-1 text-right">
                  ${(Number(item.quantity) * Number(item.rate)).toFixed(2)}
                </div>
                <div className="col-span-1">
                  {formData.items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="text-red-500 text-sm"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Tax & Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Tax Rate (%)</label>
              <input
                type="number"
                className="w-full p-3 border rounded-lg"
                value={formData.taxRate}
                onChange={(e) => setFormData({...formData, taxRate: e.target.value})}
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Notes</label>
              <textarea
                className="w-full p-3 border rounded-lg"
                rows="3"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Optional notes..."
              />
            </div>
          </div>

          {/* Totals */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between mb-2">
              <span>Subtotal:</span>
              <span className="font-semibold">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span>Tax ({formData.taxRate}%):</span>
              <span className="font-semibold">${taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-indigo-600">
              <span>Total:</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white p-3 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Invoice'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateInvoice;