import { Link, useNavigate } from 'react-router-dom';
import { Wrench, QrCode, Search, ClipboardList, LogOut, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar glass-panel animate-fade-in">
      <div className="container nav-container">
        <Link to="/" className="nav-brand">
          <Wrench size={28} color="var(--primary)" />
          <span>SmartQR Maintenance</span>
        </Link>
        <div className="nav-links">
          {user?.role === 'admin' && (
            <Link to="/qr" className="btn btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.875rem' }}>
              <QrCode size={16} /> Location QR Generator
            </Link>
          )}

          <Link to="/track" className="btn btn-outline" style={{ padding: '0.4rem 1rem', fontSize: '0.875rem' }}>
             <Search size={16} /> Track Ticket
          </Link>
          
          <Link to="/report" className="btn btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.875rem' }}>
             <ClipboardList size={16} /> Report Issue
          </Link>
          
          {(user?.role === 'admin' || user?.role === 'staff') && (
            <Link to="/dashboard" className="btn btn-outline" style={{ padding: '0.4rem 1rem', fontSize: '0.875rem', marginRight: '1rem', borderColor: 'var(--success)', color: 'var(--success)' }}>
              {user.role === 'admin' ? 'Admin Dashboard' : 'Staff Dashboard'}
            </Link>
          )}

          {user ? (
            <button onClick={handleLogout} className="btn" style={{ padding: '0.4rem 1rem', fontSize: '0.875rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)' }}>
              <LogOut size={16} /> Logout
            </button>
          ) : (
            <Link to="/login" className="btn btn-outline" style={{ padding: '0.4rem 1rem', fontSize: '0.875rem' }}>
              <LogIn size={16} /> Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
