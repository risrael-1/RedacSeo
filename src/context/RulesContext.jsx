import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { rulesAPI } from '../services/api';

const RulesContext = createContext();

export const useRules = () => {
  const context = useContext(RulesContext);
  if (!context) {
    throw new Error('useRules must be used within a RulesProvider');
  }
  return context;
};

const defaultRules = [
  {
    id: 1,
    name: 'Titre SEO',
    description: 'Le titre SEO ne doit pas dépasser 65 caractères',
    type: 'title',
    maxLength: 65,
    enabled: true
  },
  {
    id: 2,
    name: 'Meta description',
    description: 'La meta description doit faire entre 150 et 160 caractères',
    type: 'metaDescription',
    minLength: 150,
    maxLength: 160,
    enabled: true
  },
  {
    id: 3,
    name: 'Mot-clé principal en gras',
    description: 'Le mot-clé principal doit être mis en gras au moins 2 fois',
    type: 'keywordBold',
    minOccurrences: 2,
    enabled: true
  },
  {
    id: 4,
    name: 'Nombre de mots',
    description: 'Le contenu doit contenir au moins 300 mots',
    type: 'wordCount',
    minWords: 300,
    enabled: true
  },
  {
    id: 5,
    name: 'Balises H1',
    description: 'Le contenu doit contenir exactement 1 balise H1',
    type: 'h1Count',
    exactCount: 1,
    enabled: true
  }
];

export const RulesProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [rules, setRules] = useState(defaultRules);
  const [loading, setLoading] = useState(false);

  // Load rules from API when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      loadRulesFromAPI();
    } else {
      setRules(defaultRules);
    }
  }, [user, isAuthenticated]);

  const loadRulesFromAPI = async () => {
    try {
      setLoading(true);
      const response = await rulesAPI.getAll();

      // If user has custom rules, use them; otherwise use defaults
      if (response.rules && response.rules.length > 0) {
        // Map API rules to frontend format
        const mappedRules = response.rules.map(rule => ({
          id: rule.rule_id,
          name: rule.rule_name,
          enabled: rule.enabled,
          // Map the specific rule properties based on rule_id
          ...(rule.rule_id === 'title' && { maxLength: rule.max_value }),
          ...(rule.rule_id === 'metaDescription' && {
            minLength: rule.min_value,
            maxLength: rule.max_value
          }),
          ...(rule.rule_id === 'keywordBold' && { minOccurrences: rule.min_value }),
          ...(rule.rule_id === 'wordCount' && { minWords: rule.min_value }),
          ...(rule.rule_id === 'h1Count' && { exactCount: rule.max_value }),
        }));

        // Merge with default rules to ensure all rules exist
        const mergedRules = defaultRules.map(defaultRule => {
          const customRule = mappedRules.find(r => r.id === defaultRule.type);
          return customRule ? { ...defaultRule, ...customRule } : defaultRule;
        });

        setRules(mergedRules);
      } else {
        setRules(defaultRules);
      }
    } catch (error) {
      console.error('Failed to load rules:', error);
      setRules(defaultRules);
    } finally {
      setLoading(false);
    }
  };

  const addRule = async (rule) => {
    const newRule = {
      ...rule,
      id: Date.now(),
      enabled: true
    };
    setRules([...rules, newRule]);

    // Save to API if authenticated
    if (isAuthenticated) {
      await saveRulesToAPI([...rules, newRule]);
    }
  };

  const updateRule = async (id, updatedRule) => {
    const updatedRules = rules.map(rule => rule.id === id ? { ...rule, ...updatedRule } : rule);
    setRules(updatedRules);

    // Save to API if authenticated
    if (isAuthenticated) {
      await saveRulesToAPI(updatedRules);
    }
  };

  const deleteRule = async (id) => {
    const filteredRules = rules.filter(rule => rule.id !== id);
    setRules(filteredRules);

    // Save to API if authenticated
    if (isAuthenticated) {
      await saveRulesToAPI(filteredRules);
    }
  };

  const toggleRule = async (id) => {
    const updatedRules = rules.map(rule =>
      rule.id === id ? { ...rule, enabled: !rule.enabled } : rule
    );
    setRules(updatedRules);

    // Save to API if authenticated
    if (isAuthenticated) {
      await saveRulesToAPI(updatedRules);
    }
  };

  const saveRulesToAPI = async (rulesToSave) => {
    try {
      // Transform rules to API format
      const apiRules = rulesToSave.map(rule => ({
        rule_id: rule.type,
        rule_name: rule.name,
        enabled: rule.enabled,
        min_value: rule.minLength || rule.minOccurrences || rule.minWords || null,
        max_value: rule.maxLength || rule.exactCount || null,
      }));

      await rulesAPI.batchUpdate(apiRules);
    } catch (error) {
      console.error('Failed to save rules:', error);
    }
  };

  const checkRules = (content, title, metaDescription, keyword) => {
    const results = [];

    rules.forEach(rule => {
      if (!rule.enabled) return;

      let isValid = true;
      let message = '';

      switch (rule.type) {
        case 'title':
          if (title && title.length > rule.maxLength) {
            isValid = false;
            message = `Le titre fait ${title.length} caractères (max: ${rule.maxLength})`;
          } else if (title) {
            message = `Le titre fait ${title.length} caractères`;
          }
          break;

        case 'metaDescription':
          if (metaDescription) {
            const length = metaDescription.length;
            if (length < rule.minLength || length > rule.maxLength) {
              isValid = false;
              message = `La meta description fait ${length} caractères (optimal: ${rule.minLength}-${rule.maxLength})`;
            } else {
              message = `La meta description fait ${length} caractères`;
            }
          }
          break;

        case 'keywordBold':
          if (keyword && content) {
            const boldPattern = new RegExp(`<b>${keyword}</b>|<strong>${keyword}</strong>|\\*\\*${keyword}\\*\\*`, 'gi');
            const matches = content.match(boldPattern);
            const count = matches ? matches.length : 0;
            if (count < rule.minOccurrences) {
              isValid = false;
              message = `Le mot-clé "${keyword}" est en gras ${count} fois (min: ${rule.minOccurrences})`;
            } else {
              message = `Le mot-clé "${keyword}" est en gras ${count} fois`;
            }
          }
          break;

        case 'wordCount':
          if (content) {
            const words = content.trim().split(/\s+/).filter(w => w.length > 0);
            const count = words.length;
            if (count < rule.minWords) {
              isValid = false;
              message = `Le contenu contient ${count} mots (min: ${rule.minWords})`;
            } else {
              message = `Le contenu contient ${count} mots`;
            }
          }
          break;

        case 'h1Count':
          if (content) {
            const h1Matches = content.match(/<h1>/gi);
            const count = h1Matches ? h1Matches.length : 0;
            if (count !== rule.exactCount) {
              isValid = false;
              message = `Le contenu contient ${count} balise(s) H1 (requis: ${rule.exactCount})`;
            } else {
              message = `Le contenu contient ${count} balise H1`;
            }
          }
          break;

        default:
          break;
      }

      if (message) {
        results.push({
          ruleId: rule.id,
          ruleName: rule.name,
          isValid,
          message
        });
      }
    });

    return results;
  };

  return (
    <RulesContext.Provider value={{
      rules,
      addRule,
      updateRule,
      deleteRule,
      toggleRule,
      checkRules,
      loading
    }}>
      {children}
    </RulesContext.Provider>
  );
};
