import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { seoCriteriaAPI } from '../services/api';

const SeoCriteriaContext = createContext();

export const useSeoCriteria = () => {
  const context = useContext(SeoCriteriaContext);
  if (!context) {
    throw new Error('useSeoCriteria must be used within a SeoCriteriaProvider');
  }
  return context;
};

// Default criteria (used when not authenticated or as fallback)
const defaultCriteria = [
  {
    criterion_id: 'content-length',
    label: 'Longueur du contenu',
    description: 'Le contenu doit contenir au moins 300 mots',
    icon: '📝',
    max_points: 15,
    check_type: 'word_count',
    min_value: 300,
    max_value: null,
    target_value: 800,
    enabled: true
  },
  {
    criterion_id: 'keyword-title',
    label: 'Mot-clé dans le titre',
    description: 'Le mot-clé principal doit apparaître dans le titre SEO',
    icon: '🎯',
    max_points: 12,
    check_type: 'keyword_in_title',
    min_value: null,
    max_value: null,
    target_value: null,
    enabled: true
  },
  {
    criterion_id: 'keyword-meta',
    label: 'Mot-clé dans la meta',
    description: 'Le mot-clé principal doit apparaître dans la meta description',
    icon: '📄',
    max_points: 8,
    check_type: 'keyword_in_meta',
    min_value: null,
    max_value: null,
    target_value: null,
    enabled: true
  },
  {
    criterion_id: 'meta-length',
    label: 'Longueur meta description',
    description: 'La meta description doit faire entre 120 et 160 caractères',
    icon: '📄',
    max_points: 8,
    check_type: 'meta_length',
    min_value: 120,
    max_value: 160,
    target_value: null,
    enabled: true
  },
  {
    criterion_id: 'keyword-density',
    label: 'Densité du mot-clé',
    description: 'Le mot-clé doit apparaître entre 1% et 2.5% du contenu',
    icon: '💎',
    max_points: 12,
    check_type: 'keyword_density',
    min_value: 1,
    max_value: 2.5,
    target_value: null,
    enabled: true
  },
  {
    criterion_id: 'h1-structure',
    label: 'Structure H1',
    description: 'Le contenu doit contenir exactement 1 balise H1',
    icon: '🏷️',
    max_points: 10,
    check_type: 'h1_count',
    min_value: 1,
    max_value: 1,
    target_value: 1,
    enabled: true
  },
  {
    criterion_id: 'h1-keyword',
    label: 'Mot-clé dans H1',
    description: 'Le mot-clé principal doit apparaître dans le H1',
    icon: '🏷️',
    max_points: 3,
    check_type: 'keyword_in_h1',
    min_value: null,
    max_value: null,
    target_value: null,
    enabled: true
  },
  {
    criterion_id: 'h2-structure',
    label: 'Structure H2',
    description: 'Le contenu doit contenir au moins 2 balises H2',
    icon: '📋',
    max_points: 6,
    check_type: 'h2_count',
    min_value: 2,
    max_value: null,
    target_value: 3,
    enabled: true
  },
  {
    criterion_id: 'h3-structure',
    label: 'Structure H3',
    description: 'Le contenu doit contenir au moins 2 balises H3',
    icon: '📋',
    max_points: 4,
    check_type: 'h3_count',
    min_value: 2,
    max_value: null,
    target_value: null,
    enabled: true
  },
  {
    criterion_id: 'title-length',
    label: 'Longueur du titre',
    description: 'Le titre doit faire entre 30 et 60 caractères',
    icon: '📌',
    max_points: 5,
    check_type: 'title_length',
    min_value: 30,
    max_value: 60,
    target_value: null,
    enabled: true
  },
  {
    criterion_id: 'keyword-intro',
    label: 'Mot-clé au début',
    description: 'Le mot-clé doit apparaître dans les 100 premiers mots',
    icon: '⚡',
    max_points: 5,
    check_type: 'keyword_in_intro',
    min_value: null,
    max_value: null,
    target_value: 100,
    enabled: true
  },
  {
    criterion_id: 'strong-tags',
    label: 'Contenu en gras',
    description: 'Le contenu doit contenir au moins 3 balises strong',
    icon: '💪',
    max_points: 5,
    check_type: 'strong_count',
    min_value: 3,
    max_value: null,
    target_value: 5,
    enabled: true
  },
  {
    criterion_id: 'title-present',
    label: 'Titre présent',
    description: 'Un titre SEO doit être défini',
    icon: '✅',
    max_points: 5,
    check_type: 'title_present',
    min_value: null,
    max_value: null,
    target_value: null,
    enabled: true
  },
  {
    criterion_id: 'meta-present',
    label: 'Meta description présente',
    description: 'Une meta description doit être définie',
    icon: '✅',
    max_points: 2,
    check_type: 'meta_present',
    min_value: null,
    max_value: null,
    target_value: null,
    enabled: true
  }
];

