const ConfirmPopup = ({ icon, title, message, onConfirm, onCancel, confirmText = 'Confirmer', cancelText = 'Annuler' }) => {
  return (
    <div className="clear-popup-overlay">
      <div className="clear-popup-content">
        <div className="clear-popup-icon">{icon}</div>
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="clear-popup-buttons">
          <button onClick={onCancel} className="cancel-button">
            {cancelText}
          </button>
          <button onClick={onConfirm} className="confirm-button">
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmPopup;
