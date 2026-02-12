
import { CoverState } from '../types';

const SCALE = 4;
const BASE_WIDTH = 400;
const CANVAS_WIDTH = BASE_WIDTH * SCALE;
const PADDING = 24 * SCALE;

// 字体定义
const FONT_FAMILY = '"Noto Serif SC", serif';

/**
 * 核心修复：基于 DOM 遍历的文本标准化
 * 彻底解决 Android 端因 innerText 或正则替换导致的"自动插入空行"问题
 */
const normalizeText = (html: string): string => {
  if (!html) return '';
  
  const temp = document.createElement('div');
  temp.innerHTML = html;

  let text = '';
  const blockTags = new Set([
    'div', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 
    'li', 'ul', 'ol', 'tr', 'blockquote', 'article', 'section', 'header', 'footer'
  ]);

  const walk = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const content = node.textContent || '';
      text += content.replace(/[\n\t\r]+/g, ' '); 
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      const tagName = el.tagName.toLowerCase();
      
      if (tagName === 'br') {
        text += '\n';
      } else {
        node.childNodes.forEach(walk);
        if (blockTags.has(tagName)) {
           if (text.length > 0 && !text.endsWith('\n')) {
             text += '\n';
           }
        }
      }
    }
  };

  walk(temp);
  return text.replace(/\n{3,}/g, '\n\n').trim();
};

const wrapText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): { lines: string[], height: number } => {
  const paragraphs = text.split('\n');
  const lines: string[] = [];
  // 获取当前字体的大致行高（基于M的宽度估算或固定倍率）
  const metrics = ctx.measureText('M');
  // 简易行高计算：font size * 1.6
  const fontSizeMatch = ctx.font.match(/(\d+)px/);
  const fontSize = fontSizeMatch ? parseInt(fontSizeMatch[1]) : 13 * SCALE;
  const lineHeight = fontSize * 1.6;

  paragraphs.forEach(paragraph => {
    if (paragraph === '') {
        lines.push('');
        return;
    }
    let line = '';
    const chars = Array.from(paragraph);
    
    for (let i = 0; i < chars.length; i++) {
      const testLine = line + chars[i];
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > maxWidth && line.length > 0) {
        lines.push(line);
        line = chars[i];
      } else {
        line = testLine;
      }
    }
    lines.push(line);
  });

  return {
    lines,
    height: lines.length * lineHeight
  };
};

const drawNoise = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const imageData = ctx.createImageData(width, height);
    const buffer32 = new Uint32Array(imageData.data.buffer);
    const len = buffer32.length;
    for (let i = 0; i < len; i++) {
        // Reduced probability and alpha for subtler noise matching web preview
        if (Math.random() < 0.3) {
             // Little Endian: AABBGGRR. 0x05000000 is Alpha=5 (approx 2%), Black
             buffer32[i] = 0x05000000; 
        }
    }
    ctx.putImageData(imageData, 0, 0);
};

