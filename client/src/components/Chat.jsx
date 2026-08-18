import { useState, useEffect, useRef } from 'react';
import { Send, User, Bot, Loader2, Copy, Check, Code } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import api from '../api';

function CodeBlock({ language, value }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      margin: '0.85rem 0',
      borderRadius: '0.75rem',
      overflow: 'hidden',
      border: '1px solid rgba(255, 255, 255, 0.12)',
      background: '#0d1117',
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)'
    }}>
      {/* Code Header Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.45rem 0.85rem',
        background: 'rgba(22, 27, 34, 0.95)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        fontSize: '0.75rem',
        color: '#8b949e'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}>
          <Code size={14} style={{ color: '#58a6ff' }} />
          <span style={{ color: '#c9d1d9', textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.05em' }}>
            {language || 'code'}
          </span>
        </div>
        <button
          onClick={handleCopy}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            background: copied ? 'rgba(46, 160, 67, 0.25)' : 'rgba(255, 255, 255, 0.06)',
            border: '1px solid',
            borderColor: copied ? '#2ea043' : 'rgba(255, 255, 255, 0.12)',
            color: copied ? '#3fb950' : '#c9d1d9',
            padding: '0.25rem 0.6rem',
            borderRadius: '0.35rem',
            fontSize: '0.725rem',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          {copied ? (
            <>
              <Check size={13} /> Copied!
            </>
          ) : (
            <>
              <Copy size={13} /> Copy code
            </>
          )}
        </button>
      </div>

      {/* Syntax Highlighting */}
      <SyntaxHighlighter
        language={language || 'text'}
        style={vscDarkPlus}
        PreTag="div"
        codeTagProps={{
          style: {
            background: 'none',
            border: 'none',
            padding: 0,
            boxShadow: 'none',
            fontFamily: 'Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace'
          }
        }}
        customStyle={{
          margin: 0,
          padding: '1rem',
          fontSize: '0.85rem',
          lineHeight: '1.6',
          background: '#0d1117',
          borderRadius: 0,
          border: 'none'
        }}
      >
        {value}
      </SyntaxHighlighter>
    </div>
  );
}

