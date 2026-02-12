
/**
 * 基于 DOM 遍历的文本标准化工具
 * 提取纯文本结构并重新生成简洁的 HTML，消除 contenteditable 产生的多余空行标签
 */
export const getCleanContent = (html: string): string => {
  if (!html) return '';
  
  // 创建虚拟 DOM 容器解析 HTML
  const temp = document.createElement('div');
  temp.innerHTML = html;

  let text = '';
  // 定义会产生换行的块级标签
  const blockTags = new Set([
    'div', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 
    'li', 'ul', 'ol', 'tr', 'blockquote', 'article', 'section', 'header', 'footer'
  ]);

  // 递归遍历节点
  const walk = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const content = node.textContent || '';
      // 1. 将源码中的换行/制表符视为空格，防止代码格式化导致的意外换行
      text += content.replace(/[\n\t\r]+/g, ' '); 
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      const tagName = el.tagName.toLowerCase();
      
      if (tagName === 'br') {
        // <br> 显式转换为换行
        text += '\n';
      } else {
        // 递归处理子元素
        node.childNodes.forEach(walk);
        
        // 2. 智能换行逻辑：
        // 仅当块级元素结束、且缓冲区末尾尚无换行符时，才追加换行。
        if (blockTags.has(tagName)) {
           if (text.length > 0 && !text.endsWith('\n')) {
             text += '\n';
           }
        }
      }
    }
  };

  walk(temp);

  // 3. 压缩连续换行：允许最多两个连续换行（即一段空白），去除更多多余的
  // 如果需要更激进地消除所有空行，可以将 {3,} 改为 {2,} 并替换为 \n
  const plainText = text.replace(/\n{3,}/g, '\n\n').trim();
  
  // 4. 转义 HTML 实体并转换换行为 <br/>
  // 这样 innerHTML 渲染时就是干净的结构，没有多余的 div 嵌套
  return plainText
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, '<br/>');
};
