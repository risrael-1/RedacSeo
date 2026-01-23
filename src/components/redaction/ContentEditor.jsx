import InteractivePreview from './InteractivePreview';

const ContentEditor = ({
  content,
  onContentChange,
  onPaste,
  showHtmlPreview,
  onTogglePreview,
  copiedField,
  onCopyToClipboard,
  onClearContent,
  onInsertTag,
  wordCount
}) => {
  return (
    <>
      <div className="editor-toolbar">
        <button onClick={() => onInsertTag('bold')} className="toolbar-btn" title="Gras">
          <strong>G</strong>
        </button>
        <button onClick={() => onInsertTag('h1')} className="toolbar-btn" title="Titre H1">
          H1
        </button>
        <button onClick={() => onInsertTag('h2')} className="toolbar-btn" title="Titre H2">
          H2
        </button>
        <button onClick={() => onInsertTag('h3')} className="toolbar-btn" title="Titre H3">
          H3
        </button>
      </div>

      <div className="form-group">
        <div className="content-label-wrapper">
          <label htmlFor="content-editor">Contenu de l'article</label>
          <div className="content-actions">
            <button
              type="button"
              onClick={onTogglePreview}
              className={`preview-toggle-button ${showHtmlPreview ? 'active' : ''}`}
              title={showHtmlPreview ? 'Mode édition' : 'Aperçu HTML'}
            >
              {showHtmlPreview ? '✏️ Éditer' : '👁️ Aperçu'}
            </button>
            <button
              type="button"
              onClick={() => onCopyToClipboard(content, 'content')}
              className="copy-icon-button"
              title="Copier le contenu"
              disabled={!content}
            >
              {copiedField === 'content' ? '✓' : '📋'}
            </button>
            <button onClick={onClearContent} className="clear-icon-button" title="Effacer le contenu">
              🗑️
            </button>
          </div>
        </div>
        <div className="content-info">
          {showHtmlPreview
            ? 'Cliquez sur un élément (gras, H1, H2, H3) pour le modifier.'
            : 'Collez votre article ici. Les mots-clés seront automatiquement mis en gras.'}
        </div>
        {showHtmlPreview ? (
          <InteractivePreview
            content={content}
            onContentChange={onContentChange}
          />
        ) : (
          <textarea
            id="content-editor"
            value={content}
            onChange={(e) => onContentChange(e.target.value)}
            onPaste={onPaste}
            placeholder="Collez ou rédigez votre contenu ici..."
            rows="20"
          />
        )}
        <span className="char-count">{wordCount} mots</span>
      </div>
    </>
  );
};

export default ContentEditor;
