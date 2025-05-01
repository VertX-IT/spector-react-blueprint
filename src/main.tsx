
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { defineCustomElements } from '@ionic/pwa-elements/loader';
import App from './App.tsx';
import './index.css';

// Call the element loader for better mobile capabilities
defineCustomElements(window);

// Mount the app to the DOM
createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
