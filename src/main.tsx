import React from 'react';
import ReactDOM from 'react-dom/client';
import AppContent from './App';
import { AuthProvider } from './context/AuthContext';
import './styles/global.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Target root element not found');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  </React.StrictMode>
);
