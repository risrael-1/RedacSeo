import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useArticles } from '../context/ArticlesContext';
import { useProjects } from '../context/ProjectsContext';
import { useSeoCriteria } from '../context/SeoCriteriaContext';
import Navbar from '../components/Navbar';
import './Redaction.css';

// Helper pour déterminer le niveau SEO
const getSEOScoreLevel = (score) => {
  if (score >= 80) return { level: 'Excellent', color: '#22c55e' };
  if (score >= 60) return { level: 'Bon', color: '#84cc16' };
  if (score >= 40) return { level: 'Moyen', color: '#eab308' };
  if (score >= 20) return { level: 'Faible', color: '#f97316' };
  return { level: 'Critique', color: '#ef4444' };
};

const Redaction = () => {
  const [title, setTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [keyword, setKeyword] = useState('');
  const [secondaryKeywords, setSecondaryKeywords] = useState([]);
  const [secondaryKeywordInput, setSecondaryKeywordInput] = useState('');
  const [content, setContent] = useState('');
  const [articleName, setArticleName] = useState('');
  const [projectId, setProjectId] = useState(null);
  const [showSavePopup, setShowSavePopup] = useState(false);
  const [showClearPopup, setShowClearPopup] = useState(false);
  const [articleNameError, setArticleNameError] = useState('');
  const [seoFieldsEnabled, setSeoFieldsEnabled] = useState(true);
  const { currentArticle, saveArticle, articles, loadArticle, deleteArticle, createNewArticle } = useArticles();
  const { projects } = useProjects();
  const { calculateScore, getAllCriteriaStatus } = useSeoCriteria();

  // Ref pour tracker si l'article a été modifié par l'utilisateur
  const hasUserModified = useRef(false);
  // Ref pour stocker l'ID de l'article en cours
  const currentArticleIdRef = useRef(null);

  // Charger l'article en cours
  useEffect(() => {
    if (currentArticle) {
      // Reset le flag de modification quand on charge un nouvel article
      hasUserModified.current = false;
      currentArticleIdRef.current = currentArticle.id;

      setTitle(currentArticle.title || '');
      setMetaDescription(currentArticle.metaDescription || '');
      setKeyword(currentArticle.keyword || '');
      setSecondaryKeywords(currentArticle.secondaryKeywords || []);
      setContent(currentArticle.content || '');
      setArticleName(currentArticle.articleName || '');
      setProjectId(currentArticle.projectId || null);
      setSeoFieldsEnabled(currentArticle.seoFieldsEnabled !== false); // true par défaut
    }
  }, [currentArticle]);

  // Marquer comme modifié quand l'utilisateur change quelque chose
  const markAsModified = useCallback(() => {
    hasUserModified.current = true;
  }, []);

  // Auto-save toutes les 30 secondes (utilise useCallback pour éviter stale closures)
  const performAutoSave = useCallback(() => {
    // Ne pas auto-sauvegarder si :
    // 1. L'utilisateur n'a pas modifié l'article
    // 2. Le nom de l'article est vide (obligatoire pour sauvegarder)
    // 3. Il n'y a pas de contenu substantiel
    if (!hasUserModified.current) {
      return;
    }

    if (!articleName || articleName.trim() === '') {
      return; // Ne pas sauvegarder sans nom d'article
    }

    if (!content && !title && !keyword) {
      return; // Ne pas sauvegarder si tout est vide
    }

    const wordCount = content.trim().split(/\s+/).filter(w => w.length > 0).length;
    // Le score est calculé en fonction de seoFieldsEnabled (ignore titre/meta si désactivé)
    const seoResult = calculateScore(content, title, metaDescription, keyword, seoFieldsEnabled);

    saveArticle({
      projectId: projectId || null,
      articleName: articleName.trim(),
      title,
      metaDescription,
      keyword,
      secondaryKeywords,
      content,
      wordCount,
      seoScore: seoResult.score,
      seoFieldsEnabled,
      status: 'En cours',
    });
  }, [articleName, title, metaDescription, keyword, secondaryKeywords, content, projectId, seoFieldsEnabled, saveArticle, calculateScore]);

  useEffect(() => {
    const interval = setInterval(() => {
      performAutoSave();
    }, 30000);

    return () => clearInterval(interval);
  }, [performAutoSave]);

  const handleSave = (showAlert = true) => {
    // Validation du nom de l'article
    if (!articleName || articleName.trim() === '') {
      setArticleNameError('Le nom de l\'article est obligatoire');
      if (showAlert) {
        alert('⚠️ Le nom de l\'article est obligatoire pour sauvegarder');
      }
      return;
    }

    setArticleNameError('');
    const wordCount = content.trim().split(/\s+/).filter(w => w.length > 0).length;
    // Le score est calculé en fonction de seoFieldsEnabled (ignore titre/meta si désactivé)
    const seoResult = calculateScore(content, title, metaDescription, keyword, seoFieldsEnabled);

    const article = saveArticle({
      projectId: projectId || null,
      articleName: articleName.trim(),
      title,
      metaDescription,
      keyword,
      secondaryKeywords,
      content,
      wordCount,
      seoScore: seoResult.score,
      seoFieldsEnabled,
      status: 'En cours',
    });

    if (article) {
      // Reset le flag de modification après une sauvegarde réussie
      hasUserModified.current = false;

      if (showAlert) {
        setShowSavePopup(true);
        setTimeout(() => {
          setShowSavePopup(false);
        }, 3000);
      }
    }
  };

  const handleClearContent = () => {
    setShowClearPopup(true);
  };

  const confirmClearContent = () => {
    setContent('');
    setShowClearPopup(false);
    markAsModified();
  };

  const cancelClearContent = () => {
    setShowClearPopup(false);
  };

  const addSecondaryKeyword = () => {
    if (secondaryKeywordInput.trim() && !secondaryKeywords.includes(secondaryKeywordInput.trim())) {
      setSecondaryKeywords([...secondaryKeywords, secondaryKeywordInput.trim()]);
      setSecondaryKeywordInput('');
      markAsModified();
    }
  };

  const removeSecondaryKeyword = (keyword) => {
    setSecondaryKeywords(secondaryKeywords.filter(k => k !== keyword));
    markAsModified();
  };

  const applyKeywordBold = (text, primaryKeyword, secondaryKeywordsArray) => {
    if (!text) return text;

    let processedText = text;

    // Créer un tableau de tous les mots-clés
    const allKeywords = [];

    if (primaryKeyword && primaryKeyword.trim()) {
      allKeywords.push(primaryKeyword.trim());
    }

    if (secondaryKeywordsArray && secondaryKeywordsArray.length > 0) {
      secondaryKeywordsArray.forEach(kw => {
        if (kw && kw.trim()) {
          allKeywords.push(kw.trim());
        }
      });
    }

    // Trier les mots-clés par longueur décroissante (les plus longs en premier)
    // Cela permet d'appliquer d'abord les expressions longues comme "hôtel en Bretagne bord de mer"
    // avant les expressions courtes comme "hôtel en Bretagne"
    allKeywords.sort((a, b) => b.length - a.length);

    // Appliquer le gras aux mots-clés du plus long au plus court
    allKeywords.forEach(kw => {
      const escapedKeyword = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // Cette regex cherche le mot-clé qui n'est pas déjà dans une balise
      const regex = new RegExp(`\\b(${escapedKeyword})\\b(?![^<]*>|[^<>]*<\/)`, 'gi');
      processedText = processedText.replace(regex, '<strong>$1</strong>');
    });

    return processedText;
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');

    const textarea = document.getElementById('content-editor');
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newContent = content.substring(0, start) + pastedText + content.substring(end);
    setContent(newContent);
    markAsModified();
  };

  const applyBoldToExistingContent = () => {
    if (!keyword && secondaryKeywords.length === 0) {
      alert('Veuillez entrer au moins un mot-clé avant d\'appliquer le formatage');
      return;
    }
    const processedContent = applyKeywordBold(content, keyword, secondaryKeywords);
    setContent(processedContent);
    markAsModified();
  };


  const insertTag = (tag) => {
    const textarea = document.getElementById('content-editor');
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);

    let newText = '';
    if (tag === 'bold') {
      newText = content.substring(0, start) + `<strong>${selectedText}</strong>` + content.substring(end);
    } else if (tag === 'h1') {
      newText = content.substring(0, start) + `<h1>${selectedText}</h1>` + content.substring(end);
    } else if (tag === 'h2') {
      newText = content.substring(0, start) + `<h2>${selectedText}</h2>` + content.substring(end);
    } else if (tag === 'h3') {
      newText = content.substring(0, start) + `<h3>${selectedText}</h3>` + content.substring(end);
    }

    setContent(newText);
    markAsModified();
  };

  const getWordCount = () => {
    if (!content) return 0;
    return content.trim().split(/\s+/).filter(w => w.length > 0).length;
  };

  // Calcul en temps réel du score et des critères SEO
  const seoAnalysis = useMemo(() => {
    // Le paramètre seoFieldsEnabled est passé pour exclure les critères titre/meta si désactivé
    const result = calculateScore(content, title, metaDescription, keyword, seoFieldsEnabled);
    const criteria = getAllCriteriaStatus(content, title, metaDescription, keyword, seoFieldsEnabled);
    const level = getSEOScoreLevel(result.score);
    const validCount = criteria.filter(c => c.isValid).length;
    return {
      score: result.score,
      criteria,
      level,
      validCount,
      totalCount: criteria.length,
      totalPoints: result.totalPoints,
      maxPoints: result.maxPoints
    };
  }, [content, title, metaDescription, keyword, seoFieldsEnabled, calculateScore, getAllCriteriaStatus]);

  return (
    <div className="redaction-container">
      <Navbar />
      <main className="redaction-main">
        <div className="redaction-header">
          <h2>Rédaction SEO</h2>
          <div className="header-buttons">
            <button onClick={() => handleSave(true)} className="save-button">
              Sauvegarder
            </button>
          </div>
        </div>

        {showSavePopup && (
          <div className="save-popup">
            <div className="save-popup-content">
              <div className="save-popup-icon">✓</div>
              <h3>Article sauvegardé !</h3>
              <p>Vos modifications ont été enregistrées avec succès</p>
            </div>
          </div>
        )}

        {showClearPopup && (
          <div className="clear-popup-overlay">
            <div className="clear-popup-content">
              <div className="clear-popup-icon">⚠️</div>
              <h3>Effacer le contenu ?</h3>
              <p>Êtes-vous sûr de vouloir effacer le contenu de l'article ? Cette action est irréversible.</p>
              <div className="clear-popup-buttons">
                <button onClick={cancelClearContent} className="cancel-button">
                  Annuler
                </button>
                <button onClick={confirmClearContent} className="confirm-button">
                  Effacer
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="redaction-grid">
          <div className="editor-section">
            <div className="form-group">
              <label htmlFor="articleName">
                Nom de l'article <span className="required-field">*</span>
              </label>
              <input
                type="text"
                id="articleName"
                value={articleName}
                onChange={(e) => {
                  setArticleName(e.target.value);
                  markAsModified();
                  if (e.target.value.trim()) {
                    setArticleNameError('');
                  }
                }}
                placeholder="Donnez un nom à votre article (obligatoire)"
                className={articleNameError ? 'input-error' : ''}
                required
              />
              {articleNameError && (
                <span className="field-error">{articleNameError}</span>
              )}
            </div>

            {projects.length > 0 && (
              <div className="form-group">
                <label htmlFor="projectSelect">Projet associé</label>
                <select
                  id="projectSelect"
                  value={projectId || ''}
                  onChange={(e) => { setProjectId(e.target.value || null); markAsModified(); }}
                  className="project-select-field"
                >
                  <option value="">Aucun projet</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="keywords-section">
              <div className="keywords-grid">
                <div className="form-group">
                  <label htmlFor="keyword">Mot-clé principal</label>
                  <input
                    type="text"
                    id="keyword"
                    value={keyword}
                    onChange={(e) => { setKeyword(e.target.value); markAsModified(); }}
                    placeholder="Ex: rédaction SEO"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="secondaryKeywordInput">Mots-clés secondaires</label>
                  <div className="keyword-input-group">
                    <input
                      type="text"
                      id="secondaryKeywordInput"
                      value={secondaryKeywordInput}
                      onChange={(e) => { setSecondaryKeywordInput(e.target.value); markAsModified(); }}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSecondaryKeyword())}
                      placeholder="Ex: optimisation contenu"
                    />
                    <button onClick={addSecondaryKeyword} className="add-keyword-btn">+</button>
                  </div>
                </div>
              </div>

              {secondaryKeywords.length > 0 && (
                <div className="keywords-tags">
                  {secondaryKeywords.map((kw, index) => (
                    <span key={index} className="keyword-tag">
                      {kw}
                      <button onClick={() => removeSecondaryKeyword(kw)} className="remove-tag">×</button>
                    </span>
                  ))}
                </div>
              )}

              <button onClick={applyBoldToExistingContent} className="apply-bold-button">
                Appliquer le gras aux mots-clés
              </button>
            </div>

            {/* Bloc Titre SEO et Meta Description (activable/désactivable) */}
            <div className="seo-fields-section">
              <div className="seo-fields-header">
                <h3>Titre SEO & Meta Description</h3>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={seoFieldsEnabled}
                    onChange={(e) => { setSeoFieldsEnabled(e.target.checked); markAsModified(); }}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              {seoFieldsEnabled && (
                <>
                  <div className="form-group">
                    <div className="suggestion-group-header">
                      <label htmlFor="title">Titre SEO</label>
                      <span className="char-count-inline">{title.length}/65 car.</span>
                    </div>
                    <input
                      type="text"
                      id="title"
                      value={title}
                      onChange={(e) => { setTitle(e.target.value); markAsModified(); }}
                      placeholder="Entrez votre titre SEO"
                      maxLength="70"
                    />
                  </div>
                  <div className="form-group">
                    <div className="suggestion-group-header">
                      <label htmlFor="metaDescription">Meta description</label>
                      <span className="char-count-inline">{metaDescription.length}/160 car.</span>
                    </div>
                    <textarea
                      id="metaDescription"
                      value={metaDescription}
                      onChange={(e) => { setMetaDescription(e.target.value); markAsModified(); }}
                      placeholder="Entrez votre meta description"
                      rows="2"
                      maxLength="170"
                    />
                  </div>
                </>
              )}

              {!seoFieldsEnabled && (
                <p className="seo-fields-disabled-note">
                  Les champs titre SEO et meta description sont désactivés. Le score SEO ne prendra pas en compte ces critères.
                </p>
              )}
            </div>

            <div className="editor-toolbar">
              <button onClick={() => insertTag('bold')} className="toolbar-btn" title="Gras">
                <strong>G</strong>
              </button>
              <button onClick={() => insertTag('h1')} className="toolbar-btn" title="Titre H1">
                H1
              </button>
              <button onClick={() => insertTag('h2')} className="toolbar-btn" title="Titre H2">
                H2
              </button>
              <button onClick={() => insertTag('h3')} className="toolbar-btn" title="Titre H3">
                H3
              </button>
            </div>

            <div className="form-group">
              <div className="content-label-wrapper">
                <label htmlFor="content-editor">Contenu de l'article</label>
                <button onClick={handleClearContent} className="clear-icon-button" title="Effacer le contenu">
                  🗑️
                </button>
              </div>
              <div className="content-info">
                Collez votre article ici. Les mots-clés seront automatiquement mis en gras.
              </div>
              <textarea
                id="content-editor"
                value={content}
                onChange={(e) => { setContent(e.target.value); markAsModified(); }}
                onPaste={handlePaste}
                placeholder="Collez ou rédigez votre contenu ici..."
                rows="20"
              />
              <span className="char-count">{getWordCount()} mots</span>
            </div>
          </div>

          <div className="results-section">
            {/* Panneau Score SEO en temps réel */}
            <div className="seo-realtime-panel">
              <div className="seo-score-header">
                <h3>Score SEO</h3>
                <div className="seo-score-display" style={{ backgroundColor: seoAnalysis.level.color }}>
                  {seoAnalysis.score}/100
                </div>
              </div>
              <div className="seo-score-level" style={{ color: seoAnalysis.level.color }}>
                {seoAnalysis.level.level}
              </div>
              <div className="seo-criteria-progress">
                <span>{seoAnalysis.validCount}/{seoAnalysis.totalCount} critères respectés</span>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${(seoAnalysis.validCount / seoAnalysis.totalCount) * 100}%`,
                      backgroundColor: seoAnalysis.level.color
                    }}
                  ></div>
                </div>
              </div>
              <div className="seo-criteria-list-realtime">
                {seoAnalysis.criteria.map(criterion => (
                  <div
                    key={criterion.criterion_id}
                    className={`seo-criterion-item ${criterion.isValid ? 'valid' : 'invalid'}`}
                  >
                    <span className="criterion-status">
                      {criterion.isValid ? '✓' : '✗'}
                    </span>
                    <span className="criterion-icon">{criterion.icon}</span>
                    <div className="criterion-info">
                      <span className="criterion-label">{criterion.label}</span>
                      <span className="criterion-detail">{criterion.detail}</span>
                    </div>
                    <span className="criterion-points">{criterion.points}/{criterion.max_points}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="saved-articles">
              <h3>Articles sauvegardés</h3>
              <button onClick={createNewArticle} className="new-article-btn">+ Nouvel article</button>
              {articles.length === 0 ? (
                <p className="no-articles">Aucun article sauvegardé</p>
              ) : (
                <div className="articles-list-sidebar">
                  {articles.map((article) => (
                    <div
                      key={article.id}
                      className={`article-item ${currentArticle?.id === article.id ? 'active' : ''}`}
                    >
                      <div onClick={() => loadArticle(article.id)} className="article-info">
                        <h4>{article.article_name || article.articleName || 'Sans nom'}</h4>
                        <p>{article.word_count || article.wordCount || 0} mots</p>
                        <span className="article-date">
                          {article.updated_at || article.lastModified
                            ? new Date(article.updated_at || article.lastModified).toLocaleDateString()
                            : 'Date inconnue'}
                        </span>
                      </div>
                      <button
                        onClick={() => deleteArticle(article.id)}
                        className="delete-article-btn"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default Redaction;
