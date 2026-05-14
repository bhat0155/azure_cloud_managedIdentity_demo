import PdfUploader from './components/PdfUploader';

function App() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#f0f4f8',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <PdfUploader />
    </div>
  );
}

export default App;
