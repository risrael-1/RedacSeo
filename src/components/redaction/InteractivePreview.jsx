import { useState, useRef, useEffect } from 'react';

const InteractivePreview = ({ content, onContentChange }) => {
  const [activeElement, setActiveElement] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const previewRef = useRef(null);
  const menuRef = useRef(null);

  // Fermer le menu si on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setActiveElement(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Trouver et remplacer un élément dans le contenu HTML
  const replaceElement = (originalTag, newTag, elementContent) => {
    if (!content) return;

    // Créer un pattern pour trouver l'élément exact
    const escapedContent = elementContent.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`<${originalTag}[^>]*>(${escapedContent})</${originalTag}>`, 'i');

    let newContent;
    if (newTag === null) {
      // Retirer les balises (garder juste le contenu)
      newContent = content.replace(pattern, '$1');
    } else {
      // Remplacer par une nouvelle balise
      newContent = content.replace(pattern, `<${newTag}>$1</${newTag}>`);
    }

    if (newContent !== content) {
      onContentChange(newContent);
    }
    setActiveElement(null);
  };

  // Gérer le clic sur un élément
  const handlePreviewClick = (e) => {
    const target = e.target;
    const tagName = target.tagName.toLowerCase();

    // Vérifier si c'est un élément modifiable
    const editableTags = ['strong', 'b', 'h1', 'h2', 'h3'];
    if (editableTags.includes(tagName)) {
      e.preventDefault();
      e.stopPropagation();

      // Normaliser 'b' en 'strong'
      const normalizedTag = tagName === 'b' ? 'strong' : tagName;

      setActiveElement({
        tag: normalizedTag,
        content: target.innerHTML,
        element: target
      });

      // Positionner le menu près de l'élément cliqué
      const rect = target.getBoundingClientRect();
      const previewRect = previewRef.current.getBoundingClientRect();

      setMenuPosition({
        x: rect.left - previewRect.left,
        y: rect.bottom - previewRect.top + 5
      });
    } else {
      setActiveElement(null);
    }
  };

  // Options du menu contextuel selon le type d'élément
  const getMenuOptions = () => {
    if (!activeElement) return [];

    const { tag } = activeElement;
    const options = [];

    if (tag === 'strong') {
      options.push({ label: 'Retirer le gras', action: () => replaceElement('strong', null, activeElement.content) });
      options.push({ label: 'Convertir en H1', action: () => replaceElement('strong', 'h1', activeElement.content) });
      options.push({ label: 'Convertir en H2', action: () => replaceElement('strong', 'h2', activeElement.content) });
      options.push({ label: 'Convertir en H3', action: () => replaceElement('strong', 'h3', activeElement.content) });
    } else if (tag === 'h1') {
      options.push({ label: 'Retirer H1', action: () => replaceElement('h1', null, activeElement.content) });
      options.push({ label: 'Convertir en H2', action: () => replaceElement('h1', 'h2', activeElement.content) });
      options.push({ label: 'Convertir en H3', action: () => replaceElement('h1', 'h3', activeElement.content) });
      options.push({ label: 'Convertir en gras', action: () => replaceElement('h1', 'strong', activeElement.content) });
    } else if (tag === 'h2') {
      options.push({ label: 'Retirer H2', action: () => replaceElement('h2', null, activeElement.content) });
      options.push({ label: 'Convertir en H1', action: () => replaceElement('h2', 'h1', activeElement.content) });
      options.push({ label: 'Convertir en H3', action: () => replaceElement('h2', 'h3', activeElement.content) });
      options.push({ label: 'Convertir en gras', action: () => replaceElement('h2', 'strong', activeElement.content) });
    } else if (tag === 'h3') {
      options.push({ label: 'Retirer H3', action: () => replaceElement('h3', null, activeElement.content) });
      options.push({ label: 'Convertir en H1', action: () => replaceElement('h3', 'h1', activeElement.content) });
      options.push({ label: 'Convertir en H2', action: () => replaceElement('h3', 'h2', activeElement.content) });
      options.push({ label: 'Convertir en gras', action: () => replaceElement('h3', 'strong', activeElement.content) });
    }

    return options;
  };

  return (
    <div className="interactive-preview-container" ref={previewRef}>
      <div
        className="html-preview interactive"
        onClick={handlePreviewClick}
        dangerouslySetInnerHTML={{
          __html: content || '<p style="color: #999;">Aucun contenu à afficher</p>'
        }}
      />

      {activeElement && (
        <div
          ref={menuRef}
          className="element-context-menu"
          style={{
            left: menuPosition.x,
            top: menuPosition.y
          }}
        >
          <div className="context-menu-header">
            &lt;{activeElement.tag}&gt;
          </div>
          {getMenuOptions().map((option, index) => (
            <button
              key={index}
              className="context-menu-item"
              onClick={option.action}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default InteractivePreview;
