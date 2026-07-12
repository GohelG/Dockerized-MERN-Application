import React, { useState, useEffect } from 'react';

function App() {
  const [helloMessage, setHelloMessage] = useState('Loading hello...');
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    // Fetches go to the current window host dynamically to account for LoadBalancer IPs
    const host = window.location.hostname;
    
    fetch(`http://${host}:5000/api/hello`)
      .then(res => res.json())
      .then(data => setHelloMessage(data.message))
      .catch(() => setHelloMessage('Failed to connect to Gateway'));

    fetch(`http://${host}:5000/api/profile`)
      .then(res => res.json())
      .then(data => setProfile(data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div style={{ padding: '40px', fontFamily: 'Segoe UI, sans-serif', backgroundColor: '#f5f7fb', minHeight: '100vh' }}>
      <h1 style={{ color: '#0078d4' }}>Azure Kubernetes Service Dashboard</h1>
      <div style={{ background: '#fff', border: '1px solid #e0e0e0', padding: '20px', margin: '20px 0', borderRadius: '4px' }}>
        <h3>Hello Service:</h3>
        <p>{helloMessage}</p>
      </div>
      <div style={{ background: '#fff', border: '1px solid #e0e0e0', padding: '20px', margin: '20px 0', borderRadius: '4px' }}>
        <h3>Profile Service:</h3>
        {profile ? (
          <div>
            <p><strong>Name:</strong> {profile.name}</p>
            <p><strong>Role:</strong> {profile.role}</p>
          </div>
        ) : <p>Loading Profile...</p>}
      </div>
    </div>
  );
}

export default App;
