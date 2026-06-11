import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import API_URL from '../config/api';

const Clients = () => {
  const { user, logout } = useAuth();
  const [clients, setClients] = useState([]);
  const [formData, setFormData] = useState({ name: '', email: '', address: '', phone: '' });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClients();
  }, []);

  const getToken = () => localStorage.getItem('token');

  const fetchClients = async () => {
    try {
      
      const res = await axios.get(`${API_URL}/api/clients`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      setClients(res.data);
    } catch (err) {
      console.error('Error fetching clients:', err);
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = getToken();
      if (editingId) {
        
        await axios.put(`${API_URL}/api/clients/${editingId}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        
        await axios.post(`${API_URL}/api/clients`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      setFormData({ name: '', email: '', address: '', phone: '' });
      setEditingId(null);
      fetchClients();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving client');
    }
  };

  const handleEdit = (client) => {
    setFormData({ 
      name: client.name, 
      email: client.email, 
      address: client.address || '', 
      phone: client.phone || '' 
    });
    setEditingId(client._id);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this client?')) return;
    try {
      
      await axios.delete(`${API_URL}/api/clients/${id}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      fetchClients();
    } catch (err) {
      alert('Error deleting client');
    }
  };

  if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>;

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

      <div className="p-8 max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold mb-6">Client Management</h2>

        {/* Form */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h3 className="text-lg font-semibold mb-4">{editingId ? 'Edit Client' : 'Add New Client'}</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Client Name *"
              className="p-3 border rounded-lg"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
            <input
              type="email"
              placeholder="Email *"
              className="p-3 border rounded-lg"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
            />
            <input
              type="text"
              placeholder="Address"
              className="p-3 border rounded-lg"
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
            />
            <input
              type="text"
              placeholder="Phone"
              className="p-3 border rounded-lg"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
            />
            <div className="md:col-span-2 flex gap-4">
              <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700">
                {editingId ? 'Update Client' : 'Add Client'}
              </button>
              {editingId && (
                <button 
                  type="button" 
                  onClick={() => { setEditingId(null); setFormData({ name: '', email: '', address: '', phone: '' }); }}
                  className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-4 text-left">Name</th>
                <th className="p-4 text-left">Email</th>
                <th className="p-4 text-left">Phone</th>
                <th className="p-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {clients.length === 0 ? (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-gray-500">
                    No clients yet. Add your first client above!
                  </td>
                </tr>
              ) : (
                clients.map(client => (
                  <tr key={client._id} className="border-t hover:bg-gray-50">
                    <td className="p-4">{client.name}</td>
                    <td className="p-4">{client.email}</td>
                    <td className="p-4">{client.phone || '-'}</td>
                    <td className="p-4 flex gap-3">
                      <button onClick={() => handleEdit(client)} className="text-blue-600 hover:underline">Edit</button>
                      <button onClick={() => handleDelete(client._id)} className="text-red-600 hover:underline">Delete</button>
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

export default Clients;