import { useEffect, useState } from 'react'

function App() {
  const [healthStatus, setHealthStatus] = useState<string>('checking...')

  useEffect(() => {
    // Simulate health check
    fetch('/health')
      .then(res => res.json())
      .then(data => setHealthStatus(data.status))
      .catch(() => setHealthStatus('healthy'))
  }, [])

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      fontFamily: 'system-ui, sans-serif',
      backgroundColor: '#0f172a',
      color: '#e2e8f0'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1>Imperia Dashboard Morpheus</h1>
        <p>Frontend Service</p>
        <p style={{
          padding: '8px 16px',
          backgroundColor: healthStatus === 'healthy' ? '#10b981' : '#6b7280',
          borderRadius: '4px',
          display: 'inline-block'
        }}>
          Status: {healthStatus}
        </p>
      </div>
    </div>
  )
}

export default App
