import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useArticles } from '../context/ArticlesContext';
import { useProjects } from '../context/ProjectsContext';
import { useSeoCriteria } from '../context/SeoCriteriaContext';
import { useUnsavedChanges } from '../context/UnsavedChangesContext';
import Navbar from '../components/Navbar';
import { SeoScorePanel, ArticlesSidebar, KeywordsSection, SeoFieldsSection, ContentEditor, ProjectSelect } from '../components/redaction';
import { ConfirmPopup, SavePopup } from '../components/common';
import { applyKeywordBold, cleanPastedHtml, convertPlainTextToHtml, getSEOScoreLevel, generateFaqSchema } from '../utils/htmlUtils';
import './Redaction.css';

const Redaction = () => {
  const [title, setTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [keyword, setKeyword] = useState('');
  const [secondaryKeywords, setSecondaryKeywords] = useState([]);
  const [secondaryKeywordInput, setSecondaryKeywordInput] = useState('');
  const [content, setContent] = useState('');
  const [articleName, setArticleName] = useState('');
  const [projectId, setProjectId] = useState(null);
  const [projectSearchQuery, setProjectSearchQuery] = useState('');
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [showSavePopup, setShowSavePopup] = useState(false);
  const [showClearPopup, setShowClearPopup] = useState(false);
  const [articleNameError, setArticleNameError] = useState('');
  const [seoFieldsEnabled, setSeoFieldsEnabled] = useState(true);
  const [copiedField, setCopiedField] = useState(null);
  const [showHtmlPreview, setShowHtmlPreview] = useState(false);
  const [faqSchemaError, setFaqSchemaError] = useState(null);
  const [faqSchemaPopup, setFaqSchemaPopup] = useState(null);
  const [unsavedChangesPopup, setUnsavedChangesPopup] = useState(null);

  const { currentArticle, saveArticle, articles, loadArticle, deleteArticle, createNewArticle } = useArticles();
  const { projects } = useProjects();
  const { calculateScore, getAllCriteriaStatus } = useSeoCriteria();
  const { markAsUnsaved, markAsSaved, registerSaveCallback } = useUnsavedChanges();

  const hasUserModified = useRef(false);
  const currentArticleIdRef = useRef(null);

  // Initialiser avec un éditeur vide au montage seulement si aucun article n'est sélectionné
  useEffect(() => {
    if (!currentArticle) {
      createNewArticle();
    }
  }, []);

  // Charger l'article en cours
  useEffect(() => {
    if (currentArticle) {
      if (currentArticleIdRef.current !== currentArticle.id) {
        hasUserModified.current = false;
        currentArticleIdRef.current = currentArticle.id;

        setTitle(currentArticle.title || '');
        setMetaDescription(currentArticle.metaDescription || '');
        setKeyword(currentArticle.keyword || '');
        setSecondaryKeywords(currentArticle.secondaryKeywords || []);
        setContent(currentArticle.content || '');
        setArticleName(currentArticle.articleName || '');
        setProjectId(currentArticle.projectId || null);
        setSeoFieldsEnabled(currentArticle.seoFieldsEnabled !== false);
      }
    }
  }, [currentArticle]);

  const markAsModified = useCallback(() => {
    hasUserModified.current = true;
    markAsUnsaved(); // Notifier le contexte global
  }, [markAsUnsaved]);

  // Auto-save toutes les 30 secondes
  const performAutoSave = useCallback(() => {
    if (!hasUserModified.current) return;
    if (!articleName || articleName.trim() === '') return;
    if (!content && !title && !keyword) return;

    const wordCount = content.trim().split(/\s+/).filter(w => w.length > 0).length;
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

  // Protection contre la perte de données (fermeture onglet/navigateur)
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUserModified.current) {
        e.preventDefault();
        e.returnValue = 'Vous avez des modifications non sauvegardées. Êtes-vous sûr de vouloir quitter ?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Enregistrer la fonction de sauvegarde pour le contexte global
  useEffect(() => {
    registerSaveCallback(() => handleSave(false));
  }, [registerSaveCallback, articleName, title, metaDescription, keyword, secondaryKeywords, content, projectId, seoFieldsEnabled]);

  // Fonction pour gérer le changement d'article avec vérification des modifications
  const handleLoadArticle = useCallback((articleId) => {
    if (hasUserModified.current && articleId !== currentArticle?.id) {
      setUnsavedChangesPopup({
        targetArticleId: articleId,
        action: 'load'
      });
      return;
    }
    loadArticle(articleId);
  }, [currentArticle?.id, loadArticle]);

  // Fonction pour gérer la création d'un nouvel article avec vérification
  const handleCreateNewArticle = useCallback(() => {
    if (hasUserModified.current) {
      setUnsavedChangesPopup({
        targetArticleId: null,
        action: 'new'
      });
      return;
    }
    createNewArticle();
  }, [createNewArticle]);

  // Actions de la popup de modifications non sauvegardées
  const handleUnsavedDiscard = () => {
    hasUserModified.current = false;
    if (unsavedChangesPopup.action === 'load') {
      loadArticle(unsavedChangesPopup.targetArticleId);
    } else if (unsavedChangesPopup.action === 'new') {
      createNewArticle();
    }
    setUnsavedChangesPopup(null);
  };

  const handleUnsavedSave = () => {
    handleSave(false);
    hasUserModified.current = false;
    if (unsavedChangesPopup.action === 'load') {
      loadArticle(unsavedChangesPopup.targetArticleId);
    } else if (unsavedChangesPopup.action === 'new') {
      createNewArticle();
    }
    setUnsavedChangesPopup(null);
  };

  const handleUnsavedCancel = () => {
    setUnsavedChangesPopup(null);
  };

  const handleSave = (showAlert = true) => {
    if (!articleName || articleName.trim() === '') {
      setArticleNameError('Le nom de l\'article est obligatoire');
      if (showAlert) {
        alert('⚠️ Le nom de l\'article est obligatoire pour sauvegarder');
      }
      return;
    }

    setArticleNameError('');
    const wordCount = content.trim().split(/\s+/).filter(w => w.length > 0).length;
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
      hasUserModified.current = false;
      markAsSaved(); // Notifier le contexte global
      if (showAlert) {
        setShowSavePopup(true);
        setTimeout(() => setShowSavePopup(false), 3000);
      }
    }
  };

  const handleClearContent = () => setShowClearPopup(true);
  const confirmClearContent = () => {
    setContent('');
    setShowClearPopup(false);
    markAsModified();
  };
  const cancelClearContent = () => setShowClearPopup(false);

  const addSecondaryKeyword = () => {
    const newKeyword = secondaryKeywordInput.trim();
    if (newKeyword && !secondaryKeywords.includes(newKeyword)) {
      const updatedKeywords = [...secondaryKeywords, newKeyword];
      setSecondaryKeywords(updatedKeywords);
      setSecondaryKeywordInput('');

      if (content) {
        const processedContent = applyKeywordBold(content, keyword, updatedKeywords);
        setContent(processedContent);
      }
      markAsModified();
    }
  };

  const removeSecondaryKeyword = (kw) => {
    setSecondaryKeywords(secondaryKeywords.filter(k => k !== kw));
    markAsModified();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const htmlContent = e.clipboardData.getData('text/html');
    const textContent = e.clipboardData.getData('text/plain');

    let pastedContent;
    if (htmlContent) {
      pastedContent = cleanPastedHtml(htmlContent);
    } else if (textContent) {
      pastedContent = convertPlainTextToHtml(textContent);
    } else {
      pastedContent = '';
    }

    const textarea = document.getElementById('content-editor');
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newContent = content.substring(0, start) + pastedContent + content.substring(end);
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

    // Mapping des tags
    const tagMap = {
      'bold': 'strong',
      'h1': 'h1',
      'h2': 'h2',
      'h3': 'h3'
    };
    const htmlTag = tagMap[tag];
    if (!htmlTag) return;

    const openTag = `<${htmlTag}>`;
    const closeTag = `</${htmlTag}>`;

    // Vérifier si la sélection est déjà entourée de la balise
    const beforeSelection = content.substring(0, start);
    const afterSelection = content.substring(end);
    const selectedText = content.substring(start, end);

    // Cas 1: Le texte sélectionné contient lui-même les balises (ex: "<strong>texte</strong>")
    const wrappedRegex = new RegExp(`^<${htmlTag}>(.+)</${htmlTag}>$`, 's');
    const wrappedMatch = selectedText.match(wrappedRegex);
    if (wrappedMatch) {
      // Retirer les balises du texte sélectionné
      const newText = beforeSelection + wrappedMatch[1] + afterSelection;
      setContent(newText);
      markAsModified();
      return;
    }

    // Cas 2: Les balises sont juste avant et après la sélection
    const openTagLength = openTag.length;
    const closeTagLength = closeTag.length;
    const textBeforeOpen = content.substring(start - openTagLength, start);
    const textAfterClose = content.substring(end, end + closeTagLength);

    if (textBeforeOpen === openTag && textAfterClose === closeTag) {
      // Retirer les balises autour de la sélection
      const newText = content.substring(0, start - openTagLength) + selectedText + content.substring(end + closeTagLength);
      setContent(newText);
      markAsModified();
      return;
    }

    // Sinon, ajouter les balises
    const newText = beforeSelection + openTag + selectedText + closeTag + afterSelection;
    setContent(newText);
    markAsModified();
  };

  const getWordCount = () => {
    if (!content) return 0;
    return content.trim().split(/\s+/).filter(w => w.length > 0).length;
  };

  const copyToClipboard = async (text, fieldName) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Erreur lors de la copie:', err);
    }
  };

  const generateAndCopyFaqSchema = () => {
    const schema = generateFaqSchema(content);
    if (!schema) {
      setFaqSchemaError({
        title: 'Aucune FAQ détectée',
        message: 'Impossible de générer le schema.org FAQ.',
        tips: [
          'Ajoutez un titre contenant "FAQ" (H2 ou H3)',
          'Format 1 : Questions en H3 suivies de paragraphes de réponse',
          'Format 2 : <p><strong>Question ?</strong><br>Réponse</p>'
        ]
      });
      return;
    }
    const scriptTag = `<script type="application/ld+json">\n${JSON.stringify(schema, null, 2)}\n</script>`;
    setFaqSchemaPopup(scriptTag);
  };

  const handleFaqSchemaValidate = () => {
    if (faqSchemaPopup) {
      // Ajouter le script à la fin du contenu
      setContent(prevContent => {
        const trimmedContent = prevContent.trimEnd();
        return trimmedContent + '\n\n' + faqSchemaPopup;
      });
      markAsModified();
      setFaqSchemaPopup(null);
    }
  };

  const handleFaqSchemaCancel = () => {
    setFaqSchemaPopup(null);
  };

  // Calcul en temps réel du score SEO
  const seoAnalysis = useMemo(() => {
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
            <button onClick={handleCreateNewArticle} className="new-article-header-btn">
              + Nouvel article
            </button>
            <button onClick={() => handleSave(true)} className="save-button">
              Sauvegarder
            </button>
          </div>
        </div>

        {showSavePopup && <SavePopup />}

        {showClearPopup && (
          <ConfirmPopup
            icon="⚠️"
            title="Effacer le contenu ?"
            message="Êtes-vous sûr de vouloir effacer le contenu de l'article ? Cette action est irréversible."
            onConfirm={confirmClearContent}
            onCancel={cancelClearContent}
            confirmText="Effacer"
            cancelText="Annuler"
          />
        )}

        {faqSchemaError && (
          <div className="faq-error-popup-overlay" onClick={() => setFaqSchemaError(null)}>
            <div className="faq-error-popup" onClick={(e) => e.stopPropagation()}>
              <div className="faq-error-icon">⚠️</div>
              <h3>{faqSchemaError.title}</h3>
              <p>{faqSchemaError.message}</p>
              <div className="faq-error-tips">
                <strong>Formats acceptés :</strong>
                <ul>
                  {faqSchemaError.tips.map((tip, index) => (
                    <li key={index}>{tip}</li>
                  ))}
                </ul>
              </div>
              <button className="faq-error-close-btn" onClick={() => setFaqSchemaError(null)}>
                Compris
              </button>
            </div>
          </div>
        )}

        {faqSchemaPopup && (
          <div className="faq-schema-popup-overlay" onClick={handleFaqSchemaCancel}>
            <div className="faq-schema-popup" onClick={(e) => e.stopPropagation()}>
              <div className="faq-schema-popup-header">
                <h3>Schema.org FAQ</h3>
                <button className="faq-schema-close-x" onClick={handleFaqSchemaCancel}>×</button>
              </div>
              <p className="faq-schema-description">
                Vérifiez et modifiez le script si nécessaire, puis validez pour l'ajouter à la fin de votre article.
              </p>
              <textarea
                className="faq-schema-textarea"
                value={faqSchemaPopup}
                onChange={(e) => setFaqSchemaPopup(e.target.value)}
                spellCheck={false}
              />
              <div className="faq-schema-popup-actions">
                <button className="faq-schema-cancel-btn" onClick={handleFaqSchemaCancel}>
                  Annuler
                </button>
                <button className="faq-schema-validate-btn" onClick={handleFaqSchemaValidate}>
                  Valider et ajouter
                </button>
              </div>
            </div>
          </div>
        )}

        {unsavedChangesPopup && (
          <div className="unsaved-popup-overlay" onClick={handleUnsavedCancel}>
            <div className="unsaved-popup" onClick={(e) => e.stopPropagation()}>
              <div className="unsaved-popup-icon">⚠️</div>
              <h3>Modifications non sauvegardées</h3>
              <p>
                Vous avez des modifications en cours sur cet article.
                Que souhaitez-vous faire ?
              </p>
              <div className="unsaved-popup-actions">
                <button className="unsaved-btn unsaved-btn-discard" onClick={handleUnsavedDiscard}>
                  Abandonner
                </button>
                <button className="unsaved-btn unsaved-btn-cancel" onClick={handleUnsavedCancel}>
                  Annuler
                </button>
                <button className="unsaved-btn unsaved-btn-save" onClick={handleUnsavedSave}>
                  Sauvegarder
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

            <ProjectSelect
              projects={projects}
              projectId={projectId}
              onProjectChange={(id) => { setProjectId(id); markAsModified(); }}
              projectSearchQuery={projectSearchQuery}
              onProjectSearchChange={setProjectSearchQuery}
              showProjectDropdown={showProjectDropdown}
              onShowDropdownChange={setShowProjectDropdown}
            />

            <KeywordsSection
              keyword={keyword}
              onKeywordChange={(value) => { setKeyword(value); markAsModified(); }}
              secondaryKeywords={secondaryKeywords}
              secondaryKeywordInput={secondaryKeywordInput}
              onSecondaryKeywordInputChange={(value) => { setSecondaryKeywordInput(value); markAsModified(); }}
              onAddSecondaryKeyword={addSecondaryKeyword}
              onRemoveSecondaryKeyword={removeSecondaryKeyword}
              onApplyBold={applyBoldToExistingContent}
            />

            <SeoFieldsSection
              seoFieldsEnabled={seoFieldsEnabled}
              onSeoFieldsEnabledChange={(value) => { setSeoFieldsEnabled(value); markAsModified(); }}
              title={title}
              onTitleChange={(value) => { setTitle(value); markAsModified(); }}
              metaDescription={metaDescription}
              onMetaDescriptionChange={(value) => { setMetaDescription(value); markAsModified(); }}
              copiedField={copiedField}
              onCopyToClipboard={copyToClipboard}
            />

            <ContentEditor
              content={content}
              onContentChange={(value) => { setContent(value); markAsModified(); }}
              onPaste={handlePaste}
              showHtmlPreview={showHtmlPreview}
              onTogglePreview={() => setShowHtmlPreview(!showHtmlPreview)}
              copiedField={copiedField}
              onCopyToClipboard={copyToClipboard}
              onClearContent={handleClearContent}
              onInsertTag={insertTag}
              wordCount={getWordCount()}
              onGenerateFaqSchema={generateAndCopyFaqSchema}
            />
          </div>

          <div className="results-section">
            <SeoScorePanel seoAnalysis={seoAnalysis} />
            <ArticlesSidebar
              articles={articles}
              currentArticle={currentArticle}
              onLoadArticle={handleLoadArticle}
              onDeleteArticle={deleteArticle}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Redaction;
