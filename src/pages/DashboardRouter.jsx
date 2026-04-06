import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import AdminDashboard from './AdminDashboard';
import StaffDashboard from './StaffDashboard';

export default function DashboardRouter() {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'admin') {
    return <AdminDashboard />;
  } else if (user.role === 'staff') {
    return <StaffDashboard />;
  } else {
    // If student tries to go to dashboard
    return <Navigate to="/track" replace />;
  }
}
