import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const Dashboard = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-indigo-600">QuickBill</h1>
        <div className="flex items-center gap-4">
  <Link to="/clients" className="text-gray-600 hover:text-indigo-600">Clients</Link>
  <Link to="/invoices" className="text-gray-600 hover:text-indigo-600">Invoices</Link>
  <Link to="/pricing" className="text-gray-600 hover:text-indigo-600">Pricing</Link>
  <span className="text-sm text-gray-600">{user?.name}</span>
  {user?.isPro && <span className="bg-yellow-400 text-xs px-2 py-1 rounded-full">PRO</span>}
  <button onClick={logout} className="text-sm text-red-500">Logout</button>
</div>
      </nav>
      
      <div className="p-8">
        <h2 className="text-2xl font-bold mb-4">Dashboard</h2>
        <p className="text-gray-600">Welcome back! Start creating invoices.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <Link to="/invoices/new" className="bg-white p-6 rounded-lg shadow hover:shadow-md transition">
            <p className="text-indigo-600 font-semibold mb-2">+ Create Invoice</p>
            <p className="text-gray-500 text-sm">Create a new invoice for your client</p>
          </Link>
          <Link to="/clients" className="bg-white p-6 rounded-lg shadow hover:shadow-md transition">
            <p className="text-indigo-600 font-semibold mb-2">Manage Clients</p>
            <p className="text-gray-500 text-sm">Add or edit your client list</p>
          </Link>
          <Link to="/invoices" className="bg-white p-6 rounded-lg shadow hover:shadow-md transition">
            <p className="text-indigo-600 font-semibold mb-2">View Invoices</p>
            <p className="text-gray-500 text-sm">Track and manage all invoices</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;