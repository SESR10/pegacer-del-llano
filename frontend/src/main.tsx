import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
// Fuentes servidas por el propio sistema (no desde Google): no se envían datos de los usuarios a terceros.
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
