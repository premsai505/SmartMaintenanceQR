import { useState } from 'react';
import { useSearchParams, Link, Navigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Camera, Send, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function ReportIssue() {
  const { user, loading } = useAuth();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  
  const initialHostel = searchParams.get('hostel') || '';
  const initialFloor = searchParams.get('floor') || '';

  const [hostelName, setHostelName] = useState(initialHostel);
  const [floorName, setFloorName] = useState(initialFloor);
  const [description, setDescription] = useState('');
  const [studentPhone, setStudentPhone] = useState('');
  const [problemType, setProblemType] = useState('Hardware');
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ticket, setTicket] = useState(null);

  if (loading) return null;
  // If no user, redirect to login but remember where they tried to go
  if (!user) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description || !image || !studentPhone || !hostelName || !floorName) {
      alert("Please fill in all required fields and provide an image proof.");
      return;
    }
    setIsSubmitting(true);
    
    const formData = new FormData();
    formData.append('hostel_name', hostelName);
    formData.append('floor_name', floorName);
    formData.append('student_phone', studentPhone);
    formData.append('problem_type', problemType);
    formData.append('description', description);
    formData.append('image', image);

    try {
      const response = await axios.post('/api/tickets', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setTicket(response.data);
    } catch (err) {
      console.error(err);
      alert('Failed to submit ticket. Ensure the backend server is running.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (ticket) {
    return (
      <div className="animate-fade-in" style={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center' }}>
        <div className="glass-panel" style={{ padding: '3rem 2rem' }}>
          <CheckCircle size={64} color="var(--success)" style={{ margin: '0 auto 1.5rem' }} />
          <h2 style={{ marginBottom: '1rem' }}>Ticket Submitted!</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
            Your issue for <strong>{hostelName} - {floorName}</strong> has been received and routed.
          </p>
          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem' }}>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Your Tracking ID</p>
            <h1 style={{ letterSpacing: '2px', color: 'var(--primary)', fontFamily: 'monospace' }}>{ticket.id}</h1>
          </div>
          <p style={{ marginBottom: '2rem', fontSize: '0.875rem' }}>Save this ID or use the button below to track the status later.</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to={`/track?id=${ticket.id}`} className="btn btn-primary" style={{ flex: 1, minWidth: '200px' }}>Open Tracking Page</Link>
            <Link to="/" className="btn btn-outline">Back Home</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in responsive-margin container" style={{ maxWidth: '600px' }}>
      <div className="glass-panel responsive-padding">
        <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Camera /> Report an Issue
        </h2>
        
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="input-group" style={{ flex: 1 }}>
              <label className="input-label">Hostel Name</label>
              <input 
                type="text" 
                value={hostelName}
                onChange={(e) => setHostelName(e.target.value)}
                className="input-field" 
                style={initialHostel ? { background: 'rgba(255,255,255,0.02)', color: 'var(--text-muted)' } : {}}
                placeholder="e.g. Mega Hostel"
                required
                readOnly={!!initialHostel}
              />
            </div>

            <div className="input-group" style={{ flex: 1 }}>
              <label className="input-label">Floor</label>
              <input 
                type="text" 
                value={floorName}
                onChange={(e) => setFloorName(e.target.value)}
                className="input-field" 
                style={initialFloor ? { background: 'rgba(255,255,255,0.02)', color: 'var(--text-muted)' } : {}}
                placeholder="e.g. Ground Floor"
                required
                readOnly={!!initialFloor}
              />
            </div>
          </div>
          
          <div className="input-group">
            <label className="input-label">Your Contact Phone Number</label>
            <input 
              type="text" 
              value={studentPhone}
              onChange={(e) => setStudentPhone(e.target.value)}
              className="input-field" 
              placeholder="e.g. +1 555 123 4567"
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label">Problem Type</label>
            <select 
              value={problemType}
              onChange={(e) => setProblemType(e.target.value)}
              className="input-field"
              required
            >
              <option value="Hardware">Hardware / Equipment</option>
              <option value="Software">Software / IT</option>
              <option value="Plumbing">Plumbing / Water</option>
              <option value="Electrical">Electrical</option>
              <option value="Furniture">Furniture</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="input-group">
            <label className="input-label">Issue Photo</label>
            <input 
              type="file" 
              accept="image/*"
              onChange={handleImageChange}
              className="input-field" 
              required
            />
          </div>

          {preview && (
            <div style={{ marginBottom: '1.5rem', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--surface-border)' }}>
              <img src={preview} alt="Preview" style={{ width: '100%', display: 'block', maxHeight: '300px', objectFit: 'cover' }} />
            </div>
          )}

          <div className="input-group">
            <label className="input-label">Detailed Description</label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-field" 
              rows="4" 
              placeholder="Describe the issue in detail..."
              required
            ></textarea>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : <><Send size={18} /> Submit Issue</>}
          </button>
        </form>
      </div>
    </div>
  );
}
