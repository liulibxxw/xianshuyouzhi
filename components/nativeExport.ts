
/**
 * 基于 DOM 树的智能文本清理工具
 * 
 * 核心策略：只做末尾空节点清理，不修改正文结构。
 * 保留所有富文本格式（加粗、颜色、字号等），
 * 保留 Android WebView 的 <div> 块级换行结构（它们本身就是正常的行分隔）。
 * 
 * 只清理内容末尾的视觉空白：
 *   - 尾部的 <br> 标签
 *   - 尾部的空 <div>（只含 <br> 或无内容）
 *   - 尾部的空白文本节点
 *   - 尾部的空容器元素（如清理子节点后变空的 <div>/<span> 等）
 */
export const getCleanContent = (html: string): string => {
  if (!html) return '';
  
  const temp = document.createElement('div');
  temp.innerHTML = html;

  /**
   * 判断节点在视觉上是否为"空"（不产生可见内容）
   */
  const isVisuallyEmpty = (node: Node): boolean => {
    if (node.nodeType === Node.TEXT_NODE) {
      return !node.textContent?.replace(/\u00A0/g, ' ').trim();
    }
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      const tag = el.tagName.toLowerCase();
      // <br> 是空行标记
      if (tag === 'br') return true;
      // 媒体/输入元素永远不为空
      if (['img', 'hr', 'input', 'video', 'canvas', 'svg'].includes(tag)) return false;
      // 有 background-image 或 height 的元素可能有视觉内容
      if (el.style.backgroundImage || (el.style.height && el.style.height !== '0px')) return false;
      // 递归检查所有子节点
      if (el.childNodes.length === 0) return true;
      return Array.from(el.childNodes).every(isVisuallyEmpty);
    }
    return true;
  };

  /**
   * 从 parent 的末尾开始，逐个移除视觉为空的节点。
   * 对非空的元素节点，先递归清理其内部末尾，
   * 清理后如果变空则整个移除，否则停止。
   */
  const removeTrailingEmpty = (parent: HTMLElement) => {
    while (parent.lastChild) {
      const node = parent.lastChild;

      if (isVisuallyEmpty(node)) {
        parent.removeChild(node);
        continue;
      }

      // 非空的元素节点：递归清理其内部末尾
      if (node.nodeType === Node.ELEMENT_NODE) {
        removeTrailingEmpty(node as HTMLElement);
        // 清理后如果变空了，移除整个元素并继续
        if (isVisuallyEmpty(node)) {
          parent.removeChild(node);
          continue;
        }
      }

      // 遇到实际内容，停止
      break;
    }
  };

  removeTrailingEmpty(temp);
  
  return temp.innerHTML;
};
