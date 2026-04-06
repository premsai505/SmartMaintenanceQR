import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { Users, Route, BarChart3, Database, QrCode } from 'lucide-react';

export default function AdminDashboard() {
  const { token } = useAuth();
  
  const [stats, setStats] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [staff, setStaff] = useState([]);
  const [rules, setRules] = useState([]);
  const [qrs, setQrs] = useState([]);
  
  const [activeTab, setActiveTab] = useState('tickets');
  const [error, setError] = useState('');

  const [newUser, setNewUser] = useState({ email: '', password: '', role: 'student', phone: '' });
  const [newRule, setNewRule] = useState({ hostel_name: '', staff_id: '' });

  const fetchData = async () => {
    try {
      setError('');
      const [st, tk, sf, rl, qr] = await Promise.all([
        axios.get('http://localhost:3000/api/admin/stats'),
        axios.get('http://localhost:3000/api/tickets'),
        axios.get('http://localhost:3000/api/admin/staff'),
        axios.get('http://localhost:3000/api/admin/rules'),
        axios.get('http://localhost:3000/api/admin/qrs')
      ]);
      setStats(st.data);
      setTickets(tk.data);
      setStaff(sf.data);
      setRules(rl.data);
      setQrs(qr.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch admin data from backend.');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:3000/api/admin/users', newUser);
      alert('User created successfully');
      setNewUser({ email: '', password: '', role: 'student', phone: '' });
      fetchData();
    } catch(err) {
      alert(err.response?.data?.error || 'Failed to create user');
    }
  };

  const handleCreateRule = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:3000/api/admin/rules', newRule);
      alert('Rule applied!');
      setNewRule({ hostel_name: '', staff_id: '' });
      fetchData();
    } catch(err) {
      alert('Failed to set rule');
    }
  };

  if (error) return <div style={{ textAlign: 'center', marginTop: '4rem', color: 'red' }}>{error}</div>;
  if (!stats) return <div style={{ textAlign: 'center', marginTop: '4rem' }}>Loading Admin Panel...</div>;

  return (
    <div className="animate-fade-in" style={{ margin: '2rem auto' }}>
      <h2 style={{ marginBottom: '2rem' }}>Main Admin Control Center</h2>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <button onClick={() => setActiveTab('tickets')} className={`btn ${activeTab === 'tickets' ? 'btn-primary' : 'btn-outline'}`} style={{ flex: 1, minWidth: '150px' }}>
          <Database size={18} /> View All Tickets
        </button>
        <button onClick={() => setActiveTab('stats')} className={`btn ${activeTab === 'stats' ? 'btn-primary' : 'btn-outline'}`} style={{ flex: 1, minWidth: '150px' }}>
          <BarChart3 size={18} /> View Statistics
        </button>
        <button onClick={() => setActiveTab('rules')} className={`btn ${activeTab === 'rules' ? 'btn-primary' : 'btn-outline'}`} style={{ flex: 1, minWidth: '150px' }}>
          <Route size={18} /> Manage Routing & Staff
        </button>
        <button onClick={() => setActiveTab('qrs')} className={`btn ${activeTab === 'qrs' ? 'btn-primary' : 'btn-outline'}`} style={{ flex: 1, minWidth: '150px' }}>
          <QrCode size={18} /> Location QRs
        </button>
        <button onClick={() => setActiveTab('users')} className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-outline'}`} style={{ flex: 1, minWidth: '150px' }}>
          <Users size={18} /> Add Accounts
        </button>
      </div>

      {activeTab === 'tickets' && (
        <div className="glass-panel animate-fade-in" style={{ padding: '1.5rem' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>All Ticket Applications</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--surface-border)' }}>
                  <th style={{ padding: '1rem' }}>ID</th>
                  <th style={{ padding: '1rem' }}>Hostel</th>
                  <th style={{ padding: '1rem' }}>Floor</th>
                  <th style={{ padding: '1rem' }}>Problem</th>
                  <th style={{ padding: '1rem' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map(t => (
                  <tr key={t.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '1rem', fontFamily: 'monospace' }}>{t.id}</td>
                    <td style={{ padding: '1rem' }}>{t.hostel_name}</td>
                    <td style={{ padding: '1rem' }}>{t.floor_name}</td>
                    <td style={{ padding: '1rem' }}>{t.problem_type}</td>
                    <td style={{ padding: '1rem' }}><span className={`badge ${t.status === 'Completed' ? 'badge-resolved' : t.status === 'In Progress' ? 'badge-in-progress' : 'badge-pending'}`}>{t.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'stats' && (
        <div className="glass-panel animate-fade-in" style={{ padding: '1.5rem', maxWidth: '400px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--primary)' }}><BarChart3 /> <h3>Monthly Output</h3></div>
          <h1 style={{ fontSize: '3rem', margin: '1rem 0' }}>{stats.tickets_last_30_days}</h1>
          <p style={{ color: 'var(--text-muted)' }}>Total Application Tickets in the last 30 days.</p>
        </div>
      )}

      {activeTab === 'rules' && (
        <div className="glass-panel animate-fade-in" style={{ padding: '1.5rem', maxWidth: '600px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--secondary)' }}><Route /> <h3>Set Staff Route Automation</h3></div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>Auto-assign a specific staff member to tickets originating from a specific Hostel.</p>
          <form onSubmit={handleCreateRule} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <input type="text" placeholder="exact Hostel Name (e.g. Mega Hostel)" className="input-field" value={newRule.hostel_name} onChange={e => setNewRule({...newRule, hostel_name: e.target.value})} required />
            <select className="input-field" value={newRule.staff_id} onChange={e => setNewRule({...newRule, staff_id: e.target.value})} required>
              <option value="" disabled>Select Staff</option>
              {staff.map(s => <option key={s.id} value={s.id}>{s.email} - Phone: {s.phone || 'N/A'}</option>)}
            </select>
            <button className="btn btn-primary" type="submit" style={{ marginTop: '1rem' }}>Enforce Route Rule</button>
          </form>
          
          <h4 style={{ marginTop: '2rem', marginBottom: '1rem' }}>Current Active Rules</h4>
          {rules.length === 0 ? <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No rules exist yet.</p> : (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {rules.map(r => (
                <li key={r.id} style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', marginBottom: '0.5rem' }}>
                  <strong>{r.hostel_name}</strong> is maintained by {r.staff_email}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {activeTab === 'qrs' && (
        <div className="glass-panel animate-fade-in" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)' }}>
              <QrCode /> <h3 style={{ margin: 0 }}>Generated QR Locations</h3>
            </div>
            <Link to="/qr" className="btn btn-primary" target="_blank">Generate New Format</Link>
          </div>
          
          {qrs.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>No location QR codes have been minted into the database yet.</p> : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
              {qrs.map(q => (
                <div key={q.id} style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <img src={q.qr_url} alt="QR" width="60" height="60" style={{ background: 'white', padding: '4px', borderRadius: '4px' }} />
                  <div>
                    <p style={{ fontWeight: '500', marginBottom: '0.25rem' }}>{q.hostel_name}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Floor: {q.floor_name || 'Main'}</p>
                    <a href={q.qr_url} download={`QR_${q.hostel_name}.png`} target="_blank" rel="noreferrer" style={{ fontSize: '0.75rem', color: 'var(--primary)', marginTop: '0.25rem', display: 'inline-block' }}>Download Image</a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'users' && (
        <div className="glass-panel animate-fade-in" style={{ padding: '1.5rem', maxWidth: '600px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--success)' }}><Users /> <h3>Register System Accounts</h3></div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>Add phone numbers to Staff, or register new Admins here.</p>
          <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <input type="email" placeholder="Email Address" className="input-field" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} required />
            <input type="password" placeholder="Temporary Password" className="input-field" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} required />
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <select className="input-field" value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})} style={{ flex: 1 }}>
                <option value="student">Student</option>
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </select>
              <input type="text" placeholder="Phone Number (Vital for Staff)" className="input-field" value={newUser.phone} onChange={e => setNewUser({...newUser, phone: e.target.value})} style={{ flex: 1 }} />
            </div>
            <button className="btn btn-outline" type="submit" style={{ marginTop: '1rem' }}>Mint New Account</button>
          </form>
        </div>
      )}
    </div>
  );
}
