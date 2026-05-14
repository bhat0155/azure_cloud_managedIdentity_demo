import React, { useState, useCallback } from 'react';

const API_URL = process.env.REACT_APP_API_URL || '';

export default function PdfUploader() {
  const [file, setFile]       = useState(null);
  const [status, setStatus]   = useState('idle'); // idle | uploading | success | error
  const [message, setMessage] = useState('');
  const [dragging, setDragging] = useState(false);

  function formatSize(bytes) {
    return bytes >= 1048576
      ? (bytes / 1048576).toFixed(2) + ' MB'
      : (bytes / 1024).toFixed(1) + ' KB';
  }

  const handleFile = useCallback((f) => {
    if (!f || f.type !== 'application/pdf') {
      setStatus('error');
      setMessage('Please select a PDF file.');
      return;
    }
    setFile(f);
    setStatus('idle');
    setMessage('');
  }, []);

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const upload = async () => {
    if (!file) return;
    setStatus('uploading');
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res  = await fetch(`${API_URL}/upload`, { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok) {
        setStatus('success');
        setMessage(`"${file.name}" uploaded successfully!`);
        setFile(null);
      } else {
        setStatus('error');
        setMessage(data.error || 'Upload failed.');
      }
    } catch {
      setStatus('error');
      setMessage('Network error — please try again.');
    }
  };

  return (
    <div style={styles.card}>
      <h1 style={styles.title}>PDF Upload</h1>
      <p style={styles.subtitle}>Upload a PDF file to Azure Blob Storage</p>

      <div
        style={{ ...styles.dropzone, ...(dragging ? styles.dropzoneActive : {}) }}
        onClick={() => document.getElementById('fileInput').click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        <div style={styles.icon}>📄</div>
        <p style={styles.dropText}>
          {dragging ? 'Drop it here!' : 'Drag & drop a PDF, or click to browse'}
        </p>
        <p style={styles.hint}>PDF files only</p>
        <input
          id="fileInput"
          type="file"
          accept="application/pdf"
          style={{ display: 'none' }}
          onChange={(e) => handleFile(e.target.files[0])}
        />
      </div>

      {file && (
        <div style={styles.fileInfo}>
          <strong>{file.name}</strong>
          <span style={{ color: '#718096', marginLeft: 8 }}>{formatSize(file.size)}</span>
        </div>
      )}

      <button
        style={{ ...styles.btn, ...(!file || status === 'uploading' ? styles.btnDisabled : {}) }}
        onClick={upload}
        disabled={!file || status === 'uploading'}
      >
        {status === 'uploading' ? 'Uploading...' : 'Upload PDF'}
      </button>

      {message && (
        <div style={{ ...styles.status, ...(status === 'success' ? styles.success : styles.error) }}>
          {status === 'success' ? '✓ ' : '✗ '}{message}
        </div>
      )}
    </div>
  );
}

const styles = {
  card: {
    background: '#fff', borderRadius: 16, padding: '48px 40px',
    width: 480, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', textAlign: 'center',
  },
  title:    { fontSize: '1.6rem', color: '#1a1a2e', marginBottom: 8 },
  subtitle: { color: '#666', fontSize: '0.95rem', marginBottom: 32 },
  dropzone: {
    border: '2px dashed #a0aec0', borderRadius: 12, padding: '40px 24px',
    cursor: 'pointer', background: '#f7fafc', transition: 'all 0.2s',
  },
  dropzoneActive: { borderColor: '#4299e1', background: '#ebf8ff' },
  icon:     { fontSize: 40, marginBottom: 8 },
  dropText: { color: '#718096', fontSize: '0.95rem' },
  hint:     { fontSize: '0.8rem', color: '#a0aec0', marginTop: 6 },
  fileInfo: {
    margin: '16px 0 0', padding: '12px 16px', background: '#f7fafc',
    borderRadius: 8, textAlign: 'left', fontSize: '0.9rem',
  },
  btn: {
    marginTop: 24, width: '100%', padding: 14, background: '#4299e1',
    color: '#fff', border: 'none', borderRadius: 10, fontSize: '1rem',
    fontWeight: 600, cursor: 'pointer',
  },
  btnDisabled: { background: '#a0aec0', cursor: 'not-allowed' },
  status: { marginTop: 20, padding: '12px 16px', borderRadius: 8, fontSize: '0.9rem' },
  success: { background: '#f0fff4', color: '#276749' },
  error:   { background: '#fff5f5', color: '#c53030' },
};
