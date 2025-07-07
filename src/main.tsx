import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// ✅ Add this import
import { HashRouter } from 'react-router-dom'

// ✅ Wrap App inside HashRouter
createRoot(document.getElementById("root")!).render(
  <HashRouter>
    <App />
  </HashRouter>
);