export const SeoCriteriaProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [criteria, setCriteria] = useState(defaultCriteria);
  const [loading, setLoading] = useState(false);
  const [isDefault, setIsDefault] = useState(true);
  const [isOrganization, setIsOrganization] = useState(false);
  const [canManage, setCanManage] = useState(true);

  // Load criteria from API when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      loadCriteriaFromAPI();
    } else {
      setCriteria(defaultCriteria);
      setIsDefault(true);
    }
  }, [user, isAuthenticated]);

  const loadCriteriaFromAPI = async () => {
    try {
      setLoading(true);
      const response = await seoCriteriaAPI.getAll();
      setCriteria(response.criteria || defaultCriteria);
      setIsDefault(response.isDefault || false);
      setIsOrganization(response.isOrganization || false);
      setCanManage(response.canManage !== undefined ? response.canManage : true);
    } catch (error) {
      console.error('Failed to load SEO criteria:', error);
      setCriteria(defaultCriteria);
      setIsDefault(true);
      setIsOrganization(false);
      setCanManage(true);
    } finally {
      setLoading(false);
    }
  };

  const initializeCriteria = async () => {
    if (!isAuthenticated) return;

    try {
      setLoading(true);
      const response = await seoCriteriaAPI.initialize();
      setCriteria(response.criteria || defaultCriteria);
      setIsDefault(false);
    } catch (error) {
      console.error('Failed to initialize criteria:', error);
    } finally {
      setLoading(false);
    }
  };

  const addCriterion = async (criterion) => {
    if (isOrganization && !canManage) {
      throw new Error('Vous n\'avez pas les droits pour modifier les critères de l\'organisation');
    }

    if (!isAuthenticated) {
      // Local only
      const newCriterion = { ...criterion, enabled: true };
      setCriteria([...criteria, newCriterion]);
      return newCriterion;
    }

    try {
      const response = await seoCriteriaAPI.upsert(criterion);
      await loadCriteriaFromAPI();
      return response.criterion;
    } catch (error) {
      console.error('Failed to add criterion:', error);
      throw error;
    }
  };

  const updateCriterion = async (criterionId, updatedData) => {
    if (isOrganization && !canManage) {
      throw new Error('Vous n\'avez pas les droits pour modifier les critères de l\'organisation');
    }

    if (!isAuthenticated) {
      // Local only
      setCriteria(criteria.map(c =>
        c.criterion_id === criterionId ? { ...c, ...updatedData } : c
      ));
      return;
    }

    try {
      await seoCriteriaAPI.upsert({ criterion_id: criterionId, ...updatedData });
      await loadCriteriaFromAPI();
    } catch (error) {
      console.error('Failed to update criterion:', error);
      throw error;
    }
  };

  const deleteCriterion = async (criterionId) => {
    if (isOrganization && !canManage) {
      throw new Error('Vous n\'avez pas les droits pour modifier les critères de l\'organisation');
    }

    if (!isAuthenticated) {
      // Local only
      setCriteria(criteria.filter(c => c.criterion_id !== criterionId));
      return;
    }

    try {
      await seoCriteriaAPI.delete(criterionId);
      await loadCriteriaFromAPI();
    } catch (error) {
      console.error('Failed to delete criterion:', error);
      throw error;
    }
  };

  const toggleCriterion = async (criterionId) => {
    if (isOrganization && !canManage) {
      throw new Error('Vous n\'avez pas les droits pour modifier les critères de l\'organisation');
    }

    if (!isAuthenticated) {
      // Local only
      setCriteria(criteria.map(c =>
        c.criterion_id === criterionId ? { ...c, enabled: !c.enabled } : c
      ));
      return;
    }

    try {
      await seoCriteriaAPI.toggle(criterionId);
      await loadCriteriaFromAPI();
    } catch (error) {
      console.error('Failed to toggle criterion:', error);
      throw error;
    }
  };

  const resetToDefault = async () => {
    if (isOrganization && !canManage) {
      throw new Error('Vous n\'avez pas les droits pour modifier les critères de l\'organisation');
    }

    if (!isAuthenticated) {
      setCriteria(defaultCriteria);
      setIsDefault(true);
      return;
    }

    try {
      setLoading(true);
      const response = await seoCriteriaAPI.resetToDefault();
      setCriteria(response.criteria || defaultCriteria);
      setIsDefault(false);
    } catch (error) {
      console.error('Failed to reset criteria:', error);
    } finally {
      setLoading(false);
    }
  };

  // Critères liés au titre et meta description
  const titleMetaCriteriaIds = [
    'keyword-title',
    'keyword-meta',
    'meta-length',
    'title-length',
    'title-present',
    'meta-present'
  ];

  // Calculate SEO score based on current criteria
  const calculateScore = useCallback((content, title, metaDescription, keyword, seoFieldsEnabled = true) => {
    if (!content || !content.trim()) {
      return { score: 0, details: [] };
    }

    // Filtrer les critères : exclure ceux liés au titre/meta si désactivé
    let enabledCriteria = criteria.filter(c => c.enabled);
    if (!seoFieldsEnabled) {
      enabledCriteria = enabledCriteria.filter(c => !titleMetaCriteriaIds.includes(c.criterion_id));
    }
    let totalScore = 0;
    const details = [];

    const wordCount = content.trim().split(/\s+/).filter(w => w.length > 0).length;
    const contentLower = content.toLowerCase();
    const keywordLower = keyword?.toLowerCase() || '';

    for (const criterion of enabledCriteria) {
      let points = 0;
      let isValid = false;
      let detail = '';

      switch (criterion.check_type) {
        case 'word_count': {
          if (criterion.target_value && wordCount >= criterion.target_value) {
            points = criterion.max_points;
            isValid = true;
          } else if (wordCount >= 500) {
            points = Math.round(criterion.max_points * 0.87);
            isValid = true;
          } else if (criterion.min_value && wordCount >= criterion.min_value) {
            points = Math.round(criterion.max_points * 0.73);
            isValid = true;
          }
          detail = `${wordCount} mots`;
          break;
        }

        case 'keyword_in_title': {
          if (keyword && title && title.toLowerCase().includes(keywordLower)) {
            const position = title.toLowerCase().indexOf(keywordLower);
            if (position === 0) {
              points = criterion.max_points;
            } else if (position < 10) {
              points = Math.round(criterion.max_points * 0.83);
            } else {
              points = Math.round(criterion.max_points * 0.67);
            }
            isValid = true;
            detail = 'Présent';
          } else {
            detail = 'Absent';
          }
          break;
        }

        case 'keyword_in_meta': {
          if (keyword && metaDescription && metaDescription.toLowerCase().includes(keywordLower)) {
            points = criterion.max_points;
            isValid = true;
            detail = 'Présent';
          } else {
            detail = 'Absent';
          }
          break;
        }

        case 'meta_length': {
          const len = metaDescription ? metaDescription.length : 0;
          if (criterion.min_value && criterion.max_value && len >= criterion.min_value && len <= criterion.max_value) {
            points = criterion.max_points;
            isValid = true;
          }
          detail = `${len} caractères`;
          break;
        }

        case 'keyword_density': {
          if (keyword && wordCount > 0) {
            const keywordRegex = new RegExp(`\\b${keywordLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
            const matches = contentLower.match(keywordRegex);
            const keywordCount = matches ? matches.length : 0;
            const density = (keywordCount / wordCount) * 100;

            if (criterion.min_value && criterion.max_value && density >= criterion.min_value && density <= criterion.max_value) {
              points = criterion.max_points;
              isValid = true;
            } else if (density >= 0.5 && density < criterion.min_value) {
              points = Math.round(criterion.max_points * 0.83);
              isValid = true;
            }
            detail = `${density.toFixed(1)}% (${keywordCount} fois)`;
          } else {
            detail = 'Aucun mot-clé';
          }
          break;
        }

        case 'h1_count': {
          const h1Count = (content.match(/<h1[^>]*>/gi) || []).length;
          if (criterion.target_value && h1Count === criterion.target_value) {
            points = criterion.max_points;
            isValid = true;
          }
          detail = `${h1Count} H1`;
          break;
        }

        case 'keyword_in_h1': {
          if (keyword) {
            const h1Match = content.match(/<h1[^>]*>(.*?)<\/h1>/i);
            if (h1Match && h1Match[1].toLowerCase().includes(keywordLower)) {
              points = criterion.max_points;
              isValid = true;
              detail = 'Présent';
            } else {
              detail = 'Absent';
            }
          } else {
            detail = 'Aucun mot-clé';
          }
          break;
        }

        case 'h2_count': {
          const h2Count = (content.match(/<h2[^>]*>/gi) || []).length;
          if (criterion.target_value && h2Count >= criterion.target_value) {
            points = criterion.max_points;
            isValid = true;
          } else if (criterion.min_value && h2Count >= criterion.min_value) {
            points = Math.round(criterion.max_points * 0.67);
            isValid = true;
          }
          detail = `${h2Count} H2`;
          break;
        }

        case 'h3_count': {
          const h3Count = (content.match(/<h3[^>]*>/gi) || []).length;
          if (criterion.min_value && h3Count >= criterion.min_value) {
            points = criterion.max_points;
            isValid = true;
          }
          detail = `${h3Count} H3`;
          break;
        }

        case 'title_length': {
          const titleLen = title ? title.length : 0;
          if (criterion.min_value && criterion.max_value && titleLen >= criterion.min_value && titleLen <= criterion.max_value) {
            points = criterion.max_points;
            isValid = true;
          }
          detail = `${titleLen} caractères`;
          break;
        }

        case 'keyword_in_intro': {
          if (keyword) {
            const introWords = criterion.target_value || 100;
            const first100Words = content.trim().split(/\s+/).slice(0, introWords).join(' ');
            if (first100Words.toLowerCase().includes(keywordLower)) {
              points = criterion.max_points;
              isValid = true;
              detail = 'Présent';
            } else {
              detail = 'Absent';
            }
          } else {
            detail = 'Aucun mot-clé';
          }
          break;
        }

        case 'strong_count': {
          const strongCount = (content.match(/<strong[^>]*>/gi) || []).length;
          if (criterion.target_value && strongCount >= criterion.target_value) {
            points = criterion.max_points;
            isValid = true;
          } else if (criterion.min_value && strongCount >= criterion.min_value) {
            points = Math.round(criterion.max_points * 0.8);
            isValid = true;
          }
          detail = `${strongCount} balises`;
          break;
        }

        case 'title_present': {
          if (title && title.trim()) {
            points = criterion.max_points;
            isValid = true;
            detail = 'Présent';
          } else {
            detail = 'Absent';
          }
          break;
        }

        case 'meta_present': {
          if (metaDescription && metaDescription.trim()) {
            points = criterion.max_points;
            isValid = true;
            detail = 'Présent';
          } else {
            detail = 'Absent';
          }
          break;
        }

        default:
          break;
      }

      totalScore += points;
      details.push({
        criterion_id: criterion.criterion_id,
        label: criterion.label,
        icon: criterion.icon,
        max_points: criterion.max_points,
        points,
        isValid,
        detail
      });
    }

    // Calculate max possible score from enabled criteria
    const maxPossibleScore = enabledCriteria.reduce((sum, c) => sum + c.max_points, 0);

    // Normalize to 100
    const normalizedScore = maxPossibleScore > 0 ? Math.round((totalScore / maxPossibleScore) * 100) : 0;

    return { score: normalizedScore, details, totalPoints: totalScore, maxPoints: maxPossibleScore };
  }, [criteria]);

  // Get all criteria status (for real-time display)
  const getAllCriteriaStatus = useCallback((content, title, metaDescription, keyword, seoFieldsEnabled = true) => {
    const result = calculateScore(content, title, metaDescription, keyword, seoFieldsEnabled);
    return result.details;
  }, [calculateScore]);

  // Get unmet criteria
  const getUnmetCriteria = useCallback((content, title, metaDescription, keyword, seoFieldsEnabled = true) => {
    const result = calculateScore(content, title, metaDescription, keyword, seoFieldsEnabled);
    return result.details.filter(d => !d.isValid);
  }, [calculateScore]);

  return (
    <SeoCriteriaContext.Provider value={{
      criteria,
      loading,
      isDefault,
      isOrganization,
      canManage,
      defaultCriteria,
      addCriterion,
      updateCriterion,
      deleteCriterion,
      toggleCriterion,
      resetToDefault,
      initializeCriteria,
      calculateScore,
      getAllCriteriaStatus,
      getUnmetCriteria,
      refreshCriteria: loadCriteriaFromAPI
    }}>
      {children}
    </SeoCriteriaContext.Provider>
  );
};
