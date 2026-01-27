import CriterionCard from './CriterionCard';

const CriteriaGrid = ({
  criteria,
  loading,
  isDefault,
  onToggle,
  onEdit,
  onDelete,
  canManage = true
}) => {
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Chargement des critères...</p>
      </div>
    );
  }

  return (
    <div className="criteria-grid">
      {criteria.map((criterion) => (
        <CriterionCard
          key={criterion.criterion_id}
          criterion={criterion}
          isDefault={isDefault}
          onToggle={onToggle}
          onEdit={onEdit}
          onDelete={onDelete}
          canManage={canManage}
        />
      ))}
    </div>
  );
};

export default CriteriaGrid;
