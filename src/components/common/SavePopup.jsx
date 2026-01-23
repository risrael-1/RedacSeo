const SavePopup = ({ message = 'Article sauvegardé !', description = 'Vos modifications ont été enregistrées avec succès' }) => {
  return (
    <div className="save-popup">
      <div className="save-popup-content">
        <div className="save-popup-icon">✓</div>
        <h3>{message}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
};

export default SavePopup;
