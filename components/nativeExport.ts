
/**
 * 基于 DOM 遍历的文本清理工具
 * 移除末尾的空行和不可见元素，但保留富文本格式
 */
export const getCleanContent = (html: string): string => {
  if (!html) return '';
  
  const temp = document.createElement('div');
  temp.innerHTML = html;

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
