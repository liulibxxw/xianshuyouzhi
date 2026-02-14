
/**
 * 基于 DOM 遍历的文本清理工具
 * 移除末尾的空行和不可见元素，但保留富文本格式
 * 修复 Android WebView 中 contentEditable 生成的多余空行
 *
 * Android WebView contentEditable 典型输出:
 *   第一行文字<div>第二行</div><div><br></div><div>第三行</div>
 * 桌面 Chrome 典型输出:
 *   第一行文字<br>第二行<br><br>第三行
 *
 * 本函数将 Android 格式统一转换为 Chrome 格式（纯 <br> 换行），
 * 然后清理末尾多余的空行。
 */
export const getCleanContent = (html: string): string => {
  if (!html) return '';
  
  const temp = document.createElement('div');
  temp.innerHTML = html;

  // 判断 div 在视觉上是否为空行（只包含 <br> 或完全为空）
  const isDivEmpty = (el: HTMLElement): boolean => {
    if (el.childNodes.length === 0) return true;
    if (el.childNodes.length === 1 && el.firstChild?.nodeType === Node.ELEMENT_NODE 
        && (el.firstChild as HTMLElement).tagName?.toLowerCase() === 'br') return true;
    // 只有空白文本
    if (el.childNodes.length === 1 && el.firstChild?.nodeType === Node.TEXT_NODE 
        && !el.firstChild.textContent?.trim()) return true;
    return false;
  };

  // 将 Android WebView 的 <div> 包裹结构解包为纯 <br> 换行
  // Android contentEditable 中每个 <div> 是独立一行（块级元素），
  // 第一行文字不被 div 包裹，后续每行各一个 <div>：
  //   第一行<div>第二行</div><div><br></div><div>第四行</div>
  // 等价桌面 Chrome:
  //   第一行<br>第二行<br><br>第四行
  //
  // 规则：每个 <div> 前面放一个 <br>（表示上一行结束），
  //       有内容的 <div> 解包内容，空 <div> 不输出内容。
  const flattenDivs = (parent: HTMLElement) => {
    const children = Array.from(parent.childNodes);
    
    for (const child of children) {
      if (child.nodeType !== Node.ELEMENT_NODE) continue;
      const el = child as HTMLElement;
      if (el.tagName.toLowerCase() !== 'div') continue;

      // 先递归处理嵌套的 div
      flattenDivs(el);

      const fragment = document.createDocumentFragment();

      // 如果这个 div 前面有内容（文本或其他元素），加 <br> 换行
      // 如果是容器的第一个有意义的节点，不需要换行
      const prev = el.previousSibling;
      const hasPrevContent = prev && (
        (prev.nodeType === Node.ELEMENT_NODE) ||
        (prev.nodeType === Node.TEXT_NODE && !!prev.textContent?.trim())
      );
      
      if (hasPrevContent) {
        fragment.appendChild(document.createElement('br'));
      }

      if (!isDivEmpty(el)) {
        // 有内容的 <div> → 解包子节点
        while (el.firstChild) {
          fragment.appendChild(el.firstChild);
        }
      }
      // 空 <div> → 不添加任何内容，前面的 <br> 本身就表示空行

      parent.replaceChild(fragment, el);
    }
  };

  flattenDivs(temp);

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
