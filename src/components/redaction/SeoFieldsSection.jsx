const SeoFieldsSection = ({
  seoFieldsEnabled,
  onSeoFieldsEnabledChange,
  title,
  onTitleChange,
  metaDescription,
  onMetaDescriptionChange,
  copiedField,
  onCopyToClipboard
}) => {
  return (
    <div className="seo-fields-section">
      <div className="seo-fields-header">
        <h3>Titre SEO & Meta Description</h3>
        <label className="toggle-switch">
          <input
            type="checkbox"
            checked={seoFieldsEnabled}
            onChange={(e) => onSeoFieldsEnabledChange(e.target.checked)}
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
                  onClick={() => onCopyToClipboard(title, 'title')}
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
              onChange={(e) => onTitleChange(e.target.value)}
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
                  onClick={() => onCopyToClipboard(metaDescription, 'meta')}
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
              onChange={(e) => onMetaDescriptionChange(e.target.value)}
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
  );
};

export default SeoFieldsSection;
