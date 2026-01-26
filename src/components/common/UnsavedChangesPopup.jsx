import { useUnsavedChanges } from '../../context/UnsavedChangesContext';

const UnsavedChangesPopup = () => {
  const {
    pendingNavigation,
    confirmNavigation,
    saveAndNavigate,
    cancelNavigation
  } = useUnsavedChanges();

  if (!pendingNavigation) return null;

  return (
    <div className="popup-overlay" onClick={cancelNavigation}>
      <div className="popup-content" onClick={(e) => e.stopPropagation()}>
        <div className="popup-icon warning">⚠️</div>
        <h3>Modifications non sauvegardées</h3>
        <p>
          Vous avez des modifications en cours.
          Que souhaitez-vous faire avant de quitter cette page ?
        </p>
        <div className="popup-actions">
          <button className="btn btn-danger" onClick={confirmNavigation}>
            Abandonner
          </button>
          <button className="btn btn-secondary" onClick={cancelNavigation}>
            Annuler
          </button>
          <button className="btn btn-success" onClick={saveAndNavigate}>
            Sauvegarder
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnsavedChangesPopup;
