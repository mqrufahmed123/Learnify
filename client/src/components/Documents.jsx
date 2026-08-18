import { useState, useEffect, useRef } from 'react';
import { UploadCloud, File, Trash2, Loader2, FileText } from 'lucide-react';
import api from '../api';

export default function Documents({ subjectId }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchDocuments();
  }, [subjectId]);

  const fetchDocuments = async () => {
    try {
      const { data } = await api.get(`/documents/${subjectId}`);
      setDocuments(data);
    } catch (err) {
      console.error('Failed to fetch documents:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/documents/${subjectId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (!response.ok) throw new Error('Upload failed');
      const newDoc = await response.json();
      setDocuments([newDoc, ...documents]);
    } catch (err) {
      console.error('Failed to upload document:', err);
      alert('Failed to upload document. Please try again.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (docId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    try {
      await api.delete(`/documents/${docId}`);
      setDocuments(documents.filter(d => d._id !== docId));
    } catch (err) {
      console.error('Failed to delete document:', err);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="animate-fade-in text-blue" size={32} style={{ animation: 'spin 1s linear infinite' }} /></div>;
  }

  return (
    <div className="animate-fade-in mx-auto" style={{ maxWidth: '800px', paddingBottom: '2rem' }}>
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">Subject Documents</h2>
        <p className="text-secondary">Upload PDF materials to serve as context for the AI.</p>
      </div>

      {/* Upload Zone */}
      <div 
        className="glass-panel text-center mb-8 hover-scale"
        style={{ border: '2px dashed var(--border-hover)', cursor: 'pointer', padding: '3rem 2rem' }}
        onClick={() => !uploading && fileInputRef.current?.click()}
      >
        <input 
          type="file" 
          ref={fileInputRef}
          style={{ display: 'none' }}
          accept=".pdf"
          onChange={handleFileUpload}
          disabled={uploading}
        />
        {uploading ? (
          <div className="flex flex-col items-center">
            <Loader2 className="text-blue mb-4" size={48} style={{ animation: 'spin 1s linear infinite' }} />
            <p className="text-lg font-medium">Processing Document...</p>
            <p className="text-sm text-secondary mt-2">Extracting text and generating context</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '1rem', borderRadius: '50%', marginBottom: '1rem' }}>
              <UploadCloud size={40} className="text-blue" />
            </div>
            <p className="text-lg font-medium mb-2">Click to upload PDF</p>
            <p className="text-sm text-secondary">Max size 10MB</p>
          </div>
        )}
      </div>

      {/* Document List */}
      <div>
        <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
          <FileText className="text-blue" size={20} />
          Processed Documents ({documents.length})
        </h3>
        
        {documents.length === 0 ? (
          <div className="text-center p-8 text-muted rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)' }}>
            No documents uploaded yet. Upload a PDF to start learning!
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {documents.map(doc => (
              <div key={doc._id} className="glass-panel flex items-center justify-between transition-all" style={{ padding: '1rem 1.5rem' }}>
                <div className="flex items-center gap-4">
                  <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '0.75rem', borderRadius: '0.75rem', color: 'var(--accent-primary)' }}>
                    <File size={24} />
                  </div>
                  <div>
                    <h4 className="font-medium text-primary">{doc.filename}</h4>
                    <p className="text-xs text-secondary mt-2">
                      {doc.pageCount} pages • Added {new Date(doc.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => handleDelete(doc._id)}
                  style={{ padding: '0.5rem', background: 'transparent', color: 'var(--text-secondary)', borderRadius: '0.5rem' }}
                  onMouseOver={(e) => { e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; }}
                  onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'transparent'; }}
                  title="Delete Document"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
