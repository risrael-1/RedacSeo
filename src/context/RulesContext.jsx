import { createContext, useContext, useState, useEffect } from 'react';

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
  const [rules, setRules] = useState(() => {
    const savedRules = localStorage.getItem('seoRules');
    return savedRules ? JSON.parse(savedRules) : defaultRules;
  });

  useEffect(() => {
    localStorage.setItem('seoRules', JSON.stringify(rules));
  }, [rules]);

  const addRule = (rule) => {
    const newRule = {
      ...rule,
      id: Date.now(),
      enabled: true
    };
    setRules([...rules, newRule]);
  };

  const updateRule = (id, updatedRule) => {
    setRules(rules.map(rule => rule.id === id ? { ...rule, ...updatedRule } : rule));
  };

  const deleteRule = (id) => {
    setRules(rules.filter(rule => rule.id !== id));
  };

  const toggleRule = (id) => {
    setRules(rules.map(rule =>
      rule.id === id ? { ...rule, enabled: !rule.enabled } : rule
    ));
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
      checkRules
    }}>
      {children}
    </RulesContext.Provider>
  );
};
