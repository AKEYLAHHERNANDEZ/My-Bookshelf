import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App.jsx';
import { LibraryProvider } from './context/LibraryContext.jsx';
import './styles/global.css';
import './styles/components.css';
import './styles/dashboard.css';
import './styles/bookshelf.css';
import './styles/pages.css';

// HashRouter keeps routing working on GitHub Pages, which cannot rewrite
// deep links like /bookshelf to index.html.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <LibraryProvider>
        <App />
      </LibraryProvider>
    </HashRouter>
  </React.StrictMode>,
);
