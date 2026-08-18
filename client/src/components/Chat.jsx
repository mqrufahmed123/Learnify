import { useState, useEffect, useRef } from 'react';
import { Send, User, Bot, Loader2, Copy, Check, Code, Paperclip, X, FileText } from 'lucide-react';
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

  // File Attachment States
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const fileInputRef = useRef(null);
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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedFile(file);
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => setFilePreview(event.target.result);
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const formatAttachmentUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http') || url.startsWith('data:') || url.startsWith('blob:')) {
      return url;
    }
    const backendBase = 'http://localhost:5000';
    return `${backendBase}${url}`;
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if ((!input.trim() && !selectedFile) || sending) return;

    const userQuestion = input;
    const currentFile = selectedFile;
    const currentPreview = filePreview;

    setInput('');
    clearFile();
    setSending(true);

    // Temp message for immediate UI response
    const tempAttachments = [];
    if (currentFile) {
      tempAttachments.push({
        filename: currentFile.name,
        fileType: currentFile.type.startsWith('image/') ? 'image' : 'document',
        url: currentPreview,
        mimeType: currentFile.type
      });
    }

    const tempMessage = {
      _id: Date.now().toString(),
      role: 'user',
      content: userQuestion,
      attachments: tempAttachments
    };
    setMessages(prev => [...prev, tempMessage]);

    try {
      const formData = new FormData();
      if (userQuestion.trim()) formData.append('question', userQuestion);
      if (currentFile) formData.append('file', currentFile);

      const { data } = await api.post(`/chat/${subjectId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setMessages(prev => {
        const filtered = prev.filter(m => m._id !== tempMessage._id);
        return [...filtered, data.userMessage || tempMessage, data.assistantMessage || data];
      });
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
        <p className="text-secondary">Ask questions or upload images/documents to analyze with AI.</p>
      </div>

      <div className="flex-1 overflow-y-auto mb-6 flex flex-col gap-6" style={{ paddingRight: '0.5rem' }}>
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-muted">
            <Bot size={64} style={{ opacity: 0.5, marginBottom: '1rem' }} />
            <p>No messages yet. Ask a question or attach an image/document!</p>
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
                {/* Render Attachments */}
                {msg.attachments && msg.attachments.map((att, attIdx) => (
                  <div key={attIdx} style={{ marginBottom: '0.75rem' }}>
                    {att.fileType === 'image' || (att.url && (att.url.includes('/uploads/') || att.url.startsWith('data:') || att.url.startsWith('blob:'))) ? (
                      <div style={{ borderRadius: '0.75rem', overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.15)', maxWidth: '320px' }}>
                        <img 
                          src={formatAttachmentUrl(att.url)} 
                          alt={att.filename || 'Attachment'} 
                          style={{ width: '100%', height: 'auto', display: 'block', maxHeight: '250px', objectFit: 'cover' }}
                        />
                      </div>
                    ) : (
                      <a 
                        href={formatAttachmentUrl(att.url)} 
                        target="_blank" 
                        rel="noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.4rem 0.75rem',
                          borderRadius: '0.5rem',
                          background: 'rgba(255, 255, 255, 0.08)',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          fontSize: '0.8rem',
                          color: '#60a5fa',
                          textDecoration: 'none'
                        }}
                      >
                        <FileText size={16} />
                        <span>{att.filename}</span>
                      </a>
                    )}
                  </div>
                ))}

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

      {/* Input Box Container */}
      <div style={{ position: 'relative', marginTop: 'auto' }}>
        {/* File Preview Banner */}
        {selectedFile && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.5rem 0.85rem',
            marginBottom: '0.5rem',
            background: 'rgba(30, 41, 59, 0.95)',
            border: '1px solid rgba(59, 130, 246, 0.4)',
            borderRadius: '0.75rem',
            fontSize: '0.825rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', overflow: 'hidden' }}>
              {filePreview ? (
                <img src={filePreview} alt="Preview" style={{ width: '28px', height: '28px', borderRadius: '0.25rem', objectFit: 'cover' }} />
              ) : (
                <FileText size={18} style={{ color: '#60a5fa' }} />
              )}
              <span style={{ color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '300px' }}>
                {selectedFile.name}
              </span>
            </div>
            <button
              onClick={clearFile}
              style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px' }}
            >
              <X size={16} />
            </button>
          </div>
        )}

        <form onSubmit={handleSend} style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*,.pdf,.txt"
            style={{ display: 'none' }}
          />

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            title="Attach image or document"
            style={{
              position: 'absolute',
              left: '0.75rem',
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 20,
              background: selectedFile ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.06)',
              border: '1px solid',
              borderColor: selectedFile ? 'rgba(59, 130, 246, 0.5)' : 'rgba(255, 255, 255, 0.12)',
              color: selectedFile ? '#60a5fa' : '#94a3b8',
              cursor: 'pointer',
              padding: '0.45rem',
              borderRadius: '0.6rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              pointerEvents: 'auto'
            }}
          >
            <Paperclip size={18} />
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={selectedFile ? "Ask a question about this attachment..." : "Ask a question or upload an image/document..."}
            className="glass-panel"
            style={{
              width: '100%',
              paddingLeft: '3rem',
              paddingRight: '4rem',
              paddingBottom: '1rem',
              paddingTop: '1rem',
              outline: 'none'
            }}
            disabled={sending}
          />

          <button
            type="submit"
            disabled={(!input.trim() && !selectedFile) || sending}
            className="btn-primary"
            style={{ 
              position: 'absolute',
              right: '0.5rem',
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 20,
              padding: '0.5rem',
              borderRadius: '0.75rem',
              border: 'none'
            }}
          >
            <Send size={20} />
          </button>
        </form>
      </div>

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
