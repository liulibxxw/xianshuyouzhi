
/**
 * 基于 DOM 遍历的文本清理工具
 * 移除末尾的空行和不可见元素，但保留富文本格式
 * 修复 Android WebView 中 contentEditable 生成的多余空行
 */
export const getCleanContent = (html: string): string => {
  if (!html) return '';
  
  const temp = document.createElement('div');
  temp.innerHTML = html;

  // Android WebView 的 contentEditable 会将每一行包在 <div> 中，
  // 空行变成 <div><br></div>，导致导出时出现双倍行距的额外空行。
  // 这里将仅包含 <br> 的 <div> 替换为单个 <br>，规范化换行结构。
  const normalizeDivBr = (parent: HTMLElement) => {
    const children = Array.from(parent.childNodes);
    for (const child of children) {
      if (child.nodeType !== Node.ELEMENT_NODE) continue;
      const el = child as HTMLElement;
      const tag = el.tagName.toLowerCase();
      
      if (tag === 'div') {
        // 情况1: <div><br></div> → 替换为 <br>
        if (el.childNodes.length === 1 && el.firstChild?.nodeType === Node.ELEMENT_NODE && (el.firstChild as HTMLElement).tagName?.toLowerCase() === 'br') {
          const br = document.createElement('br');
          parent.replaceChild(br, el);
          continue;
        }
        // 情况2: <div></div>（完全空的 div）→ 替换为 <br>
        if (el.childNodes.length === 0) {
          const br = document.createElement('br');
          parent.replaceChild(br, el);
          continue;
        }
        // 情况3: <div> 中有实际内容 — 将 <div> 解包为内联内容 + <br>
        // Android WebView 会把每一行文字包在 <div> 中，如:
        //   第一行文字<div>第二行</div><div>第三行</div>
        // 这会导致导出时每行被渲染为独立块级元素，行距变大。
        // 解包后变为: 第一行文字<br>第二行<br>第三行，行距由 line-height 统一控制。
        normalizeDivBr(el); // 先递归处理内部嵌套的 div
        const fragment = document.createDocumentFragment();
        // 如果前一个兄弟节点不是 <br>，在解包前插入 <br> 保持换行
        const prevSibling = el.previousSibling;
        if (prevSibling && !(prevSibling.nodeType === Node.ELEMENT_NODE && (prevSibling as HTMLElement).tagName?.toLowerCase() === 'br')) {
          fragment.appendChild(document.createElement('br'));
        }
        while (el.firstChild) {
          fragment.appendChild(el.firstChild);
        }
        parent.replaceChild(fragment, el);
      }
    }
  };

  normalizeDivBr(temp);

  // 判断节点是否在视觉上为空（用于判断末尾空行）
  const isEmpty = (node: Node): boolean => {
    if (node.nodeType === Node.TEXT_NODE) {
      // 将 nbsp 替换为空格后检查是否为空白
      return !node.textContent?.replace(/\u00A0/g, ' ').trim();
    }
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      const tag = el.tagName.toLowerCase();
      
      // br 标签被视为空白（需要被清理的末尾换行）
      if (tag === 'br') return true;
      
      // 媒体元素不视为空
      if (tag === 'img' || tag === 'hr' || tag === 'input' || tag === 'video') return false;
      
      // 递归检查子元素
      return Array.from(node.childNodes).every(isEmpty);
    }
    // 其他节点（如注释）视为空
    return true;
  };

  // 递归移除末尾的空节点
  const removeTrailing = (parent: HTMLElement) => {
    const nodes = Array.from(parent.childNodes);
    // 从后往前遍历
    for (let i = nodes.length - 1; i >= 0; i--) {
        const node = nodes[i];
        
        if (isEmpty(node)) {
            // 如果本身是空节点（如 br 或 空文本），直接移除
            parent.removeChild(node);
        } else {
            // 如果是元素节点（且非空），尝试清理其内部的末尾空行
            if (node.nodeType === Node.ELEMENT_NODE) {
                removeTrailing(node as HTMLElement);
                
                // 清理完内部后，如果它变成了空元素（例如 <div><br></div> -> <div></div>），则移除该容器
                if (isEmpty(node)) {
                    parent.removeChild(node);
                    continue; // 继续检查前一个节点
                }
            }
            // 遇到非空内容，停止清理
            break;
        }
    }
  };

  removeTrailing(temp);
  
  return temp.innerHTML;
};
