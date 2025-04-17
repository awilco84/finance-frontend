import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { SavingsProvider } from './context/SavingsContext';
import './index.css';


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <AuthProvider>
    <SavingsProvider>
      <App />
    </SavingsProvider>
  </AuthProvider>
);