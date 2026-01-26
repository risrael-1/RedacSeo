import { createContext, useContext, useState, useCallback } from 'react';

const UnsavedChangesContext = createContext();

export const UnsavedChangesProvider = ({ children }) => {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);
  const [saveCallback, setSaveCallback] = useState(null);

  // Enregistrer qu'il y a des modifications non sauvegardées
  const markAsUnsaved = useCallback(() => {
    setHasUnsavedChanges(true);
  }, []);

  // Marquer comme sauvegardé
  const markAsSaved = useCallback(() => {
    setHasUnsavedChanges(false);
  }, []);

  // Enregistrer la fonction de sauvegarde
  const registerSaveCallback = useCallback((callback) => {
    setSaveCallback(() => callback);
  }, []);

  // Demander navigation (appelé par Navbar)
  const requestNavigation = useCallback((navigateFn) => {
    if (hasUnsavedChanges) {
      setPendingNavigation(() => navigateFn);
      return false; // Navigation bloquée
    }
    return true; // Navigation autorisée
  }, [hasUnsavedChanges]);

  // Confirmer la navigation (abandonner les changements)
  const confirmNavigation = useCallback(() => {
    setHasUnsavedChanges(false);
    if (pendingNavigation) {
      pendingNavigation();
      setPendingNavigation(null);
    }
  }, [pendingNavigation]);

  // Sauvegarder puis naviguer
  const saveAndNavigate = useCallback(() => {
    if (saveCallback) {
      saveCallback();
    }
    setHasUnsavedChanges(false);
    if (pendingNavigation) {
      pendingNavigation();
      setPendingNavigation(null);
    }
  }, [saveCallback, pendingNavigation]);

  // Annuler la navigation
  const cancelNavigation = useCallback(() => {
    setPendingNavigation(null);
  }, []);

  return (
    <UnsavedChangesContext.Provider
      value={{
        hasUnsavedChanges,
        markAsUnsaved,
        markAsSaved,
        registerSaveCallback,
        requestNavigation,
        confirmNavigation,
        saveAndNavigate,
        cancelNavigation,
        pendingNavigation
      }}
    >
      {children}
    </UnsavedChangesContext.Provider>
  );
};

export const useUnsavedChanges = () => {
  const context = useContext(UnsavedChangesContext);
  if (!context) {
    throw new Error('useUnsavedChanges must be used within UnsavedChangesProvider');
  }
  return context;
};
