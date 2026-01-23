const KeywordsSection = ({
  keyword,
  onKeywordChange,
  secondaryKeywords,
  secondaryKeywordInput,
  onSecondaryKeywordInputChange,
  onAddSecondaryKeyword,
  onRemoveSecondaryKeyword,
  onApplyBold
}) => {
  return (
    <div className="keywords-section">
      <div className="keywords-grid">
        <div className="form-group">
          <label htmlFor="keyword">Mot-clé principal</label>
          <input
            type="text"
            id="keyword"
            value={keyword}
            onChange={(e) => onKeywordChange(e.target.value)}
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
              onChange={(e) => onSecondaryKeywordInputChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), onAddSecondaryKeyword())}
              placeholder="Ex: optimisation contenu"
            />
            <button onClick={onAddSecondaryKeyword} className="add-keyword-btn">+</button>
          </div>
        </div>
      </div>

      {secondaryKeywords.length > 0 && (
        <div className="keywords-tags">
          {secondaryKeywords.map((kw, index) => (
            <span key={index} className="keyword-tag">
              {kw}
              <button onClick={() => onRemoveSecondaryKeyword(kw)} className="remove-tag">×</button>
            </span>
          ))}
        </div>
      )}

      <button onClick={onApplyBold} className="apply-bold-button">
        Appliquer le gras aux mots-clés
      </button>
    </div>
  );
};

export default KeywordsSection;
