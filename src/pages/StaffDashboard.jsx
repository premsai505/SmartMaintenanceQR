import { useState, useEffect } from 'react';
import axios from 'axios';
import { ClipboardList, ImagePlus } from 'lucide-react';

export default function StaffDashboard() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTickets = async () => {
    try {
      const res = await axios.get('/api/tickets');
      setTickets(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleUpdate = async (ticketId, currentStatus, newStatus, imageFile) => {
    try {
      const formData = new FormData();
      formData.append('status', newStatus);
      if (imageFile && newStatus === 'Completed') {
        formData.append('completion_image', imageFile);
      } else if (newStatus === 'Completed' && !imageFile) {
        alert("Please select a completion image proof first.");
        return;
      }
      
      await axios.put(`/api/tickets/${ticketId}/status`, formData);
      fetchTickets();
    } catch(err) {
      alert('Failed to update status');
    }
  };

  if (loading) return <div style={{ textAlign: 'center', marginTop: '4rem' }}>Loading workload...</div>;

  return (
    <div className="animate-fade-in" style={{ margin: '2rem auto' }}>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
        <ClipboardList /> My Assigned Tasks
      </h2>

      {tickets.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>You have no assigned tickets right now.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {tickets.map(t => (
            <div key={t.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>ID: {t.id}</span>
                <span className={`badge ${t.status === 'Completed' ? 'badge-resolved' : t.status === 'In Progress' ? 'badge-in-progress' : 'badge-pending'}`}>{t.status}</span>
              </div>
              
              <h3 style={{ marginBottom: '0.25rem' }}>{t.hostel_name} - Floor {t.floor_name}</h3>
              <p style={{ color: 'var(--primary)', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                {t.problem_type} • Student: {t.student_phone}
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1rem', flex: 1 }}>{t.description}</p>
              
              {t.image_url && (
                <div style={{ marginBottom: '1rem', borderRadius: '8px', overflow: 'hidden', height: '150px' }}>
                  <img src={t.image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Issue" />
                </div>
              )}

              <div style={{ marginTop: 'auto', borderTop: '1px solid var(--surface-border)', paddingTop: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Action</label>
                
                {t.status === 'Pending' && (
                  <button onClick={() => handleUpdate(t.id, t.status, 'In Progress', null)} className="btn btn-outline" style={{width: '100%'}}>
                    Mark In Progress (Worker Assigned)
                  </button>
                )}
                
                {t.status === 'In Progress' && (
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input type="file" id={`file-${t.id}`} style={{ display: 'none' }} accept="image/*" onChange={(e) => {
                      if(e.target.files[0]) handleUpdate(t.id, t.status, 'Completed', e.target.files[0]);
                    }} />
                    <label htmlFor={`file-${t.id}`} className="btn btn-primary" style={{ flex: 1, textAlign: 'center', cursor: 'pointer' }}>
                      <ImagePlus size={16} /> Upload Proof & Complete
                    </label>
                  </div>
                )}

                {t.status === 'Completed' && (
                  <div style={{ color: 'var(--success)', textAlign: 'center', fontWeight: '500' }}>Task Finished</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
