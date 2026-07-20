import React from 'react';
import ReactDOM from 'react-dom/client';
import SaaSApp from './SaaSApp';
import { AuthProvider } from './saas/AuthContext.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  React.createElement(AuthProvider, null, React.createElement(SaaSApp))
);
