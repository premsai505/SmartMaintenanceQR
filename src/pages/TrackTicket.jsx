import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Search, History } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function TrackTicket() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const initialId = searchParams.get('id') || '';
  
  const [ticketId, setTicketId] = useState(initialId);
  const [ticket, setTicket] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (user?.role === 'student') {
      axios.get('/api/tickets')
        .then(res => setHistory(res.data))
        .catch(err => console.error("Failed to load history", err));
    }
  }, [user]);

  useEffect(() => {
    if (initialId) {
      performTrack(initialId);
    }
  }, [initialId]);

  const performTrack = async (idToTrack) => {
    if (!idToTrack) return;
    
    setIsLoading(true);
    setError('');
    setTicket(null);

    try {
      const response = await axios.get(`/api/tickets/${idToTrack.toUpperCase()}`);
      setTicket(response.data);
    } catch (err) {
      if (err.response && err.response.status === 404) {
        setError('Ticket not found. Please check your ID and try again.');
      } else {
        setError('An error occurred. Ensure the backend server is running.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleTrack = async (e) => {
    e.preventDefault();
    performTrack(ticketId);
  };

  const getStatusBadgeClass = (status) => {
    if (status === 'Pending') return 'badge-pending';
    if (status === 'In Progress') return 'badge-in-progress';
    if (status === 'Resolved') return 'badge-resolved';
    return '';
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '600px', margin: '2rem auto' }}>
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Search /> Track Ticket Status
        </h2>
        
        <form onSubmit={handleTrack} style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
          <input 
            type="text" 
            value={ticketId}
            onChange={(e) => setTicketId(e.target.value)}
            className="input-field" 
            placeholder="Enter your Ticket ID (e.g. 5F3A8B99)"
            style={{ textTransform: 'uppercase', flex: 1 }}
          />
          <button type="submit" className="btn btn-primary" disabled={isLoading}>
            {isLoading ? 'Searching...' : 'Track'}
          </button>
        </form>

        {error && (
          <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)', borderRadius: '8px', color: '#fca5a5' }}>
            {error}
          </div>
        )}

        {ticket && (
          <div className="subtle-glass animate-fade-in" style={{ padding: '1.5rem', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Ticket ID: {ticket.id}</p>
                <h3 style={{ marginTop: '0.25rem' }}>{ticket.hostel_name} - Floor {ticket.floor_name}</h3>
                <p style={{ color: 'var(--primary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                  {ticket.problem_type} • Reporter: {ticket.student_email || ticket.student_phone}
                </p>
              </div>
              <span className={`badge ${getStatusBadgeClass(ticket.status)}`}>{ticket.status}</span>
            </div>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Description</p>
              <p>{ticket.description}</p>
            </div>

            {ticket.image_url && (
              <div style={{ marginTop: '1rem' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Attached Image</p>
                <img 
                  src={ticket.image_url} 
                  alt="Issue" 
                  style={{ width: '100%', borderRadius: '8px', maxHeight: '200px', objectFit: 'cover' }} 
                />
              </div>
            )}
            
            <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--surface-border)', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Reported on: {new Date(ticket.created_at).toLocaleString()}
            </div>
          </div>
        )}
      </div>

      {user?.role === 'student' && history.length > 0 && (
        <div className="glass-panel" style={{ padding: '2rem', marginTop: '2rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}><History /> Your Recent Tickets</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {history.map(h => (
              <div key={h.id} className="subtle-glass" style={{ padding: '1rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontWeight: '500' }}>{h.problem_type} @ {h.hostel_name} Floor {h.floor_name}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {h.id} • {new Date(h.created_at).toLocaleDateString()}</p>
                </div>
                <button onClick={() => performTrack(h.id)} className="btn btn-outline" style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}>View Details</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
