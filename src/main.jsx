import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext'
import { RulesProvider } from './context/RulesContext'
import { ArticlesProvider } from './context/ArticlesContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <RulesProvider>
        <ArticlesProvider>
          <App />
        </ArticlesProvider>
      </RulesProvider>
    </AuthProvider>
  </StrictMode>,
)
