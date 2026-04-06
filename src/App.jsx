import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import ReportIssue from './pages/ReportIssue';
import TrackTicket from './pages/TrackTicket';
import DashboardRouter from './pages/DashboardRouter';
import GenerateQR from './pages/GenerateQR';
import Login from './pages/Login';
import Signup from './pages/Signup';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <main className="container" style={{ paddingTop: '100px', paddingBottom: '40px' }}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/report" element={<ReportIssue />} />
            <Route path="/track" element={<TrackTicket />} />
            <Route path="/dashboard" element={<DashboardRouter />} />
            <Route path="/qr" element={<GenerateQR />} />
          </Routes>
        </main>
      </Router>
    </AuthProvider>
  );
}

export default App;