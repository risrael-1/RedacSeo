// Utilitaires pour le traitement HTML

// Fonction pour appliquer le gras aux mots-clés
export const applyKeywordBold = (text, primaryKeyword, secondaryKeywordsArray) => {
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
    const regex = new RegExp(
      `(?<!<strong>)(?<![\\wÀ-ÿ])(${escapedKeyword})(?![\\wÀ-ÿ])(?!</strong>)(?![^<]*>)`,
      'gi'
    );
    processedText = processedText.replace(regex, '<strong>$1</strong>');
  });

  return processedText;
};

// Fonction pour nettoyer le HTML collé
export const cleanPastedHtml = (html) => {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;

  let firstTitleFound = false;

  const isParagraphMostlyBold = (node) => {
    const fullText = node.textContent.trim();
    if (!fullText) return false;

    let boldText = '';
    const walkNode = (n) => {
      if (n.nodeType === Node.TEXT_NODE) {
        const parent = n.parentElement;
        if (parent) {
          const style = parent.getAttribute('style') || '';
          const tagName = parent.tagName?.toLowerCase();
          if (style.includes('font-weight:700') || style.includes('font-weight: 700') ||
              tagName === 'strong' || tagName === 'b') {
            boldText += n.textContent;
          }
        }
      } else if (n.nodeType === Node.ELEMENT_NODE) {
        const style = n.getAttribute('style') || '';
        const tagName = n.tagName?.toLowerCase();
        if (style.includes('font-weight:700') || style.includes('font-weight: 700') ||
            tagName === 'strong' || tagName === 'b') {
          boldText += n.textContent;
        } else {
          n.childNodes.forEach(child => walkNode(child));
        }
      }
    };
    node.childNodes.forEach(child => walkNode(child));

    const boldRatio = boldText.trim().length / fullText.length;
    return boldRatio > 0.8;
  };

  const isH2Title = (text, node) => {
    const trimmed = text.trim();
    if (trimmed.length < 15 || trimmed.length > 120) return false;
    if (trimmed.endsWith('.') && !trimmed.endsWith('...')) return false;
    if (trimmed.endsWith(',') || trimmed.endsWith(';')) return false;

    const wordCount = trimmed.split(/\s+/).length;
    if (wordCount > 15) return false;

    return isParagraphMostlyBold(node);
  };

  const isH3Title = (text) => {
    const trimmed = text.trim();
    if (trimmed.endsWith('?') && trimmed.length < 150) return true;
    if (/^FAQ\s*[-–—:]/i.test(trimmed)) return true;
    return false;
  };

  const getAttributesString = (node, allowedAttrs = ['style', 'class', 'href', 'target']) => {
    const attrs = [];
    allowedAttrs.forEach(attrName => {
      const attrValue = node.getAttribute(attrName);
      if (attrValue) {
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

  const cleanElement = (element, indent = 0, isRoot = false) => {
    const lines = [];
    const indentStr = '  '.repeat(indent);

    element.childNodes.forEach(node => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent.trim();
        if (text) {
          if (isRoot && !firstTitleFound) {
            firstTitleFound = true;
            lines.push(`<h1 style="text-align: center;">${text}</h1>`);
          } else {
            lines.push(text);
          }
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const tagName = node.tagName.toLowerCase();

        if (['script', 'style', 'meta', 'link', 'noscript'].includes(tagName)) {
          return;
        }

        const isInlineWrapper = ['strong', 'b', 'em', 'i', 'u', 'span'].includes(tagName);
        if (isRoot && isInlineWrapper && node.children.length > 0) {
          const unwrappedContent = cleanElement(node, indent, true);
          if (unwrappedContent.trim()) {
            lines.push(unwrappedContent);
          }
          return;
        }

        const childContent = cleanElement(node, indent + 1, false);

        switch (tagName) {
          case 'h1':
          case 'h2':
          case 'h3':
          case 'h4':
          case 'h5':
          case 'h6': {
            let finalTag = tagName;
            const cleanText = node.textContent.trim();
            if (!firstTitleFound) {
              finalTag = 'h1';
              firstTitleFound = true;
              lines.push(`${indentStr}<${finalTag} style="text-align: center;">${cleanText}</${finalTag}>`);
            } else {
              if (finalTag === 'h3') {
                lines.push(`${indentStr}<${finalTag} style="text-align: center;">${cleanText}</${finalTag}>`);
              } else {
                lines.push(`${indentStr}<${finalTag}>${cleanText}</${finalTag}>`);
              }
            }
            break;
          }
          case 'p': {
            const plainText = node.textContent.trim();
            const cleanTextContent = plainText;

            if (!firstTitleFound) {
              firstTitleFound = true;
              lines.push(`${indentStr}<h1 style="text-align: center;">${cleanTextContent}</h1>`);
            }
            else if (isH3Title(plainText)) {
              lines.push(`${indentStr}<h3 style="text-align: center;">${cleanTextContent}</h3>`);
            }
            else if (isH2Title(plainText, node)) {
              lines.push(`${indentStr}<h2>${cleanTextContent}</h2>`);
            }
            else {
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
            const spanStyle = node.getAttribute('style');
            if (spanStyle && spanStyle.includes('color')) {
              lines.push(`<span style="${spanStyle}">${childContent}</span>`);
            } else if (childContent.trim()) {
              lines.push(childContent);
            }
            break;
          }
          default:
            if (childContent.trim()) {
              lines.push(childContent);
            }
        }
      }
    });

    return lines.join('\n');
  };

  let cleanedHtml = cleanElement(tempDiv, 0, true);

  cleanedHtml = cleanedHtml
    .split('\n')
    .filter((line, index, arr) => {
      if (line.trim() === '' && index > 0 && arr[index - 1].trim() === '') {
        return false;
      }
      return true;
    })
    .join('\n')
    .trim();

  return cleanedHtml;
};

// Fonction pour convertir du texte brut en HTML
export const convertPlainTextToHtml = (text) => {
  const lines = text.split('\n');
  let result = [];
  let isFirstNonEmptyLine = true;
  let currentParagraph = [];

  const isTitleLine = (line) => {
    const trimmed = line.trim();
    if (trimmed.length < 10 || trimmed.length > 100) return false;
    if (trimmed.endsWith('.') && !trimmed.endsWith('...')) return false;
    if (trimmed.endsWith(',') || trimmed.endsWith(';')) return false;

    const wordCount = trimmed.split(/\s+/).length;
    if (wordCount > 15) return false;

    const startsWithCapital = /^[A-ZÀ-Ü]/.test(trimmed);
    const hasColon = trimmed.includes(':');
    const hasQuestion = trimmed.includes('?');

    return startsWithCapital && (hasColon || hasQuestion || wordCount <= 10);
  };

  const isSubtitleLine = (line) => {
    const trimmed = line.trim();
    if (trimmed.endsWith('?') && trimmed.length < 120) return true;
    if (/^(FAQ|Q:|Question)/i.test(trimmed)) return true;
    return false;
  };

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

    if (!trimmedLine) {
      flushParagraph();
      return;
    }

    if (isFirstNonEmptyLine) {
      flushParagraph();
      result.push(`<h1 style="text-align: center;">${trimmedLine}</h1>`);
      isFirstNonEmptyLine = false;
      return;
    }

    if (/^\[.*\].*$/.test(trimmedLine) || /^https?:\/\//.test(trimmedLine)) {
      flushParagraph();
      const linkMatch = trimmedLine.match(/\[(https?:\/\/[^\]]+)\](.+)/);
      if (linkMatch) {
        result.push(`<p style="text-align: justify;"><a class="button" href="${linkMatch[1]}">${linkMatch[2].trim()}</a></p>`);
      } else {
        result.push(`<p style="text-align: justify;">${trimmedLine}</p>`);
      }
      return;
    }

    if (isSubtitleLine(trimmedLine)) {
      flushParagraph();
      result.push(`<h3 style="text-align: justify;">${trimmedLine}</h3>`);
      return;
    }

    const prevLine = index > 0 ? lines[index - 1].trim() : '';
    if (isTitleLine(trimmedLine) && (prevLine === '' || index < 3)) {
      flushParagraph();
      result.push(`<h2 style="text-align: justify;">${trimmedLine}</h2>`);
      return;
    }

    currentParagraph.push(trimmedLine);
  });

  flushParagraph();

  return result.join('\n');
};

// Helper pour déterminer le niveau SEO
export const getSEOScoreLevel = (score) => {
  if (score >= 80) return { level: 'Excellent', color: '#22c55e' };
  if (score >= 60) return { level: 'Bon', color: '#84cc16' };
  if (score >= 40) return { level: 'Moyen', color: '#eab308' };
  if (score >= 20) return { level: 'Faible', color: '#f97316' };
  return { level: 'Critique', color: '#ef4444' };
};
