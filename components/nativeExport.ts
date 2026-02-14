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

  // Flatten Android WebView <div> wrappers into plain <br> line breaks.
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
  const flattenDivs = (parent: HTMLElement) => {
    const children = Array.from(parent.childNodes);

    for (const child of children) {
      if (child.nodeType !== Node.ELEMENT_NODE) continue;
      const el = child as HTMLElement;
      if (el.tagName.toLowerCase() !== 'div') continue;

      // Recursively handle nested divs first
      flattenDivs(el);

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

  // Alias for trailing cleanup (same logic as isNodeEmpty)
  const isEmpty = isNodeEmpty;

  // Recursively remove trailing empty nodes
  const removeTrailing = (parent: HTMLElement) => {
    const nodes = Array.from(parent.childNodes);
    for (let i = nodes.length - 1; i >= 0; i--) {
      const node = nodes[i];

      if (isEmpty(node)) {
        parent.removeChild(node);
      } else {
        if (node.nodeType === Node.ELEMENT_NODE) {
          removeTrailing(node as HTMLElement);
          if (isEmpty(node)) {
            parent.removeChild(node);
            continue;
          }
        }
        break;
      }
    }
  };

  removeTrailing(temp);

  return temp.innerHTML;
};
