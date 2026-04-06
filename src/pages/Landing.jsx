import { Link } from 'react-router-dom';
import { Camera, Search, ShieldCheck } from 'lucide-react';

export default function Landing() {
  return (
    <div className="landing-page animate-fade-in">
      <div style={{ textAlign: 'center', marginTop: '4rem', marginBottom: '4rem' }}>
        <h1 style={{ fontSize: '3.5rem', marginBottom: '1rem', background: 'linear-gradient(to right, var(--primary), var(--secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Smart Maintenance. <br />Simplified.
        </h1>
        <p style={{ fontSize: '1.25rem', color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto 2rem' }}>
          Scan a QR code on any equipment to instantly report an issue. Track the status in real-time.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <Link to="/report" className="btn btn-primary" style={{ padding: '1rem 2rem', fontSize: '1.125rem' }}>
            <Camera size={24} />
            Report Issue
          </Link>
          <Link to="/track" className="btn glass-panel" style={{ padding: '1rem 2rem', fontSize: '1.125rem' }}>
            <Search size={24} />
            Track Ticket
          </Link>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginTop: '4rem' }}>
        <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
          <div style={{ background: 'rgba(99, 102, 241, 0.2)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <Camera size={32} color="var(--primary)" />
          </div>
          <h3>1. Scan & Report</h3>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Snap a photo and describe the issue right from your phone without any apps.</p>
        </div>
        <div className="glass-panel delay-100" style={{ padding: '2rem', textAlign: 'center' }}>
          <div style={{ background: 'rgba(236, 72, 153, 0.2)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <ShieldCheck size={32} color="var(--secondary)" />
          </div>
          <h3>2. Instant Ticket</h3>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Get a unique tracking ID instantly. No need to call maintenance or send emails.</p>
        </div>
        <div className="glass-panel delay-200" style={{ padding: '2rem', textAlign: 'center' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.2)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <Search size={32} color="var(--success)" />
          </div>
          <h3>3. Track Progress</h3>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Check your ticket status anytime to see if the issue is pending, in-progress, or resolved.</p>
        </div>
      </div>
    </div>
  );
}