export default function Chat({ subjectId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchHistory();
  }, [subjectId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchHistory = async () => {
    try {
      const { data } = await api.get(`/chat/${subjectId}`);
      setMessages(data);
    } catch (err) {
      console.error('Failed to fetch chat history:', err);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || sending) return;

    const userMessage = input;
    setInput('');
    setSending(true);

    const tempMessage = { _id: Date.now().toString(), role: 'user', content: userMessage };
    setMessages(prev => [...prev, tempMessage]);

    try {
      const { data } = await api.post(`/chat/${subjectId}`, { question: userMessage });
      setMessages(prev => [...prev, data.assistantMessage || data]);
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="animate-fade-in text-blue" size={32} style={{ animation: 'spin 1s linear infinite' }} /></div>;
  }

  return (
    <div className="flex flex-col mx-auto animate-fade-in relative z-10" style={{ height: 'calc(100vh - 120px)', maxWidth: '850px' }}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">AI Tutor Chat</h2>
        <p className="text-secondary">Ask questions about your uploaded documents.</p>
      </div>

      <div className="flex-1 overflow-y-auto mb-6 flex flex-col gap-6" style={{ paddingRight: '0.5rem' }}>
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-muted">
            <Bot size={64} style={{ opacity: 0.5, marginBottom: '1rem' }} />
            <p>No messages yet. Ask me a question about your study materials!</p>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div 
              key={msg._id || index} 
              className="flex gap-4 items-start"
              style={{ flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}
            >
              <div 
                className="flex items-center justify-center"
                style={{ 
                  flexShrink: 0, 
                  height: '2.5rem', 
                  width: '2.5rem', 
                  borderRadius: '50%',
                  background: msg.role === 'user' ? 'var(--accent-primary)' : 'var(--accent-secondary)'
                }}
              >
                {msg.role === 'user' ? <User size={20} color="white" /> : <Bot size={20} color="white" />}
              </div>
              
              <div 
                className={msg.role === 'user' ? '' : 'glass-panel'}
                style={{
                  maxWidth: '85%',
                  padding: '1rem 1.25rem',
                  borderRadius: '1.25rem',
                  borderTopRightRadius: msg.role === 'user' ? '0.25rem' : '1.25rem',
                  borderTopLeftRadius: msg.role !== 'user' ? '0.25rem' : '1.25rem',
                  background: msg.role === 'user' ? 'rgba(59, 130, 246, 0.2)' : 'var(--bg-card)',
                  border: msg.role === 'user' ? '1px solid rgba(59, 130, 246, 0.3)' : 'var(--glass-border)',
                  color: 'white',
                  lineHeight: '1.6'
                }}
              >
                {msg.role === 'user' ? (
                  <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{msg.content}</p>
                ) : (
                  <div className="markdown-content">
                    <ReactMarkdown
                      components={{
                        code({ node, inline, className, children, ...props }) {
                          const match = /language-(\w+)/.exec(className || '');
                          const codeString = String(children).replace(/\n$/, '');

                          if (!inline && (match || codeString.includes('\n'))) {
                            return (
                              <CodeBlock
                                language={match ? match[1] : ''}
                                value={codeString}
                              />
                            );
                          }

                          return (
                            <code className={className} {...props}>
                              {children}
                            </code>
                          );
                        }
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        
        {sending && (
          <div className="flex gap-4 items-start">
            <div 
              className="flex items-center justify-center"
              style={{ flexShrink: 0, height: '2.5rem', width: '2.5rem', borderRadius: '50%', background: 'var(--accent-secondary)' }}
            >
              <Bot size={20} color="white" />
            </div>
            <div className="glass-panel flex items-center gap-2" style={{ borderRadius: '1.25rem', borderTopLeftRadius: '0.25rem', padding: '1rem' }}>
              <div style={{ width: '8px', height: '8px', background: 'var(--accent-secondary)', borderRadius: '50%', animation: 'bounce 1s infinite' }}></div>
              <div style={{ width: '8px', height: '8px', background: 'var(--accent-secondary)', borderRadius: '50%', animation: 'bounce 1s infinite 0.2s' }}></div>
              <div style={{ width: '8px', height: '8px', background: 'var(--accent-secondary)', borderRadius: '50%', animation: 'bounce 1s infinite 0.4s' }}></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} style={{ position: 'relative', marginTop: 'auto' }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question..."
          className="glass-panel"
          style={{ width: '100%', paddingLeft: '1.5rem', paddingRight: '4rem', paddingBottom: '1rem', paddingTop: '1rem', outline: 'none' }}
          disabled={sending}
        />
        <button
          type="submit"
          disabled={!input.trim() || sending}
          className="btn-primary"
          style={{ 
            position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)',
            padding: '0.5rem', borderRadius: '0.75rem', border: 'none'
          }}
        >
          <Send size={20} />
        </button>
      </form>
      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .markdown-content p {
          margin-bottom: 0.75rem;
          line-height: 1.6;
        }
        .markdown-content p:last-child {
          margin-bottom: 0;
        }
        .markdown-content ul, .markdown-content ol {
          margin-top: 0.5rem;
          margin-bottom: 0.75rem;
          padding-left: 1.5rem;
        }
        .markdown-content ul {
          list-style-type: disc;
        }
        .markdown-content ol {
          list-style-type: decimal;
        }
        .markdown-content li {
          margin-bottom: 0.4rem;
          line-height: 1.5;
        }
        .markdown-content strong {
          font-weight: 700;
          color: #ffffff;
        }
        .markdown-content em {
          font-style: italic;
          color: #cbd5e1;
        }
        .markdown-content :not(pre) > code {
          background: rgba(0, 0, 0, 0.35);
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 0.15rem 0.4rem;
          border-radius: 0.35rem;
          font-family: monospace;
          font-size: 0.85em;
          color: #60a5fa;
        }
        .markdown-content h1, .markdown-content h2, .markdown-content h3, .markdown-content h4 {
          font-weight: 700;
          color: #ffffff;
          margin-top: 1rem;
          margin-bottom: 0.5rem;
        }
      `}</style>
    </div>
  );
}
