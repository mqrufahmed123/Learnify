import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { Book, Plus, LogOut, Loader2, BookOpen } from 'lucide-react';
import api from '../api';

export default function Dashboard({ setAuth }) {
  const [subjects, setSubjects] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newSubject, setNewSubject] = useState({ name: '', description: '' });
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [userRes, subjectsRes] = await Promise.all([
        api.get('/auth/me'),
        api.get('/subjects')
      ]);
      setUser(userRes.data);
      setSubjects(subjectsRes.data);
    } catch (err) {
      if (err.response?.status === 401) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setAuth(false);
    navigate('/login');
  };

  const handleCreateSubject = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const { data } = await api.post('/subjects', newSubject);
      setSubjects([...subjects, data]);
      setShowModal(false);
      setNewSubject({ name: '', description: '' });
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-fade-in text-blue" size={32} style={{ animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  return (
    <div className="app-container">
      <main className="main-content animate-fade-in">
        
        <header className="glass-header rounded-2xl mb-8">
          <div className="flex items-center gap-3">
            <div style={{ background: 'var(--accent-gradient)', padding: '0.5rem', borderRadius: '0.75rem' }}>
              <BookOpen size={24} color="white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">AI Learning Assistant</h1>
              <p className="text-xs text-secondary">Welcome back, {user?.name}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-secondary" style={{ background: 'none' }}>
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </header>

        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold mb-2">Your Subjects</h2>
            <p className="text-secondary">Select a subject to start studying or create a new one.</p>
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="btn btn-primary"
            style={{ width: 'auto' }}
          >
            <Plus size={20} />
            <span>New Subject</span>
          </button>
        </div>

        {subjects.length === 0 ? (
          <div className="glass-panel text-center flex flex-col items-center justify-center p-8" style={{ border: '2px dashed var(--border-hover)' }}>
            <Book size={64} className="text-muted mb-4" />
            <h3 className="text-xl font-semibold mb-2">No subjects yet</h3>
            <p className="text-secondary mb-6 max-w-md mx-auto">Create your first subject to start uploading documents, generating flashcards, and chatting with your AI assistant.</p>
            <button onClick={() => setShowModal(true)} className="btn btn-primary" style={{ width: 'auto' }}>Create Subject</button>
          </div>
        ) : (
          <div className="grid grid-cols-auto gap-6">
            {subjects.map((subject) => (
              <Link 
                key={subject._id} 
                to={`/subject/${subject._id}`}
                className="glass-panel transition-all hover-scale"
                style={{ display: 'block' }}
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold text-primary">{subject.name}</h3>
                  <div style={{ padding: '0.5rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '0.5rem', color: 'var(--accent-primary)' }}>
                    <Book size={20} />
                  </div>
                </div>
                <p className="text-secondary text-sm mb-6" style={{ minHeight: '40px' }}>
                  {subject.description || 'No description provided.'}
                </p>
                
                <div className="flex justify-between items-center text-xs text-muted" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                  <span>Created {new Date(subject.createdAt).toLocaleDateString()}</span>
                  <span className="text-blue">Open Workspace →</span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Create Subject Modal */}
        {showModal && createPortal(
          <div className="modal-backdrop animate-fade-in">
            <div className="glass-panel max-w-md w-full">
              <h2 className="text-2xl font-bold mb-6">Create New Subject</h2>
              <form onSubmit={handleCreateSubject}>
                <div className="form-group">
                  <label>Subject Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Advanced Machine Learning"
                    value={newSubject.name}
                    onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Description (Optional)</label>
                  <textarea
                    placeholder="What is this subject about?"
                    value={newSubject.description}
                    onChange={(e) => setNewSubject({ ...newSubject, description: e.target.value })}
                    style={{ minHeight: '100px' }}
                  ></textarea>
                </div>
                <div className="flex gap-4 mt-8">
                  <button 
                    type="button" 
                    onClick={() => setShowModal(false)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={creating}
                    className="btn btn-primary"
                  >
                    {creating ? 'Creating...' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
      </main>
    </div>
  );
}
