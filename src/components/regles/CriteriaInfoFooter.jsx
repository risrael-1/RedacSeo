const CriteriaInfoFooter = ({ isDefault }) => {
  return (
    <div className="info-footer">
      <div className="info-icon">💡</div>
      <div className="info-content">
        <strong>Conseil</strong>
        <p>
          Le score SEO est calculé automatiquement lors de chaque sauvegarde.
          {isDefault
            ? ' Personnalisez les critères pour adapter le calcul à vos besoins.'
            : ' Ajustez les points et paramètres pour refléter vos priorités SEO.'}
        </p>
      </div>
    </div>
  );
};

export default CriteriaInfoFooter;