export const generateNativeCover = async (state: CoverState): Promise<string> => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Cannot create canvas context');

  // 1. Prepare Content
  const title = state.title || '无标题';
  const subtitle = state.subtitle || '';
  const bodyTextRaw = state.layoutStyle === 'duality' ? state.dualityBodyText : state.bodyText;
  const bodyText2Raw = state.layoutStyle === 'duality' ? state.dualitySecondaryBodyText : state.secondaryBodyText;
  const author = state.author || '';
  const categories = state.category ? state.category.split(/[、, ]/).filter(Boolean) : [];
  
  const bodyText = normalizeText(bodyTextRaw);
  const bodyText2 = normalizeText(bodyText2Raw);

  // Stats for Minimal Layout
  const readingLength = bodyText.replace(/\s/g, '').length;
  const readingTime = Math.max(1, Math.ceil(readingLength / 400));

  // 2. Setup Fonts
  const getTitleFont = (text: string, baseSize: number) => {
      let size = baseSize;
      if (text.length > 30) size *= 0.4;
      else if (text.length > 20) size *= 0.5;
      else if (text.length > 14) size *= 0.6;
      else if (text.length > 10) size *= 0.75;
      else if (text.length > 8) size *= 0.85;
      return `900 ${size}px ${FONT_FAMILY}`;
  };

  const titleSizeBase = 36 * SCALE;
  const subtitleFont = `700 ${14 * SCALE}px ${FONT_FAMILY}`;
  // Extract font size from state like "text-[13px]"
  const sizeMatch = state.bodyTextSize?.match(/(\d+)px/);
  const bodyFontSize = (sizeMatch ? parseInt(sizeMatch[1]) : 13) * SCALE;
  const bodyFont = `500 ${bodyFontSize}px ${FONT_FAMILY}`;
  const monoFont = `bold ${10 * SCALE}px monospace`;
  const lineHeight = bodyFontSize * 1.5;

  // 3. Calculate Geometry
  let canvasHeight = state.mode === 'cover' ? (state.layoutStyle === 'minimal' ? 440 : 500) * SCALE : 800 * SCALE; 
  if (state.mode === 'cover' && state.layoutStyle === 'minimal') canvasHeight = 440 * SCALE; // Force 440 for minimal cover
  
  const contentWidth = CANVAS_WIDTH - (PADDING * 2);

  ctx.font = bodyFont;
  const wrappedBody1 = wrapText(ctx, bodyText, contentWidth);
  const wrappedBody2 = wrapText(ctx, bodyText2, contentWidth);

  if (state.mode === 'long-text') {
      let contentHeight = 200 * SCALE; // Header buffer
      contentHeight += wrappedBody1.height + (100 * SCALE);
      if (state.layoutStyle === 'duality') contentHeight += wrappedBody2.height + (200 * SCALE);
      contentHeight += 150 * SCALE; // Footer buffer
      canvasHeight = Math.max(canvasHeight, contentHeight);
  }

  // 4. Initialize Canvas
  canvas.width = CANVAS_WIDTH;
  canvas.height = canvasHeight;
  
  // --- BACKGROUND RENDERING ---
  // A. Solid Color
  ctx.fillStyle = state.backgroundColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // B. White Radial Gradient Overlay (Fixes "greyish" issue)
  const gradient = ctx.createRadialGradient(
    canvas.width * 0.1, canvas.height * 0.2, 0,
    canvas.width * 0.1, canvas.height * 0.2, canvas.width * 0.8
  );
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // C. Grid Pattern (except Duality)
  if (state.layoutStyle !== 'duality') {
      ctx.save();
      ctx.strokeStyle = state.textColor;
      ctx.globalAlpha = 0.05;
      ctx.lineWidth = 1 * SCALE;
      const gridSize = 40 * SCALE;
      // Using dots/crosses simulation for grid
      for(let x=0; x<canvas.width; x+=gridSize) {
          for(let y=0; y<canvas.height; y+=gridSize) {
               // Draw little crosses
               ctx.beginPath();
               ctx.moveTo(x, y); ctx.lineTo(x + 1*SCALE, y);
               ctx.moveTo(x, y); ctx.lineTo(x, y + 1*SCALE);
               ctx.stroke();
          }
      }
      ctx.restore();
  }

  // D. Noise
  drawNoise(ctx, canvas.width, canvas.height);

  // --- CONTENT RENDERING ---
  ctx.fillStyle = state.textColor;
  ctx.textBaseline = 'top';

  if (state.layoutStyle === 'duality') {
      // === DUALITY ===
      const halfHeight = canvasHeight / 2;
      let cursorY = PADDING;

      // 01 Background
      ctx.save();
      ctx.font = `900 ${144 * SCALE}px ${FONT_FAMILY}`;
      ctx.globalAlpha = 0.06;
      ctx.fillText('01', -24 * SCALE, isLongText(state) ? 200 * SCALE : canvasHeight/2 - 100*SCALE); 
      ctx.restore();

      // Header: Categories left, Title right
      const headerY = PADDING;
      // Categories
      ctx.save();
      ctx.font = `bold ${9 * SCALE}px ${FONT_FAMILY}`;
      let catY = headerY;
      categories.forEach(cat => {
          ctx.strokeStyle = state.textColor;
          ctx.lineWidth = 2 * SCALE;
          ctx.beginPath();
          ctx.moveTo(PADDING + 2*SCALE, catY);
          ctx.lineTo(PADDING + 2*SCALE, catY + 14*SCALE);
          ctx.stroke();
          ctx.fillText(cat, PADDING + 8*SCALE, catY);
          catY += 18 * SCALE;
      });
      ctx.restore();

      // Title Right
      ctx.save();
      ctx.textAlign = 'right';
      ctx.font = getTitleFont(title, 36 * SCALE); // Dynamic sizing
      ctx.fillText(title, CANVAS_WIDTH - PADDING, headerY);
      
      // Subtitle
      const subY = headerY + 45 * SCALE;
      ctx.font = `bold ${12 * SCALE}px ${FONT_FAMILY}`;
      ctx.globalAlpha = 0.8;
      ctx.fillText(`○ ${subtitle} ●`, CANVAS_WIDTH - PADDING, subY);
      ctx.restore();

      cursorY = Math.max(catY, subY + 30 * SCALE);

      // Body 1
      ctx.font = bodyFont;
      wrappedBody1.lines.forEach(line => {
          ctx.fillText(line, PADDING, cursorY);
          cursorY += lineHeight;
      });

      // Divider Section
      cursorY += 20 * SCALE;
      // Diagonal gradient line simulation
      const splitHeight = 40 * SCALE;
      const gradLine = ctx.createLinearGradient(0, cursorY, CANVAS_WIDTH, cursorY + splitHeight);
      gradLine.addColorStop(0.45, "rgba(0,0,0,0)");
      gradLine.addColorStop(0.5, state.textColor);
      gradLine.addColorStop(0.55, "rgba(0,0,0,0)");
      ctx.save();
      ctx.fillStyle = gradLine;
      ctx.globalAlpha = 0.2; 
      ctx.fillRect(0, cursorY, CANVAS_WIDTH, splitHeight);
      ctx.restore();
      
      // Central Dot
      ctx.beginPath();
      ctx.arc(CANVAS_WIDTH/2, cursorY + splitHeight/2, 4*SCALE, 0, Math.PI*2);
      ctx.fillStyle = state.textColor;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(CANVAS_WIDTH/2, cursorY + splitHeight/2, 2*SCALE, 0, Math.PI*2);
      ctx.fillStyle = state.accentColor;
      ctx.fill();
      ctx.fillStyle = state.textColor; // reset

      cursorY += splitHeight + 20 * SCALE;

      // 02 Background
      ctx.save();
      ctx.font = `900 ${144 * SCALE}px ${FONT_FAMILY}`;
      ctx.globalAlpha = 0.06;
      ctx.textAlign = 'right';
      ctx.fillText('02', CANVAS_WIDTH + 24*SCALE, cursorY);
      ctx.restore();

      // Bottom Background Accent
      ctx.save();
      ctx.fillStyle = state.accentColor;
      ctx.globalAlpha = 0.1;
      // Approximating the CSS background gradient
      ctx.fillRect(0, cursorY, CANVAS_WIDTH, canvasHeight - cursorY);
      ctx.restore();

      // Body 2
      ctx.font = bodyFont;
      wrappedBody2.lines.forEach(line => {
          ctx.fillText(line, PADDING, cursorY);
          cursorY += lineHeight;
      });

      // Footer
      const footerY = canvasHeight - PADDING - 40 * SCALE;
      // Identity Bar
      ctx.fillRect(PADDING, footerY, 2*SCALE, 30*SCALE);
      
      ctx.save();
      ctx.font = `bold ${8 * SCALE}px monospace`;
      ctx.fillText('IDENTITY', PADDING + 10*SCALE, footerY);
      ctx.font = `900 italic ${20 * SCALE}px ${FONT_FAMILY}`;
      ctx.fillText(state.author, PADDING + 10*SCALE, footerY + 12*SCALE);
      ctx.restore();

      // Tech details right
      ctx.save();
      ctx.textAlign = 'right';
      ctx.font = `normal ${8 * SCALE}px monospace`;
      ctx.globalAlpha = 0.6;
      ctx.fillText('SYS.READY', CANVAS_WIDTH - PADDING, footerY + 10*SCALE);
      ctx.font = `normal ${6 * SCALE}px monospace`;
      ctx.fillText(`LOC: 32.45.11 N`, CANVAS_WIDTH - PADDING, footerY + 25*SCALE);
      ctx.restore();

  } else if (state.layoutStyle === 'split') {
      // === SPLIT / MOVIE ===
      let cursorY = PADDING + 20 * SCALE;

      // Center White Glow (simulated with radial gradient)
      ctx.save();
      const glow = ctx.createRadialGradient(CANVAS_WIDTH/2, cursorY + 60*SCALE, 0, CANVAS_WIDTH/2, cursorY + 60*SCALE, 150*SCALE);
      glow.addColorStop(0, 'rgba(255,255,255,0.8)');
      glow.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, cursorY - 50*SCALE, CANVAS_WIDTH, 200*SCALE);
      ctx.restore();

      ctx.save();
      ctx.textAlign = 'center';
      
      // "The Story Of"
      ctx.font = `normal ${10 * SCALE}px ${FONT_FAMILY}`;
      ctx.globalAlpha = 0.7;
      ctx.fillText('THE STORY OF', CANVAS_WIDTH/2, cursorY);
      cursorY += 20 * SCALE;

      // Title
      ctx.font = getTitleFont(title, 48 * SCALE);
      ctx.globalAlpha = 1.0;
      ctx.fillText(title, CANVAS_WIDTH/2, cursorY);
      cursorY += 50 * SCALE; // Adjust based on font size

      // Subtitle with lines
      const subWidth = ctx.measureText(subtitle).width;
      const lineWidth = Math.max(subWidth + 40*SCALE, 100*SCALE);
      
      ctx.font = subtitleFont;
      // Top line
      ctx.globalAlpha = 0.4;
      ctx.beginPath();
      ctx.moveTo((CANVAS_WIDTH - lineWidth)/2, cursorY);
      ctx.lineTo((CANVAS_WIDTH + lineWidth)/2, cursorY);
      ctx.stroke();
      
      ctx.globalAlpha = 1.0;
      ctx.fillText(subtitle, CANVAS_WIDTH/2, cursorY + 8*SCALE);

      // Bottom line
      ctx.globalAlpha = 0.4;
      ctx.beginPath();
      ctx.moveTo((CANVAS_WIDTH - lineWidth)/2, cursorY + 28*SCALE);
      ctx.lineTo((CANVAS_WIDTH + lineWidth)/2, cursorY + 28*SCALE);
      ctx.stroke();
      
      cursorY += 60 * SCALE;
      ctx.restore();

      // Body
      // Accent shape background
      ctx.save();
      ctx.fillStyle = state.accentColor;
      ctx.globalAlpha = 0.2;
      ctx.beginPath();
      ctx.moveTo(CANVAS_WIDTH, 0);
      ctx.arc(CANVAS_WIDTH - 20*SCALE, 60*SCALE, 100*SCALE, 0, Math.PI*2);
      ctx.fill();
      ctx.restore();

      ctx.font = bodyFont;
      wrappedBody1.lines.forEach(line => {
          ctx.fillText(line, PADDING, cursorY);
          cursorY += lineHeight;
      });

      // Footer
      const footerY = Math.max(cursorY + 40*SCALE, canvasHeight - PADDING - 40*SCALE);
      
      // Divider
      ctx.save();
      ctx.globalAlpha = 0.3;
      ctx.beginPath(); 
      ctx.moveTo(PADDING, footerY); 
      ctx.lineTo(CANVAS_WIDTH - PADDING, footerY); 
      ctx.stroke();
      ctx.restore();

      // Screenplay / Author
      ctx.save();
      ctx.textAlign = 'center';
      ctx.font = `bold ${8 * SCALE}px monospace`;
      ctx.fillText('SCREENPLAY', CANVAS_WIDTH/2 - 40*SCALE, footerY + 15*SCALE);
      ctx.font = `italic ${12 * SCALE}px ${FONT_FAMILY}`;
      ctx.fillText(author, CANVAS_WIDTH/2 + 20*SCALE, footerY + 15*SCALE);
      
      // Categories / NO.
      const bottomY = footerY + 35 * SCALE;
      ctx.font = `bold ${8 * SCALE}px monospace`;
      ctx.globalAlpha = 0.6;
      ctx.fillText(`NO. ${Date.now().toString().slice(-4)}`, CANVAS_WIDTH - PADDING - 40*SCALE, bottomY); // approximate right pos
      
      // Categories boxes
      let catX = PADDING + 20*SCALE;
      categories.forEach(cat => {
          const w = ctx.measureText(cat).width + 10*SCALE;
          ctx.strokeRect(catX, bottomY - 8*SCALE, w, 14*SCALE);
          ctx.fillText(cat, catX + w/2, bottomY - 5*SCALE); // Center in box
          catX += w + 10*SCALE;
      });
      ctx.restore();

  } else {
      // === MINIMAL / DEFAULT ===
      let cursorY = PADDING;

      // Header Row 1: SYSTEM_NORMAL | Stats
      ctx.save();
      // Left: System Normal
      ctx.fillStyle = state.accentColor;
      ctx.fillRect(PADDING, cursorY + 2*SCALE, 6*SCALE, 6*SCALE); // Pulse dot
      ctx.fillStyle = state.textColor;
      ctx.font = `bold ${9 * SCALE}px monospace`;
      ctx.fillText('SYSTEM_NORMAL', PADDING + 12*SCALE, cursorY);
      
      // Stats
      ctx.globalAlpha = 0.6;
      ctx.font = `normal ${8 * SCALE}px monospace`;
      ctx.fillText(`全文约${readingLength}字 预计阅读用时${readingTime}分`, PADDING + 110*SCALE, cursorY + 1*SCALE);
      
      // Right: REC
      ctx.textAlign = 'right';
      ctx.fillText(`REC-${Math.floor(Math.random()*9999)}`, CANVAS_WIDTH - PADDING, cursorY);
      ctx.restore();

      cursorY += 20 * SCALE;
      
      // Divider Line
      ctx.save();
      ctx.globalAlpha = 0.4;
      ctx.beginPath();
      ctx.moveTo(PADDING, cursorY);
      ctx.lineTo(CANVAS_WIDTH - PADDING, cursorY);
      ctx.stroke();
      ctx.restore();
      
      cursorY += 20 * SCALE;

      // Categories
      ctx.save();
      let catX = PADDING;
      categories.forEach(cat => {
          // Shadow box
          ctx.fillStyle = 'rgba(255,255,255,0.4)';
          ctx.fillRect(catX, cursorY, 60*SCALE, 16*SCALE);
          // Border
          ctx.strokeStyle = state.textColor;
          ctx.lineWidth = 1 * SCALE;
          ctx.strokeRect(catX, cursorY, 60*SCALE, 16*SCALE);
          // Accent bar right
          ctx.fillStyle = state.accentColor;
          ctx.fillRect(catX + 56*SCALE, cursorY, 4*SCALE, 16*SCALE);
          
          // Text
          ctx.fillStyle = state.textColor;
          ctx.font = `bold ${9 * SCALE}px ${FONT_FAMILY}`;
          ctx.fillText(cat.toUpperCase(), catX + 6*SCALE, cursorY + 2*SCALE);
          
          catX += 70 * SCALE;
      });
      ctx.restore();
      
      cursorY += 30 * SCALE;

      // Title
      ctx.save();
      ctx.font = getTitleFont(title, 36 * SCALE);
      ctx.fillText(title, PADDING, cursorY);
      ctx.restore();
      
      cursorY += 45 * SCALE;

      // Title Divider
      ctx.save();
      ctx.globalAlpha = 0.2;
      ctx.beginPath();
      ctx.moveTo(PADDING, cursorY);
      ctx.lineTo(CANVAS_WIDTH - PADDING, cursorY);
      ctx.stroke();
      ctx.restore();
      
      cursorY += 15 * SCALE;

      // Subtitle
      ctx.save();
      ctx.font = `bold ${14 * SCALE}px ${FONT_FAMILY}`;
      ctx.fillText(`/ ${subtitle}`, PADDING, cursorY);
      ctx.restore();
      
      cursorY += 30 * SCALE;

      // Archive Bar
      // ARCHIVE [Line] REF.07
      ctx.save();
      ctx.fillStyle = state.textColor;
      // Archive Box
      ctx.fillRect(PADDING, cursorY, 50*SCALE, 14*SCALE);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = `bold ${9 * SCALE}px monospace`;
      ctx.fillText('ARCHIVE', PADDING + 6*SCALE, cursorY + 2*SCALE);
      
      // Line
      ctx.fillStyle = state.textColor;
      ctx.globalAlpha = 0.3;
      ctx.fillRect(PADDING + 55*SCALE, cursorY + 6*SCALE, 200*SCALE, 1*SCALE);
      
      // Ref
      ctx.globalAlpha = 0.4;
      ctx.fillText('REF.07', CANVAS_WIDTH - PADDING - 40*SCALE, cursorY + 2*SCALE);
      ctx.restore();
      
      cursorY += 20 * SCALE;

      // Body Container
      // Left vertical line
      ctx.save();
      ctx.globalAlpha = 0.2;
      ctx.fillRect(PADDING, cursorY, 1*SCALE, wrappedBody1.height + 20*SCALE);
      ctx.globalAlpha = 1.0;
      // Top accent bar
      ctx.fillStyle = state.accentColor;
      ctx.fillRect(PADDING, cursorY, 4*SCALE, 30*SCALE);
      ctx.restore();

      // Text
      ctx.save();
      ctx.font = bodyFont;
      // Indent text by 24px (6 * SCALE) to match preview pl-6
      const bodyX = PADDING + 24 * SCALE; 
      wrappedBody1.lines.forEach(line => {
          ctx.fillText(line, bodyX, cursorY);
          cursorY += lineHeight;
      });
      ctx.restore();
      
      // Footer
      cursorY += 30 * SCALE;
      // Dashed line
      ctx.save();
      ctx.globalAlpha = 0.4;
      ctx.setLineDash([4 * SCALE, 4 * SCALE]);
      ctx.beginPath();
      ctx.moveTo(PADDING, cursorY);
      ctx.lineTo(CANVAS_WIDTH - PADDING, cursorY);
      ctx.stroke();
      ctx.restore();
      
      cursorY += 15 * SCALE;
      
      ctx.save();
      // Decor dots
      ctx.globalAlpha = 0.2;
      ctx.fillRect(PADDING, cursorY - 25*SCALE, 16*SCALE, 4*SCALE); // Simple rect for dots
      
      // Auth / Author
      ctx.font = `normal ${8 * SCALE}px monospace`;
      ctx.globalAlpha = 0.5;
      ctx.fillText('AUTHORIZED PERSONNEL', PADDING, cursorY);
      
      ctx.globalAlpha = 1.0;
      ctx.font = `bold ${12 * SCALE}px ${FONT_FAMILY}`;
      ctx.fillText(state.author.toUpperCase(), PADDING, cursorY + 12*SCALE);
      
      // Year
      ctx.textAlign = 'right';
      ctx.font = `normal ${20 * SCALE}px monospace`;
      ctx.globalAlpha = 0.2;
      ctx.fillText(new Date().getFullYear().toString(), CANVAS_WIDTH - PADDING, cursorY + 10*SCALE);
      ctx.restore();
  }

  return canvas.toDataURL('image/png', 1.0);
};

function isLongText(state: CoverState) {
    return state.mode === 'long-text';
}
