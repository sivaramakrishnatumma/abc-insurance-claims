import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App.tsx';
import { RBACProvider } from './context/RBACContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <RBACProvider initialRole='Adjudicator'>
        <App />
      </RBACProvider>
    </BrowserRouter>
  </StrictMode>,
);
