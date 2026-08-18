import { useState, useEffect } from 'react';
import { Routes, Route, Link, useParams, useLocation, useNavigate } from 'react-router-dom';
import { BookOpen, FileText, MessageSquare, Layers, HelpCircle, ArrowLeft, Loader2 } from 'lucide-react';
import api from '../api';

import Documents from '../components/Documents';
import Chat from '../components/Chat';
import Flashcards from '../components/Flashcards';
import Quizzes from '../components/Quizzes';

export default function SubjectView() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [subject, setSubject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubject = async () => {
      try {
        const { data } = await api.get(`/subjects/${id}`);
        setSubject(data);
      } catch (err) {
        console.error(err);
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchSubject();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-fade-in text-blue" size={32} style={{ animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  if (!subject) return null;

  const navItems = [
    { name: 'Documents', path: '', icon: FileText },
    { name: 'Chat', path: '/chat', icon: MessageSquare },
    { name: 'Flashcards', path: '/flashcards', icon: Layers },
    { name: 'Quizzes', path: '/quizzes', icon: HelpCircle },
  ];

  return (
    <div className="app-container animate-fade-in">
      {/* Sidebar */}
      <aside className="glass-panel" style={{ width: '280px', borderRadius: '0', borderLeft: 'none', borderTop: 'none', borderBottom: 'none', display: 'flex', flexDirection: 'column' }}>
        <div style={{ paddingBottom: '2rem' }}>
          <Link to="/dashboard" className="flex items-center gap-2 text-secondary hover-scale" style={{ fontSize: '0.875rem', marginBottom: '2rem' }}>
            <ArrowLeft size={16} />
            Back to Dashboard
          </Link>
          
          <div className="flex items-center gap-3">
            <div style={{ background: 'rgba(59, 130, 246, 0.2)', padding: '0.5rem', borderRadius: '0.5rem', color: 'var(--accent-primary)' }}>
              <BookOpen size={20} />
            </div>
            <h2 className="font-bold text-lg" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={subject.name}>{subject.name}</h2>
          </div>
        </div>

        <nav className="flex-col gap-2 flex flex-1">
          {navItems.map((item) => {
            const fullPath = `/subject/${id}${item.path}`;
            const isActive = location.pathname === fullPath || (item.path === '' && location.pathname === `/subject/${id}`);
            
            return (
              <Link
                key={item.name}
                to={fullPath}
                className={`flex items-center gap-3 p-4 rounded-xl transition-all ${
                  isActive 
                    ? 'font-medium' 
                    : 'text-secondary'
                }`}
                style={{
                  background: isActive ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                  color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)'
                }}
              >
                <item.icon size={20} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="main-content" style={{ maxWidth: '1000px', display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        <div style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
          <Routes>
            <Route path="/" element={<Documents subjectId={id} />} />
            <Route path="/chat" element={<Chat subjectId={id} />} />
            <Route path="/flashcards" element={<Flashcards subjectId={id} />} />
            <Route path="/quizzes" element={<Quizzes subjectId={id} />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
