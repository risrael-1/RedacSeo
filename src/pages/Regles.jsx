import { useState } from 'react';
import { useSeoCriteria } from '../context/SeoCriteriaContext';
import Navbar from '../components/Navbar';
import {
  CriteriaHeader,
  CriteriaActionsBar,
  CriterionForm,
  CriteriaGrid,
  CriteriaInfoFooter
} from '../components/regles';
import './Regles.css';

const CHECK_TYPES = [
  { value: 'word_count', label: 'Nombre de mots', description: 'Vérifie le nombre de mots dans le contenu' },
  { value: 'keyword_in_title', label: 'Mot-clé dans le titre', description: 'Vérifie si le mot-clé est dans le titre' },
  { value: 'keyword_in_meta', label: 'Mot-clé dans meta', description: 'Vérifie si le mot-clé est dans la meta description' },
  { value: 'meta_length', label: 'Longueur meta description', description: 'Vérifie la longueur de la meta description' },
  { value: 'keyword_density', label: 'Densité du mot-clé', description: 'Vérifie le pourcentage du mot-clé dans le contenu' },
  { value: 'h1_count', label: 'Nombre de H1', description: 'Vérifie le nombre de balises H1' },
  { value: 'keyword_in_h1', label: 'Mot-clé dans H1', description: 'Vérifie si le mot-clé est dans le H1' },
  { value: 'h2_count', label: 'Nombre de H2', description: 'Vérifie le nombre de balises H2' },
  { value: 'h3_count', label: 'Nombre de H3', description: 'Vérifie le nombre de balises H3' },
  { value: 'title_length', label: 'Longueur du titre', description: 'Vérifie la longueur du titre SEO' },
  { value: 'keyword_in_intro', label: 'Mot-clé au début', description: 'Vérifie si le mot-clé est dans les X premiers mots' },
  { value: 'strong_count', label: 'Balises strong', description: 'Vérifie le nombre de balises strong' },
  { value: 'title_present', label: 'Titre présent', description: 'Vérifie si un titre est défini' },
  { value: 'meta_present', label: 'Meta présente', description: 'Vérifie si une meta description est définie' }
];

const ICONS = ['📝', '🎯', '📄', '💎', '🏷️', '📋', '📌', '⚡', '💪', '✅', '🔍', '📊', '🏆', '⭐'];

const INITIAL_FORM_DATA = {
  criterion_id: '',
  label: '',
  description: '',
  icon: '📝',
  max_points: 10,
  check_type: 'word_count',
  min_value: '',
  max_value: '',
  target_value: ''
};

const Regles = () => {
  const {
    criteria,
    loading: criteriaLoading,
    isDefault,
    toggleCriterion,
    deleteCriterion,
    addCriterion,
    updateCriterion,
    resetToDefault,
    initializeCriteria
  } = useSeoCriteria();

  const [showAddCriterionForm, setShowAddCriterionForm] = useState(false);
  const [editingCriterion, setEditingCriterion] = useState(null);
  const [criterionFormData, setCriterionFormData] = useState(INITIAL_FORM_DATA);

  // Calculate total points
  const totalPoints = criteria
    .filter(c => c.enabled)
    .reduce((sum, c) => sum + (c.max_points || 0), 0);

  const activeCount = criteria.filter(c => c.enabled).length;

  const resetCriterionForm = () => {
    setCriterionFormData(INITIAL_FORM_DATA);
    setShowAddCriterionForm(false);
    setEditingCriterion(null);
  };

  const handleAddCriterion = async () => {
    if (!criterionFormData.label || !criterionFormData.check_type) {
      alert('Veuillez remplir le label et le type de vérification');
      return;
    }

    const criterionId = criterionFormData.criterion_id ||
      criterionFormData.label.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    const criterionData = {
      criterion_id: criterionId,
      label: criterionFormData.label,
      description: criterionFormData.description,
      icon: criterionFormData.icon,
      max_points: parseInt(criterionFormData.max_points) || 10,
      check_type: criterionFormData.check_type,
      min_value: criterionFormData.min_value ? parseFloat(criterionFormData.min_value) : null,
      max_value: criterionFormData.max_value ? parseFloat(criterionFormData.max_value) : null,
      target_value: criterionFormData.target_value ? parseFloat(criterionFormData.target_value) : null,
      enabled: true
    };

    try {
      if (editingCriterion) {
        await updateCriterion(editingCriterion.criterion_id, criterionData);
        setEditingCriterion(null);
      } else {
        await addCriterion(criterionData);
      }
      resetCriterionForm();
    } catch (error) {
      alert('Erreur lors de la sauvegarde du critère');
    }
  };

  const handleEditCriterion = (criterion) => {
    setEditingCriterion(criterion);
    setCriterionFormData({
      criterion_id: criterion.criterion_id,
      label: criterion.label,
      description: criterion.description || '',
      icon: criterion.icon || '📝',
      max_points: criterion.max_points || 10,
      check_type: criterion.check_type,
      min_value: criterion.min_value ?? '',
      max_value: criterion.max_value ?? '',
      target_value: criterion.target_value ?? ''
    });
    setShowAddCriterionForm(true);
  };

  const handleDeleteCriterion = async (criterionId) => {
    if (window.confirm('Voulez-vous vraiment supprimer ce critère ?')) {
      try {
        await deleteCriterion(criterionId);
      } catch (error) {
        alert('Erreur lors de la suppression');
      }
    }
  };

  const handleResetToDefault = async () => {
    if (window.confirm('Voulez-vous vraiment réinitialiser tous les critères par défaut ? Vos personnalisations seront perdues.')) {
      await resetToDefault();
    }
  };

  const handleInitializeCriteria = async () => {
    if (isDefault) {
      await initializeCriteria();
    }
  };

  return (
    <div className="regles-container">
      <Navbar />
      <main className="regles-main">
        <CriteriaHeader
          criteriaCount={criteria.length}
          totalPoints={totalPoints}
          activeCount={activeCount}
        />

        <CriteriaActionsBar
          isDefault={isDefault}
          showAddForm={showAddCriterionForm}
          onToggleAddForm={() => setShowAddCriterionForm(!showAddCriterionForm)}
          onInitialize={handleInitializeCriteria}
          onReset={handleResetToDefault}
        />

        {showAddCriterionForm && (
          <CriterionForm
            formData={criterionFormData}
            onFormChange={setCriterionFormData}
            onSubmit={handleAddCriterion}
            onCancel={resetCriterionForm}
            isEditing={!!editingCriterion}
            checkTypes={CHECK_TYPES}
            icons={ICONS}
          />
        )}

        <CriteriaGrid
          criteria={criteria}
          loading={criteriaLoading}
          isDefault={isDefault}
          onToggle={toggleCriterion}
          onEdit={handleEditCriterion}
          onDelete={handleDeleteCriterion}
        />

        <CriteriaInfoFooter isDefault={isDefault} />
      </main>
    </div>
  );
};

export default Regles;
