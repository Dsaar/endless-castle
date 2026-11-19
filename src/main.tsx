import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { applyPaletteToCss } from './lib/palette'
import './index.css'
import App from './App.tsx'

applyPaletteToCss()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
