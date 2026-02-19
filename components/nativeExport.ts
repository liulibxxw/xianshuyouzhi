/**
 * DOM-based text cleaner for export.
 * Removes trailing empty lines and invisible elements while preserving rich text.
 * Normalizes Android WebView contentEditable output to standard <br> line breaks.
 *
 * Android WebView contentEditable typical output:
 *   Line1<div>Line2</div><div><br></div><div>Line3</div>
 * Desktop Chrome typical output:
 *   Line1<br>Line2<br><br>Line3
 *
 * This function converts Android format to Chrome format (pure <br> breaks),
 * then removes trailing empty lines.
 */
export const getCleanContent = (html: string): string => {
  if (!html) return '';

  const temp = document.createElement('div');
  temp.innerHTML = html;

  // 对真正的块级富文本结构保持原样，避免误改语义。
  // 但不再把带 class/style 的 div 一律视为“富文本块”，
  // 以兼容 Android WebView 给普通行容器附加属性的场景。
  const hasRichBlockStructure = !!temp.querySelector(
    [
      'p',
      'blockquote',
      'pre',
      'ul',
      'ol',
      'li',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'table',
      'thead',
      'tbody',
      'tr',
      'td',
      'th',
    ].join(',')
  );

  if (hasRichBlockStructure) return html;

  // Check if a single node is visually empty
  const isNodeEmpty = (node: Node): boolean => {
    if (node.nodeType === Node.TEXT_NODE) {
      return !node.textContent?.replace(/\u00A0/g, ' ').trim();
    }
    if (node.nodeType === Node.ELEMENT_NODE) {
      const tag = (node as HTMLElement).tagName?.toLowerCase();
      if (tag === 'br') return true;
      if (tag === 'img' || tag === 'hr' || tag === 'video') return false;
      return Array.from(node.childNodes).every(isNodeEmpty);
    }
    return true;
  };

  // Check if a <div> is visually an empty line (only contains <br>, whitespace, etc.)
  const isDivEmpty = (el: HTMLElement): boolean => {
    return Array.from(el.childNodes).every(isNodeEmpty);
  };

  // Flatten Android WebView "plain" <div> wrappers into plain <br> line breaks.
  //
  // Android contentEditable wraps each line in a <div> (block element).
  // The first line is NOT wrapped, subsequent lines each get a <div>.
  //   Line1<div>Line2</div><div><br></div><div>Line4</div>
  // Equivalent desktop Chrome output:
  //   Line1<br>Line2<br><br>Line4
  //
  // Rules:
  //   - Insert <br> before each <div> if there is preceding content
  //   - Unwrap content from non-empty <div>s
  //   - Empty <div>s contribute nothing (the <br> alone represents the blank line)
  const isPlainWrapperDiv = (el: HTMLElement): boolean => {
    if (el.tagName.toLowerCase() !== 'div') return false;

    // 若该 div 内部还有块级结构，视为语义段落，避免展开。
    const hasNestedBlock = !!el.querySelector(
      [
        'div',
        'p',
        'blockquote',
        'pre',
        'ul',
        'ol',
        'li',
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        'table',
      ].join(',')
    );
    if (hasNestedBlock) return false;

    return true;
  };

  const flattenDivs = (parent: HTMLElement) => {
    const children = Array.from(parent.childNodes);

    for (const child of children) {
      if (child.nodeType !== Node.ELEMENT_NODE) continue;
      const el = child as HTMLElement;
      if (el.tagName.toLowerCase() !== 'div') continue;

      // Recursively handle nested divs first
      flattenDivs(el);

      // 保留带样式/属性的段落块（如 text-align、class 等），避免破坏富文本结构
      if (!isPlainWrapperDiv(el)) continue;

      const fragment = document.createDocumentFragment();

      // If there is meaningful content before this div, add a <br> line break
      const prev = el.previousSibling;
      const hasPrevContent = prev && (
        (prev.nodeType === Node.ELEMENT_NODE) ||
        (prev.nodeType === Node.TEXT_NODE && !!prev.textContent?.trim())
      );

      if (hasPrevContent) {
        fragment.appendChild(document.createElement('br'));
      }

      if (!isDivEmpty(el)) {
        // Non-empty div: unwrap its children
        while (el.firstChild) {
          fragment.appendChild(el.firstChild);
        }
      }
      // Empty div: do nothing extra, the <br> above already represents the blank line

      parent.replaceChild(fragment, el);
    }
  };

  flattenDivs(temp);

  // 清理由于不稳定 DOM 结构导致的连续空行（保留最多 1 个空白段）
  const collapseConsecutiveBr = (parent: HTMLElement, maxBrInARow = 2) => {
    const children = Array.from(parent.childNodes);
    let brRun = 0;

    for (const node of children) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        if (el.tagName.toLowerCase() === 'br') {
          brRun += 1;
          if (brRun > maxBrInARow) {
            parent.removeChild(el);
          }
          continue;
        }

        brRun = 0;
        if (el.tagName.toLowerCase() !== 'pre') {
          collapseConsecutiveBr(el, maxBrInARow);
        }
        continue;
      }

      if (node.nodeType === Node.TEXT_NODE && !node.textContent?.trim()) {
        continue;
      }

      brRun = 0;
    }
  };

  collapseConsecutiveBr(temp);

  // Alias for trailing cleanup (same logic as isNodeEmpty)
  const isEmpty = isNodeEmpty;

  // 清理首尾空行（中间空行保留）
  const removeTrailing = (parent: HTMLElement) => {
    while (parent.lastChild && isEmpty(parent.lastChild)) {
      parent.removeChild(parent.lastChild);
    }
  };

  const removeLeading = (parent: HTMLElement) => {
    while (parent.firstChild && isEmpty(parent.firstChild)) {
      parent.removeChild(parent.firstChild);
    }
  };

  removeLeading(temp);
  removeTrailing(temp);

  return temp.innerHTML;
};
