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
  const [copiedField, setCopiedField] = useState(null);
  const [showHtmlPreview, setShowHtmlPreview] = useState(false);
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
    const newKeyword = secondaryKeywordInput.trim();
    if (newKeyword && !secondaryKeywords.includes(newKeyword)) {
      const updatedKeywords = [...secondaryKeywords, newKeyword];
      setSecondaryKeywords(updatedKeywords);
      setSecondaryKeywordInput('');

      // Appliquer automatiquement le gras au contenu avec le nouveau mot-clé
      if (content) {
        const processedContent = applyKeywordBold(content, keyword, updatedKeywords);
        setContent(processedContent);
      }

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
    allKeywords.sort((a, b) => b.length - a.length);

    // Appliquer le gras aux mots-clés du plus long au plus court
    allKeywords.forEach(kw => {
      const escapedKeyword = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // Regex qui évite les mots déjà dans des balises <strong>
      // On cherche le mot-clé qui n'est PAS précédé de <strong> et pas suivi de </strong>
      const regex = new RegExp(
        `(?<!<strong>)(?<![\\wÀ-ÿ])(${escapedKeyword})(?![\\wÀ-ÿ])(?!</strong>)(?![^<]*>)`,
        'gi'
      );
      processedText = processedText.replace(regex, '<strong>$1</strong>');
    });

    return processedText;
  };

  // Fonction pour nettoyer le HTML collé et garder les balises et attributs utiles
  const cleanPastedHtml = (html) => {
    // Créer un élément temporaire pour parser le HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    // Flag pour tracker si on a déjà rencontré un titre (le premier sera H1)
    let firstTitleFound = false;

    // Fonction pour extraire les attributs à conserver
    const getAttributesString = (node, allowedAttrs = ['style', 'class', 'href', 'target']) => {
      const attrs = [];
      allowedAttrs.forEach(attrName => {
        const attrValue = node.getAttribute(attrName);
        if (attrValue) {
          // Pour style, on garde seulement certaines propriétés utiles
          if (attrName === 'style') {
            const allowedStyles = ['text-align', 'color', 'font-weight', 'font-style'];
            const styleProps = attrValue.split(';')
              .map(s => s.trim())
              .filter(s => {
                const propName = s.split(':')[0]?.trim().toLowerCase();
                return allowedStyles.some(allowed => propName === allowed);
              })
              .join('; ');
            if (styleProps) {
              attrs.push(`style="${styleProps}"`);
            }
          } else if (attrName === 'class') {
            // Garder les classes utiles (button, faq-item, etc.)
            const usefulClasses = ['button', 'faq-item', 'cta', 'highlight'];
            const classes = attrValue.split(' ')
              .filter(c => usefulClasses.some(uc => c.includes(uc)))
              .join(' ');
            if (classes) {
              attrs.push(`class="${classes}"`);
            }
          } else {
            attrs.push(`${attrName}="${attrValue}"`);
          }
        }
      });
      return attrs.length > 0 ? ' ' + attrs.join(' ') : '';
    };

    // Fonction récursive pour nettoyer les éléments avec indentation
    const cleanElement = (element, indent = 0, isRoot = false) => {
      const lines = [];
      const indentStr = '  '.repeat(indent);

      element.childNodes.forEach(node => {
        if (node.nodeType === Node.TEXT_NODE) {
          const text = node.textContent.trim();
          if (text) {
            // Si c'est du texte au niveau racine et qu'on n'a pas encore de titre, c'est le H1
            if (isRoot && !firstTitleFound) {
              firstTitleFound = true;
              lines.push(`<h1 style="text-align: center;">${text}</h1>`);
            } else {
              lines.push(text);
            }
          }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          const tagName = node.tagName.toLowerCase();

          // Ignorer les balises script, style, meta
          if (['script', 'style', 'meta', 'link', 'noscript'].includes(tagName)) {
            return;
          }

          // Pour les balises inline au niveau racine qui enveloppent tout le contenu,
          // on les "unwrap" pour traiter leur contenu directement
          const isInlineWrapper = ['strong', 'b', 'em', 'i', 'u', 'span'].includes(tagName);
          if (isRoot && isInlineWrapper && node.children.length > 0) {
            // Traiter les enfants directement comme s'ils étaient au niveau racine
            const unwrappedContent = cleanElement(node, indent, true);
            if (unwrappedContent.trim()) {
              lines.push(unwrappedContent);
            }
            return;
          }

          const childContent = cleanElement(node, indent + 1, false);

          // Balises à conserver avec leurs attributs
          switch (tagName) {
            case 'h1':
            case 'h2':
            case 'h3':
            case 'h4':
            case 'h5':
            case 'h6': {
              // Premier titre = toujours H1, les autres gardent leur niveau
              let finalTag = tagName;
              const attrs = getAttributesString(node);
              if (!firstTitleFound) {
                finalTag = 'h1';
                firstTitleFound = true;
                // Ajouter text-align: center si pas déjà présent
                const hasTextAlign = attrs.includes('text-align');
                const finalAttrs = hasTextAlign ? attrs : (attrs ? attrs.replace('style="', 'style="text-align: center; ') : ' style="text-align: center;"');
                lines.push(`${indentStr}<${finalTag}${finalAttrs}>${childContent}</${finalTag}>`);
              } else {
                lines.push(`${indentStr}<${finalTag}${attrs}>${childContent}</${finalTag}>`);
              }
              break;
            }
            case 'p': {
              // Si c'est le premier élément de contenu au niveau racine, c'est le H1
              if (!firstTitleFound) {
                firstTitleFound = true;
                lines.push(`${indentStr}<h1 style="text-align: center;">${childContent}</h1>`);
              } else {
                lines.push(`${indentStr}<p${getAttributesString(node)}>${childContent}</p>`);
              }
              break;
            }
            case 'strong':
            case 'b':
              lines.push(`<strong>${childContent}</strong>`);
              break;
            case 'em':
            case 'i':
              lines.push(`<em>${childContent}</em>`);
              break;
            case 'u':
              lines.push(`<u>${childContent}</u>`);
              break;
            case 'a': {
              const href = node.getAttribute('href');
              const target = node.getAttribute('target');
              const aClass = node.getAttribute('class');
              if (href) {
                let aAttrs = `href="${href}"`;
                if (target) aAttrs += ` target="${target}"`;
                if (aClass && aClass.includes('button')) aAttrs += ` class="button"`;
                lines.push(`<a ${aAttrs}>${childContent}</a>`);
              } else {
                lines.push(childContent);
              }
              break;
            }
            case 'ul':
              lines.push(`${indentStr}<ul${getAttributesString(node)}>`);
              lines.push(childContent);
              lines.push(`${indentStr}</ul>`);
              break;
            case 'ol':
              lines.push(`${indentStr}<ol${getAttributesString(node)}>`);
              lines.push(childContent);
              lines.push(`${indentStr}</ol>`);
              break;
            case 'li':
              lines.push(`${'  '.repeat(indent)}<li${getAttributesString(node)}>${childContent}</li>`);
              break;
            case 'br':
              lines.push('<br>');
              break;
            case 'blockquote':
              lines.push(`${indentStr}<blockquote${getAttributesString(node)}>`);
              lines.push(`${'  '.repeat(indent + 1)}${childContent}`);
              lines.push(`${indentStr}</blockquote>`);
              break;
            case 'div': {
              // Pour les div avec classe utile, on les garde
              const divClass = node.getAttribute('class');
              if (divClass && (divClass.includes('faq') || divClass.includes('cta'))) {
                lines.push(`${indentStr}<div class="${divClass}">`);
                lines.push(childContent);
                lines.push(`${indentStr}</div>`);
              } else if (childContent.trim()) {
                lines.push(childContent);
              }
              break;
            }
            case 'span': {
              // Pour span avec style de couleur, on garde
              const spanStyle = node.getAttribute('style');
              if (spanStyle && spanStyle.includes('color')) {
                lines.push(`<span style="${spanStyle}">${childContent}</span>`);
              } else if (childContent.trim()) {
                lines.push(childContent);
              }
              break;
            }
            default:
              // Pour les autres balises, on garde juste le contenu
              if (childContent.trim()) {
                lines.push(childContent);
              }
          }
        }
      });

      return lines.join('\n');
    };

    let cleanedHtml = cleanElement(tempDiv, 0, true);

    // Nettoyer les lignes vides excessives
    cleanedHtml = cleanedHtml
      .split('\n')
      .filter((line, index, arr) => {
        // Supprimer les lignes vides consécutives (garder max 1)
        if (line.trim() === '' && index > 0 && arr[index - 1].trim() === '') {
          return false;
        }
        return true;
      })
      .join('\n')
      .trim();

    return cleanedHtml;
  };

  // Fonction pour convertir du texte brut en HTML avec détection des titres
  const convertPlainTextToHtml = (text) => {
    const lines = text.split('\n');
    let result = [];
    let isFirstNonEmptyLine = true;
    let currentParagraph = [];

    // Patterns pour détecter les titres H2 (lignes courtes qui ressemblent à des titres)
    const isTitleLine = (line) => {
      const trimmed = line.trim();
      // Critères pour un titre :
      // - Entre 10 et 100 caractères
      // - Ne finit pas par un point (sauf ...)
      // - Peut contenir ":" ou "-"
      // - Pas trop de mots (max ~15)
      if (trimmed.length < 10 || trimmed.length > 100) return false;
      if (trimmed.endsWith('.') && !trimmed.endsWith('...')) return false;
      if (trimmed.endsWith(',') || trimmed.endsWith(';')) return false;

      const wordCount = trimmed.split(/\s+/).length;
      if (wordCount > 15) return false;

      // Bonus : contient souvent ":" ou commence par une majuscule
      const startsWithCapital = /^[A-ZÀ-Ü]/.test(trimmed);
      const hasColon = trimmed.includes(':');
      const hasQuestion = trimmed.includes('?');

      return startsWithCapital && (hasColon || hasQuestion || wordCount <= 10);
    };

    // Patterns pour détecter les sous-titres H3 (FAQ, questions)
    const isSubtitleLine = (line) => {
      const trimmed = line.trim();
      // Questions courtes ou lignes commençant par des patterns FAQ
      if (trimmed.endsWith('?') && trimmed.length < 120) return true;
      if (/^(FAQ|Q:|Question)/i.test(trimmed)) return true;
      return false;
    };

    // Fonction pour flush le paragraphe en cours
    const flushParagraph = () => {
      if (currentParagraph.length > 0) {
        const paragraphText = currentParagraph.join(' ').trim();
        if (paragraphText) {
          result.push(`<p style="text-align: justify;">${paragraphText}</p>`);
        }
        currentParagraph = [];
      }
    };

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();

      // Ligne vide = fin de paragraphe
      if (!trimmedLine) {
        flushParagraph();
        return;
      }

      // Première ligne non vide = H1 (titre principal)
      if (isFirstNonEmptyLine) {
        flushParagraph();
        result.push(`<h1 style="text-align: center;">${trimmedLine}</h1>`);
        isFirstNonEmptyLine = false;
        return;
      }

      // Détecter les liens/boutons (format [texte] ou texte avec URL)
      if (/^\[.*\].*$/.test(trimmedLine) || /^https?:\/\//.test(trimmedLine)) {
        flushParagraph();
        // Extraire le texte du lien si format [texte](url) ou [url]texte
        const linkMatch = trimmedLine.match(/\[(https?:\/\/[^\]]+)\](.+)/);
        if (linkMatch) {
          result.push(`<p style="text-align: justify;"><a class="button" href="${linkMatch[1]}">${linkMatch[2].trim()}</a></p>`);
        } else {
          result.push(`<p style="text-align: justify;">${trimmedLine}</p>`);
        }
        return;
      }

      // Détecter H3 (sous-titres, questions FAQ)
      if (isSubtitleLine(trimmedLine)) {
        flushParagraph();
        result.push(`<h3 style="text-align: justify;">${trimmedLine}</h3>`);
        return;
      }

      // Détecter H2 (titres de section)
      // On vérifie aussi que la ligne précédente était vide ou que c'est après plusieurs paragraphes
      const prevLine = index > 0 ? lines[index - 1].trim() : '';
      if (isTitleLine(trimmedLine) && (prevLine === '' || index < 3)) {
        flushParagraph();
        result.push(`<h2 style="text-align: justify;">${trimmedLine}</h2>`);
        return;
      }

      // Sinon c'est du contenu de paragraphe
      currentParagraph.push(trimmedLine);
    });

    // Flush le dernier paragraphe
    flushParagraph();

    return result.join('\n');
  };

  const handlePaste = (e) => {
    e.preventDefault();

    // Essayer de récupérer le contenu HTML d'abord
    const htmlContent = e.clipboardData.getData('text/html');
    const textContent = e.clipboardData.getData('text/plain');

    let pastedContent;

    if (htmlContent) {
      // Si on a du HTML, le nettoyer pour garder la mise en forme
      pastedContent = cleanPastedHtml(htmlContent);
    } else if (textContent) {
      // Si c'est du texte brut, essayer de détecter la structure
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

  // Fonction pour copier du texte dans le presse-papier
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
                      <div className="field-actions">
                        <span className="char-count-inline">{title.length}/65 car.</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(title, 'title')}
                          className="copy-icon-button"
                          title="Copier le titre"
                          disabled={!title}
                        >
                          {copiedField === 'title' ? '✓' : '📋'}
                        </button>
                      </div>
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
                      <div className="field-actions">
                        <span className="char-count-inline">{metaDescription.length}/160 car.</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(metaDescription, 'meta')}
                          className="copy-icon-button"
                          title="Copier la meta description"
                          disabled={!metaDescription}
                        >
                          {copiedField === 'meta' ? '✓' : '📋'}
                        </button>
                      </div>
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
                <div className="content-actions">
                  <button
                    type="button"
                    onClick={() => setShowHtmlPreview(!showHtmlPreview)}
                    className={`preview-toggle-button ${showHtmlPreview ? 'active' : ''}`}
                    title={showHtmlPreview ? 'Mode édition' : 'Aperçu HTML'}
                  >
                    {showHtmlPreview ? '✏️ Éditer' : '👁️ Aperçu'}
                  </button>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(content, 'content')}
                    className="copy-icon-button"
                    title="Copier le contenu"
                    disabled={!content}
                  >
                    {copiedField === 'content' ? '✓' : '📋'}
                  </button>
                  <button onClick={handleClearContent} className="clear-icon-button" title="Effacer le contenu">
                    🗑️
                  </button>
                </div>
              </div>
              <div className="content-info">
                {showHtmlPreview
                  ? 'Aperçu du rendu HTML de votre article.'
                  : 'Collez votre article ici. Les mots-clés seront automatiquement mis en gras.'}
              </div>
              {showHtmlPreview ? (
                <div
                  className="html-preview"
                  dangerouslySetInnerHTML={{ __html: content || '<p style="color: #999;">Aucun contenu à afficher</p>' }}
                />
              ) : (
                <textarea
                  id="content-editor"
                  value={content}
                  onChange={(e) => { setContent(e.target.value); markAsModified(); }}
                  onPaste={handlePaste}
                  placeholder="Collez ou rédigez votre contenu ici..."
                  rows="20"
                />
              )}
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
