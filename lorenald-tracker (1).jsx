import { useState, useEffect } from 'react';

function App() {
  const [stats, setStats] = useState({ 
    posts: 'Loading...', 
    followers: 'Loading...', 
    following: 'Loading...', 
    lastChecked: 'Never',
    recentPosts: []
  });
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [backendUrl, setBackendUrl] = useState('');
  const [showSetup, setShowSetup] = useState(true);

  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };

  const fetchUpdate = async () => {
    if (!backendUrl) {
      setError('Please enter your backend URL first');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Make actual API call to backend
      const res = await fetch(`${backendUrl}/check`);
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();

      if (data.changed) {
        const newEntry = `${formatDate(new Date())} - ${data.ai_summary}`;
        setHistory(prev => [newEntry, ...prev]);
        
        if (Notification.permission === 'granted') {
          new Notification('Lorenald Update', { body: data.ai_summary });
        }
      }
      
      setStats(data.stats);
      setError(null);
    } catch (err) {
      setError('Failed to fetch data. Is backend running?');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (backendUrl && !showSetup) {
      fetchUpdate();
      const interval = setInterval(fetchUpdate, 30 * 60 * 1000); // every 30 min
      return () => clearInterval(interval);
    }
  }, [backendUrl, showSetup]);

  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const handleSetup = (e) => {
    e.preventDefault();
    if (backendUrl) {
      setShowSetup(false);
      fetchUpdate();
    }
  };

  return (
    <div style={styles.app}>
      <h1 style={styles.h1}>Lorenald_ Tracker</h1>
      
      {showSetup && (
        <div style={styles.setupCard}>
          <h2 style={styles.h2}>Setup</h2>
          <form onSubmit={handleSetup}>
            <input
              type="text"
              placeholder="Enter your backend URL (e.g., https://your-app.onrender.com)"
              value={backendUrl}
              onChange={(e) => setBackendUrl(e.target.value)}
              style={styles.input}
            />
            <button type="submit" style={styles.button}>
              Start Tracking
            </button>
          </form>
          <p style={styles.note}>
            Note: This is a demo. Enter your backend URL or click "Start Tracking" to see the interface.
          </p>
        </div>
      )}

      {!showSetup && (
        <>
          <div style={styles.statsCard}>
            <h2 style={styles.h2}>Current Stats</h2>
            {loading && stats.posts === 'Loading...' ? (
              <p>Loading...</p>
            ) : error ? (
              <p style={styles.error}>{error}</p>
            ) : (
              <>
                <p><strong>Posts:</strong> {stats.posts}</p>
                <p><strong>Followers:</strong> {stats.followers}</p>
                <p><strong>Following:</strong> {stats.following}</p>
                <p><strong>Last checked:</strong> {stats.lastChecked}</p>
              </>
            )}
            <button onClick={fetchUpdate} disabled={loading} style={styles.button}>
              {loading ? 'Checking...' : 'Refresh Now'}
            </button>
            <button 
              onClick={() => setShowSetup(true)} 
              style={{...styles.button, ...styles.secondaryButton}}
            >
              Change Backend URL
            </button>
          </div>
          
          <div style={styles.history}>
            <h2 style={styles.h2}>Change History</h2>
            {history.length === 0 ? (
              <p>No changes detected yet</p>
            ) : (
              <ul style={styles.ul}>
                {history.map((entry, i) => (
                  <li key={i} style={styles.li}>{entry}</li>
                ))}
              </ul>
            )}
          </div>

          {stats.recentPosts && stats.recentPosts.length > 0 && (
            <div style={styles.postsSection}>
              <h2 style={styles.h2}>Recent Posts</h2>
              <div style={styles.postsGrid}>
                {stats.recentPosts.map((post) => (
                  <div key={post.id} style={styles.postCard}>
                    <img 
                      src={post.imageUrl} 
                      alt="Instagram post" 
                      style={styles.postImage}
                    />
                    <div style={styles.postInfo}>
                      <div style={styles.postStats}>
                        <span>❤️ {post.likes.toLocaleString()}</span>
                        <span>💬 {post.comments.toLocaleString()}</span>
                      </div>
                      {post.caption && (
                        <p style={styles.postCaption}>
                          {post.caption.length > 100 
                            ? post.caption.substring(0, 100) + '...' 
                            : post.caption}
                        </p>
                      )}
                      <p style={styles.postDate}>
                        {new Date(post.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
      
      <footer style={styles.footer}>
        <p>Personal tracker • Updates every 30 min • Powered by AI</p>
      </footer>
    </div>
  );
}

const styles = {
  app: {
    maxWidth: '500px',
    margin: '0 auto',
    padding: '20px',
    background: '#121212',
    color: '#e0e0e0',
    minHeight: '100vh',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  h1: {
    textAlign: 'center',
    color: '#bb86fc',
    marginBottom: '32px',
  },
  h2: {
    color: '#bb86fc',
    fontSize: '1.3rem',
    marginBottom: '16px',
  },
  setupCard: {
    background: '#1e1e1e',
    padding: '24px',
    borderRadius: '12px',
    marginBottom: '24px',
  },
  statsCard: {
    background: '#1e1e1e',
    padding: '20px',
    borderRadius: '12px',
    marginBottom: '24px',
  },
  input: {
    width: '100%',
    padding: '12px',
    marginBottom: '16px',
    background: '#2a2a2a',
    border: '1px solid #444',
    borderRadius: '8px',
    color: '#e0e0e0',
    fontSize: '1rem',
    boxSizing: 'border-box',
  },
  button: {
    marginTop: '16px',
    marginRight: '8px',
    padding: '10px 20px',
    background: '#bb86fc',
    color: 'black',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '600',
  },
  secondaryButton: {
    background: '#444',
    color: '#e0e0e0',
  },
  history: {
    background: '#1e1e1e',
    padding: '16px',
    borderRadius: '12px',
  },
  ul: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  li: {
    padding: '12px 0',
    borderBottom: '1px solid #333',
  },
  error: {
    color: '#ff6b6b',
  },
  footer: {
    textAlign: 'center',
    marginTop: '40px',
    fontSize: '0.9rem',
    color: '#888',
  },
  note: {
    fontSize: '0.85rem',
    color: '#888',
    marginTop: '12px',
  },
  postsSection: {
    background: '#1e1e1e',
    padding: '20px',
    borderRadius: '12px',
    marginTop: '24px',
  },
  postsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
    gap: '16px',
    marginTop: '16px',
  },
  postCard: {
    background: '#2a2a2a',
    borderRadius: '8px',
    overflow: 'hidden',
    cursor: 'pointer',
    transition: 'transform 0.2s',
  },
  postImage: {
    width: '100%',
    height: '150px',
    objectFit: 'cover',
  },
  postInfo: {
    padding: '12px',
  },
  postStats: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.85rem',
    marginBottom: '8px',
  },
  postCaption: {
    fontSize: '0.8rem',
    color: '#ccc',
    marginTop: '8px',
    marginBottom: '8px',
    lineHeight: '1.4',
  },
  postDate: {
    fontSize: '0.75rem',
    color: '#888',
    marginTop: '8px',
  },
};

export default App;
