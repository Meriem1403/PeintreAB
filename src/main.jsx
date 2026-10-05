import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/browser-fallbacks.css'
import './styles/responsive-global.css'
import './styles/forms.css'
import './styles/brand-buttons.css'
import './styles/artist-section-title.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
