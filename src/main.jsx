import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext'
import { RulesProvider } from './context/RulesContext'
import { ArticlesProvider } from './context/ArticlesContext'
import { ProjectsProvider } from './context/ProjectsContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <ProjectsProvider>
        <RulesProvider>
          <ArticlesProvider>
            <App />
          </ArticlesProvider>
        </RulesProvider>
      </ProjectsProvider>
    </AuthProvider>
  </StrictMode>,
)
