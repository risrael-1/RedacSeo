import { useState, useEffect } from 'react';
import { useRules } from '../context/RulesContext';
import { useArticles } from '../context/ArticlesContext';
import Navbar from '../components/Navbar';
import './Redaction.css';

const Redaction = () => {
  const [title, setTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [keyword, setKeyword] = useState('');
  const [secondaryKeywords, setSecondaryKeywords] = useState([]);
  const [secondaryKeywordInput, setSecondaryKeywordInput] = useState('');
  const [content, setContent] = useState('');
  const [results, setResults] = useState([]);
  const [titleSuggestions, setTitleSuggestions] = useState([]);
  const [metaSuggestions, setMetaSuggestions] = useState([]);
  const [articleName, setArticleName] = useState('');
  const [showSavePopup, setShowSavePopup] = useState(false);
  const { checkRules } = useRules();
  const { currentArticle, saveArticle, articles, loadArticle, deleteArticle, createNewArticle } = useArticles();

  // Charger l'article en cours
  useEffect(() => {
    if (currentArticle) {
      setTitle(currentArticle.title || '');
      setMetaDescription(currentArticle.metaDescription || '');
      setKeyword(currentArticle.keyword || '');
      setSecondaryKeywords(currentArticle.secondaryKeywords || []);
      setContent(currentArticle.content || '');
      setArticleName(currentArticle.articleName || '');
    }
  }, [currentArticle]);

  // Auto-save toutes les 30 secondes
  useEffect(() => {
    const interval = setInterval(() => {
      if (content || title || keyword) {
        handleSave(false); // Sauvegarde silencieuse
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [title, metaDescription, keyword, secondaryKeywords, content, articleName]);

  const handleSave = (showAlert = true) => {
    const wordCount = content.trim().split(/\s+/).filter(w => w.length > 0).length;
    const article = saveArticle({
      articleName: articleName || `Article ${new Date().toLocaleString()}`,
      title,
      metaDescription,
      keyword,
      secondaryKeywords,
      content,
      wordCount,
      status: 'En cours',
    });

    if (showAlert && article) {
      setShowSavePopup(true);
      setTimeout(() => {
        setShowSavePopup(false);
      }, 3000);
    }
  };

  const handleClearContent = () => {
    if (window.confirm('Êtes-vous sûr de vouloir effacer tout le contenu de l\'article ? Cette action est irréversible.')) {
      setContent('');
      setTitle('');
      setMetaDescription('');
      setKeyword('');
      setSecondaryKeywords([]);
      setTitleSuggestions([]);
      setMetaSuggestions([]);
      setResults([]);
    }
  };

  const addSecondaryKeyword = () => {
    if (secondaryKeywordInput.trim() && !secondaryKeywords.includes(secondaryKeywordInput.trim())) {
      setSecondaryKeywords([...secondaryKeywords, secondaryKeywordInput.trim()]);
      setSecondaryKeywordInput('');
    }
  };

  const removeSecondaryKeyword = (keyword) => {
    setSecondaryKeywords(secondaryKeywords.filter(k => k !== keyword));
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
  };

  const applyBoldToExistingContent = () => {
    if (!keyword && secondaryKeywords.length === 0) {
      alert('Veuillez entrer au moins un mot-clé avant d\'appliquer le formatage');
      return;
    }
    const processedContent = applyKeywordBold(content, keyword, secondaryKeywords);
    setContent(processedContent);
  };

  const generateSuggestions = () => {
    if (!content || content.trim().length < 50) {
      alert('Veuillez écrire au moins 50 caractères de contenu pour générer des suggestions');
      return;
    }

    // Extraire les mots clés principaux du contenu
    const cleanContent = content.replace(/<[^>]*>/g, ' ').toLowerCase();
    const words = cleanContent.split(/\s+/).filter(w => w.length > 4);
    const wordFreq = {};

    words.forEach(word => {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    });

    const sortedWords = Object.entries(wordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word);

    // Extraire le premier paragraphe
    const firstParagraph = content.split('\n\n')[0].replace(/<[^>]*>/g, ' ').trim();
    const firstSentence = firstParagraph.split(/[.!?]/)[0];

    // Générer des suggestions de titre (max 65 caractères)
    const titles = [
      firstSentence.substring(0, 60) + (firstSentence.length > 60 ? '...' : ''),
      `Guide complet : ${sortedWords[0]}`.substring(0, 65),
      `Tout savoir sur ${sortedWords[0]} en 2026`.substring(0, 65),
      `${sortedWords[0]} : astuces et conseils`.substring(0, 65)
    ].filter(t => t.length <= 65);

    setTitleSuggestions(titles);

    // Générer des suggestions de meta description (150-160 caractères)
    const metas = [
      firstParagraph.substring(0, 155) + (firstParagraph.length > 155 ? '...' : ''),
      `Découvrez tout sur ${sortedWords[0]}. Guide pratique et conseils pour ${sortedWords[1]}. ${firstSentence.substring(0, 80)}`.substring(0, 160),
      `${firstSentence.substring(0, 140)}. En savoir plus...`.substring(0, 160)
    ].filter(m => m.length >= 120 && m.length <= 160);

    setMetaSuggestions(metas);
  };

  const handleCheck = () => {
    const ruleResults = checkRules(content, title, metaDescription, keyword);
    setResults(ruleResults);
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
  };

  const getWordCount = () => {
    if (!content) return 0;
    return content.trim().split(/\s+/).filter(w => w.length > 0).length;
  };

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
            <button onClick={handleClearContent} className="clear-button">
              Effacer
            </button>
            <button onClick={generateSuggestions} className="suggest-button">
              Générer des suggestions
            </button>
            <button onClick={handleCheck} className="check-button">
              Vérifier les règles SEO
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

        <div className="redaction-grid">
          <div className="editor-section">
            <div className="form-group">
              <label htmlFor="articleName">Nom de l'article</label>
              <input
                type="text"
                id="articleName"
                value={articleName}
                onChange={(e) => setArticleName(e.target.value)}
                placeholder="Donnez un nom à votre article"
              />
            </div>

            <div className="keywords-section">
              <div className="keywords-grid">
                <div className="form-group">
                  <label htmlFor="keyword">Mot-clé principal</label>
                  <input
                    type="text"
                    id="keyword"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
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
                      onChange={(e) => setSecondaryKeywordInput(e.target.value)}
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
              <label htmlFor="content-editor">Contenu de l'article</label>
              <div className="content-info">
                Collez votre article ici. Les mots-clés seront automatiquement mis en gras.
              </div>
              <textarea
                id="content-editor"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onPaste={handlePaste}
                placeholder="Collez ou rédigez votre contenu ici..."
                rows="20"
              />
              <span className="char-count">{getWordCount()} mots</span>
            </div>

            {titleSuggestions.length > 0 && (
              <div className="suggestions-section">
                <h3>Suggestions de titre SEO</h3>
                <div className="suggestions-list">
                  {titleSuggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="suggestion-item"
                      onClick={() => setTitle(suggestion)}
                    >
                      <span className="suggestion-text">{suggestion}</span>
                      <span className="suggestion-length">{suggestion.length} car.</span>
                    </div>
                  ))}
                </div>
                <div className="form-group">
                  <label htmlFor="title">Titre SEO choisi</label>
                  <input
                    type="text"
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Sélectionnez une suggestion ou entrez votre titre"
                    maxLength="70"
                  />
                  <span className="char-count">{title.length} / 65 caractères</span>
                </div>
              </div>
            )}

            {metaSuggestions.length > 0 && (
              <div className="suggestions-section">
                <h3>Suggestions de meta description</h3>
                <div className="suggestions-list">
                  {metaSuggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="suggestion-item"
                      onClick={() => setMetaDescription(suggestion)}
                    >
                      <span className="suggestion-text">{suggestion}</span>
                      <span className="suggestion-length">{suggestion.length} car.</span>
                    </div>
                  ))}
                </div>
                <div className="form-group">
                  <label htmlFor="metaDescription">Meta description choisie</label>
                  <textarea
                    id="metaDescription"
                    value={metaDescription}
                    onChange={(e) => setMetaDescription(e.target.value)}
                    placeholder="Sélectionnez une suggestion ou entrez votre meta description"
                    rows="3"
                    maxLength="170"
                  />
                  <span className="char-count">{metaDescription.length} / 160 caractères</span>
                </div>
              </div>
            )}
          </div>

          <div className="results-section">
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
                        <h4>{article.articleName || 'Sans nom'}</h4>
                        <p>{article.wordCount || 0} mots</p>
                        <span className="article-date">
                          {new Date(article.lastModified).toLocaleDateString()}
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

            <div className="verification-results">
              <h3>Résultats de la vérification</h3>
              {results.length === 0 ? (
                <p className="no-results">
                  1. Rédigez votre contenu<br/>
                  2. Cliquez sur "Générer des suggestions"<br/>
                  3. Choisissez votre mot-clé<br/>
                  4. Vérifiez les règles SEO
                </p>
              ) : (
                <div className="results-list">
                  {results.map((result) => (
                    <div
                      key={result.ruleId}
                      className={`result-card ${result.isValid ? 'valid' : 'invalid'}`}
                    >
                      <div className="result-icon">
                        {result.isValid ? '✓' : '✗'}
                      </div>
                      <div className="result-content">
                        <h4>{result.ruleName}</h4>
                        <p>{result.message}</p>
                      </div>
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
