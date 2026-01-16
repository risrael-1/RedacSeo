/**
 * Calcule le score SEO d'un article basé sur différents critères
 * @param {string} content - Le contenu de l'article
 * @param {string} title - Le titre de l'article
 * @param {string} metaDescription - La meta description
 * @param {string} keyword - Le mot-clé principal
 * @returns {number} Score SEO sur 100
 */
export const calculateSEOScore = (content, title, metaDescription, keyword) => {
  let score = 0;
  const maxScore = 100;

  // Si pas de contenu, retourner 0
  if (!content || !content.trim()) {
    return 0;
  }

  // 1. Longueur du contenu (15 points)
  const wordCount = content.trim().split(/\s+/).filter(w => w.length > 0).length;
  if (wordCount >= 800) score += 15;
  else if (wordCount >= 500) score += 13;
  else if (wordCount >= 300) score += 11;
  else if (wordCount >= 150) score += 8;
  else if (wordCount >= 50) score += 5;
  else if (wordCount > 0) score += 2;

  // 2. Présence du mot-clé dans le titre (12 points)
  if (keyword && title) {
    const titleLower = title.toLowerCase();
    const keywordLower = keyword.toLowerCase();
    if (titleLower.includes(keywordLower)) {
      // Bonus si le mot-clé est au début du titre
      if (titleLower.indexOf(keywordLower) === 0) {
        score += 12;
      } else if (titleLower.indexOf(keywordLower) <= 10) {
        score += 10;
      } else {
        score += 8;
      }
    }
  }

  // 3. Présence du mot-clé dans la meta description (8 points)
  if (keyword && metaDescription && metaDescription.toLowerCase().includes(keyword.toLowerCase())) {
    score += 8;
  }

  // 4. Longueur de la meta description (8 points)
  if (metaDescription) {
    const metaLength = metaDescription.length;
    if (metaLength >= 120 && metaLength <= 160) {
      score += 8;
    } else if (metaLength >= 100 && metaLength < 120) {
      score += 6;
    } else if (metaLength >= 50 && metaLength < 100) {
      score += 4;
    } else if (metaLength > 0) {
      score += 2;
    }
  }

  // 5. Densité du mot-clé dans le contenu (12 points)
  if (keyword && content && wordCount > 0) {
    const contentLower = content.toLowerCase();
    const keywordLower = keyword.toLowerCase();
    const keywordRegex = new RegExp(`\\b${keywordLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    const matches = contentLower.match(keywordRegex);
    const keywordCount = matches ? matches.length : 0;
    const density = (keywordCount / wordCount) * 100;

    if (density >= 1 && density <= 2.5) {
      score += 12;
    } else if (density >= 0.5 && density < 1) {
      score += 10;
    } else if (density > 2.5 && density <= 4) {
      score += 7;
    } else if (density > 0 && density < 0.5) {
      score += 5;
    }
  }

  // 6. Structure du contenu - Balises H1 (10 points)
  const h1Count = (content.match(/<h1[^>]*>/gi) || []).length;
  if (h1Count === 1) {
    score += 10;
    // Bonus si le H1 contient le mot-clé
    if (keyword) {
      const h1Matches = content.match(/<h1[^>]*>(.*?)<\/h1>/gi);
      if (h1Matches && h1Matches[0] && h1Matches[0].toLowerCase().includes(keyword.toLowerCase())) {
        score += 3; // Bonus
      }
    }
  } else if (h1Count > 1) {
    score += 5; // Pénalité pour plusieurs H1
  } else if (h1Count === 0) {
    score += 0; // Pas de H1 = pas de points
  }

  // 7. Structure du contenu - Balises H2/H3 (10 points)
  const h2Count = (content.match(/<h2[^>]*>/gi) || []).length;
  const h3Count = (content.match(/<h3[^>]*>/gi) || []).length;
  if (h2Count >= 3) {
    score += 6;
  } else if (h2Count >= 2) {
    score += 5;
  } else if (h2Count >= 1) {
    score += 3;
  }
  if (h3Count >= 2) {
    score += 4;
  } else if (h3Count >= 1) {
    score += 3;
  }

  // 8. Présence de contenu en gras (5 points)
  const strongCount = (content.match(/<strong[^>]*>/gi) || []).length;
  if (strongCount >= 5) {
    score += 5;
  } else if (strongCount >= 3) {
    score += 4;
  } else if (strongCount >= 1) {
    score += 2;
  }

  // 9. Longueur du titre (5 points)
  if (title) {
    const titleLength = title.length;
    if (titleLength >= 30 && titleLength <= 60) {
      score += 5;
    } else if (titleLength >= 20 && titleLength < 30) {
      score += 3;
    } else if (titleLength > 60 && titleLength <= 70) {
      score += 3;
    } else if (titleLength > 0) {
      score += 1;
    }
  }

  // 10. Mot-clé dans les premiers 100 mots (5 points)
  if (keyword && content) {
    const first100Words = content.trim().split(/\s+/).slice(0, 100).join(' ');
    if (first100Words.toLowerCase().includes(keyword.toLowerCase())) {
      score += 5;
    }
  }

  // 11. Présence d'un titre (bonus si fourni) (5 points)
  if (title && title.trim().length > 0) {
    score += 5;
  }

  // 12. Présence d'une meta description (bonus si fourni) (2 points)
  if (metaDescription && metaDescription.trim().length > 0) {
    score += 2;
  }

  // S'assurer que le score ne dépasse pas 100
  return Math.min(score, maxScore);
};

/**
 * Retourne une évaluation textuelle du score SEO
 * @param {number} score - Le score SEO
 * @returns {object} Objet contenant le niveau et la couleur
 */
export const getSEOScoreLevel = (score) => {
  if (score >= 80) {
    return { level: 'Excellent', color: '#28a745' };
  } else if (score >= 70) {
    return { level: 'Bon', color: '#5cb85c' };
  } else if (score >= 50) {
    return { level: 'Moyen', color: '#ffc107' };
  } else if (score >= 30) {
    return { level: 'Faible', color: '#ff9800' };
  } else {
    return { level: 'Très faible', color: '#f44336' };
  }
};

/**
 * Retourne la liste des critères SEO non respectés pour un article
 * @param {string} content - Le contenu de l'article
 * @param {string} title - Le titre de l'article
 * @param {string} metaDescription - La meta description
 * @param {string} keyword - Le mot-clé principal
 * @returns {Array} Liste des critères non respectés avec leur description
 */
export const getUnmetSEOCriteria = (content, title, metaDescription, keyword) => {
  const unmetCriteria = [];

  // Si pas de contenu
  if (!content || !content.trim()) {
    return [{ id: 'no-content', label: 'Aucun contenu', icon: '📝' }];
  }

  const wordCount = content.trim().split(/\s+/).filter(w => w.length > 0).length;

  // 1. Longueur du contenu
  if (wordCount < 300) {
    unmetCriteria.push({
      id: 'content-length',
      label: `Contenu trop court (${wordCount}/${300} mots min)`,
      icon: '📝'
    });
  }

  // 2. Mot-clé dans le titre
  if (!keyword || !title || !title.toLowerCase().includes(keyword.toLowerCase())) {
    unmetCriteria.push({
      id: 'keyword-title',
      label: 'Mot-clé absent du titre',
      icon: '🎯'
    });
  }

  // 3. Mot-clé dans la meta description
  if (!keyword || !metaDescription || !metaDescription.toLowerCase().includes(keyword.toLowerCase())) {
    unmetCriteria.push({
      id: 'keyword-meta',
      label: 'Mot-clé absent de la meta',
      icon: '📄'
    });
  }

  // 4. Longueur de la meta description
  if (!metaDescription || metaDescription.length < 120 || metaDescription.length > 160) {
    const len = metaDescription ? metaDescription.length : 0;
    unmetCriteria.push({
      id: 'meta-length',
      label: `Meta description ${len < 120 ? 'trop courte' : len > 160 ? 'trop longue' : 'manquante'} (${len}/120-160)`,
      icon: '📄'
    });
  }

  // 5. Densité du mot-clé
  if (keyword && content && wordCount > 0) {
    const contentLower = content.toLowerCase();
    const keywordLower = keyword.toLowerCase();
    const keywordRegex = new RegExp(`\\b${keywordLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    const matches = contentLower.match(keywordRegex);
    const keywordCount = matches ? matches.length : 0;
    const density = (keywordCount / wordCount) * 100;

    if (density < 1 || density > 2.5) {
      unmetCriteria.push({
        id: 'keyword-density',
        label: `Densité mot-clé: ${density.toFixed(1)}% (idéal: 1-2.5%)`,
        icon: '💎'
      });
    }
  }

  // 6. Structure H1
  const h1Count = (content.match(/<h1[^>]*>/gi) || []).length;
  if (h1Count !== 1) {
    unmetCriteria.push({
      id: 'h1-structure',
      label: h1Count === 0 ? 'Aucun H1 trouvé' : `${h1Count} H1 (1 seul recommandé)`,
      icon: '🏷️'
    });
  }

  // 7. Structure H2/H3
  const h2Count = (content.match(/<h2[^>]*>/gi) || []).length;
  const h3Count = (content.match(/<h3[^>]*>/gi) || []).length;
  if (h2Count < 2) {
    unmetCriteria.push({
      id: 'h2-structure',
      label: `Seulement ${h2Count} H2 (min 2 recommandé)`,
      icon: '📋'
    });
  }

  // 8. Contenu en gras
  const strongCount = (content.match(/<strong[^>]*>/gi) || []).length;
  if (strongCount < 3) {
    unmetCriteria.push({
      id: 'strong-tags',
      label: `Peu de mise en gras (${strongCount} balises)`,
      icon: '💪'
    });
  }

  // 9. Longueur du titre
  if (!title || title.length < 30 || title.length > 60) {
    const len = title ? title.length : 0;
    unmetCriteria.push({
      id: 'title-length',
      label: `Titre ${len < 30 ? 'trop court' : len > 60 ? 'trop long' : 'manquant'} (${len}/30-60)`,
      icon: '📌'
    });
  }

  // 10. Mot-clé dans les premiers 100 mots
  if (keyword && content) {
    const first100Words = content.trim().split(/\s+/).slice(0, 100).join(' ');
    if (!first100Words.toLowerCase().includes(keyword.toLowerCase())) {
      unmetCriteria.push({
        id: 'keyword-intro',
        label: 'Mot-clé absent du début',
        icon: '⚡'
      });
    }
  }

  return unmetCriteria;
};

/**
 * Retourne le statut de tous les critères SEO (respectés et non respectés)
 * @param {string} content - Le contenu de l'article
 * @param {string} title - Le titre de l'article
 * @param {string} metaDescription - La meta description
 * @param {string} keyword - Le mot-clé principal
 * @returns {Array} Liste de tous les critères avec leur statut
 */
export const getAllSEOCriteriaStatus = (content, title, metaDescription, keyword) => {
  const criteria = [];

  // Si pas de contenu
  if (!content || !content.trim()) {
    return [
      { id: 'content-length', label: 'Longueur du contenu (300+ mots)', icon: '📝', isValid: false, detail: '0 mots' },
      { id: 'keyword-title', label: 'Mot-clé dans le titre', icon: '🎯', isValid: false, detail: 'Aucun contenu' },
      { id: 'keyword-meta', label: 'Mot-clé dans la meta', icon: '📄', isValid: false, detail: 'Aucun contenu' },
      { id: 'meta-length', label: 'Meta description (120-160 car.)', icon: '📄', isValid: false, detail: '0 caractères' },
      { id: 'keyword-density', label: 'Densité mot-clé (1-2.5%)', icon: '💎', isValid: false, detail: 'Aucun contenu' },
      { id: 'h1-structure', label: 'Structure H1 (1 seul)', icon: '🏷️', isValid: false, detail: 'Aucun H1' },
      { id: 'h2-structure', label: 'Structure H2 (2+ recommandé)', icon: '📋', isValid: false, detail: '0 H2' },
      { id: 'strong-tags', label: 'Mise en gras (3+ balises)', icon: '💪', isValid: false, detail: '0 balises' },
      { id: 'title-length', label: 'Longueur titre (30-60 car.)', icon: '📌', isValid: false, detail: '0 caractères' },
      { id: 'keyword-intro', label: 'Mot-clé dans les 100 premiers mots', icon: '⚡', isValid: false, detail: 'Aucun contenu' }
    ];
  }

  const wordCount = content.trim().split(/\s+/).filter(w => w.length > 0).length;

  // 1. Longueur du contenu
  criteria.push({
    id: 'content-length',
    label: 'Longueur du contenu (300+ mots)',
    icon: '📝',
    isValid: wordCount >= 300,
    detail: `${wordCount} mots`
  });

  // 2. Mot-clé dans le titre
  const hasKeywordInTitle = keyword && title && title.toLowerCase().includes(keyword.toLowerCase());
  criteria.push({
    id: 'keyword-title',
    label: 'Mot-clé dans le titre',
    icon: '🎯',
    isValid: hasKeywordInTitle,
    detail: hasKeywordInTitle ? 'Présent' : 'Absent'
  });

  // 3. Mot-clé dans la meta description
  const hasKeywordInMeta = keyword && metaDescription && metaDescription.toLowerCase().includes(keyword.toLowerCase());
  criteria.push({
    id: 'keyword-meta',
    label: 'Mot-clé dans la meta',
    icon: '📄',
    isValid: hasKeywordInMeta,
    detail: hasKeywordInMeta ? 'Présent' : 'Absent'
  });

  // 4. Longueur de la meta description
  const metaLen = metaDescription ? metaDescription.length : 0;
  const isMetaLengthValid = metaLen >= 120 && metaLen <= 160;
  criteria.push({
    id: 'meta-length',
    label: 'Meta description (120-160 car.)',
    icon: '📄',
    isValid: isMetaLengthValid,
    detail: `${metaLen} caractères`
  });

  // 5. Densité du mot-clé
  let density = 0;
  let keywordCount = 0;
  if (keyword && content && wordCount > 0) {
    const contentLower = content.toLowerCase();
    const keywordLower = keyword.toLowerCase();
    const keywordRegex = new RegExp(`\\b${keywordLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    const matches = contentLower.match(keywordRegex);
    keywordCount = matches ? matches.length : 0;
    density = (keywordCount / wordCount) * 100;
  }
  const isDensityValid = density >= 1 && density <= 2.5;
  criteria.push({
    id: 'keyword-density',
    label: 'Densité mot-clé (1-2.5%)',
    icon: '💎',
    isValid: isDensityValid,
    detail: `${density.toFixed(1)}% (${keywordCount} fois)`
  });

  // 6. Structure H1
  const h1Count = (content.match(/<h1[^>]*>/gi) || []).length;
  criteria.push({
    id: 'h1-structure',
    label: 'Structure H1 (1 seul)',
    icon: '🏷️',
    isValid: h1Count === 1,
    detail: `${h1Count} H1`
  });

  // 7. Structure H2
  const h2Count = (content.match(/<h2[^>]*>/gi) || []).length;
  criteria.push({
    id: 'h2-structure',
    label: 'Structure H2 (2+ recommandé)',
    icon: '📋',
    isValid: h2Count >= 2,
    detail: `${h2Count} H2`
  });

  // 8. Contenu en gras
  const strongCount = (content.match(/<strong[^>]*>/gi) || []).length;
  criteria.push({
    id: 'strong-tags',
    label: 'Mise en gras (3+ balises)',
    icon: '💪',
    isValid: strongCount >= 3,
    detail: `${strongCount} balises`
  });

  // 9. Longueur du titre
  const titleLen = title ? title.length : 0;
  const isTitleLengthValid = titleLen >= 30 && titleLen <= 60;
  criteria.push({
    id: 'title-length',
    label: 'Longueur titre (30-60 car.)',
    icon: '📌',
    isValid: isTitleLengthValid,
    detail: `${titleLen} caractères`
  });

  // 10. Mot-clé dans les premiers 100 mots
  let hasKeywordInIntro = false;
  if (keyword && content) {
    const first100Words = content.trim().split(/\s+/).slice(0, 100).join(' ');
    hasKeywordInIntro = first100Words.toLowerCase().includes(keyword.toLowerCase());
  }
  criteria.push({
    id: 'keyword-intro',
    label: 'Mot-clé dans les 100 premiers mots',
    icon: '⚡',
    isValid: hasKeywordInIntro,
    detail: hasKeywordInIntro ? 'Présent' : 'Absent'
  });

  return criteria;
};
