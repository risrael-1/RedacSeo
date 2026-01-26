import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext'
import { ArticlesProvider } from './context/ArticlesContext'
import { ProjectsProvider } from './context/ProjectsContext'
import { SeoCriteriaProvider } from './context/SeoCriteriaContext'
import { UnsavedChangesProvider } from './context/UnsavedChangesContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <ProjectsProvider>
        <SeoCriteriaProvider>
          <ArticlesProvider>
            <UnsavedChangesProvider>
              <App />
            </UnsavedChangesProvider>
          </ArticlesProvider>
        </SeoCriteriaProvider>
      </ProjectsProvider>
    </AuthProvider>
  </StrictMode>,
)
