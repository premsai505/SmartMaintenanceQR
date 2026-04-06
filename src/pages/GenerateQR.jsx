import { QrCode, Download } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import axios from 'axios';

export default function GenerateQR() {
  const { user, loading } = useAuth();
  
  const [hostel, setHostel] = useState('');
  const [floor, setFloor] = useState('');

  if (loading) return null;
  // Admin only
  if (!user || user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  // Construct URL. Fallback to just origin if hostel isn't provided
  const queryParts = [];
  if (hostel) queryParts.push(`hostel=${encodeURIComponent(hostel)}`);
  if (floor) queryParts.push(`floor=${encodeURIComponent(floor)}`);
  
  let targetUrl = window.location.origin + '/report';
  if (queryParts.length > 0) {
    targetUrl += '?' + queryParts.join('&');
  }

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(targetUrl)}`;

  const handleDownload = async () => {
    try {
      const response = await fetch(qrImageUrl);
      const blob = await response.blob();
      const domUrl = URL.createObjectURL(blob);
      
      const downloadLink = document.createElement('a');
      downloadLink.download = `QR_${hostel}_${floor || 'Main'}.png`;
      downloadLink.href = domUrl;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      // Save to Database
      try {
        const token = localStorage.getItem('token'); // assuming token is in localStorage, or we get it from auth context
        await axios.post('http://localhost:3000/api/admin/qrs', {
          hostel_name: hostel,
          floor_name: floor,
          qr_url: qrImageUrl
        }, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } catch (dbErr) {
        console.error("Failed to save QR to DB", dbErr);
      }
    } catch (err) {
      console.error("Failed to download QR code", err);
      // Fallback
      window.open(qrImageUrl, '_blank');
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center' }}>
      <div className="glass-panel" style={{ padding: '3rem 2rem' }}>
        <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          <QrCode /> Location QR Code Generator
        </h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.875rem' }}>
          Generate a QR code bound to a specific location. When users scan this, the app will auto-fill and lock the hostel and floor details.
        </p>

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
          <input className="input-field" type="text" placeholder="Hostel Name (e.g. Block A)" value={hostel} onChange={e => setHostel(e.target.value)} />
          <input className="input-field" type="text" placeholder="Floor Name (Optional)" value={floor} onChange={e => setFloor(e.target.value)} />
        </div>

        {hostel ? (
          <>
            <div style={{ background: 'white', display: 'inline-block', padding: '1.5rem', borderRadius: '16px', marginBottom: '2rem', boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}>
              <img src={qrImageUrl} alt="QR Code" width="256" height="256" style={{ display: 'block' }} />
            </div>

            <div>
              <button onClick={handleDownload} className="btn btn-primary" style={{ width: '100%', maxWidth: '250px' }}>
                <Download size={18} /> Download PNG
              </button>
            </div>
          </>
        ) : (
          <p style={{ color: 'var(--warning)', padding: '2rem', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '8px' }}>
            Please enter a Hostel Name to generate its QR Code.
          </p>
        )}
      </div>
    </div>
  );
}
