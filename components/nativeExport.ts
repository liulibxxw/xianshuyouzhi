
import { CoverState, LayoutStyle } from '../types';

const SCALE = 4;
const BASE_WIDTH = 400;
const CANVAS_WIDTH = BASE_WIDTH * SCALE;
const PADDING = 24 * SCALE;

// Helper: Strip HTML and normalize text
const normalizeText = (html: string): string => {
  if (!html) return '';
  const temp = document.createElement('div');
  // Pre-process common block tags to newlines for better text flow
  let processed = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/li>/gi, '\n');
  temp.innerHTML = processed;
  return temp.innerText.trim();
};

// Helper: Wrap text
const wrapText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  lineHeight: number
): { lines: string[], height: number } => {
  const paragraphs = text.split('\n');
  const lines: string[] = [];

  paragraphs.forEach(paragraph => {
    let line = '';
    const chars = paragraph.split('');
    
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
    // Add extra spacing for paragraphs if needed, or just keep as is
  });

  return {
    lines,
    height: lines.length * lineHeight
  };
};

// Helper: Draw Noise
const drawNoise = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const imageData = ctx.createImageData(width, height);
    const buffer32 = new Uint32Array(imageData.data.buffer);
    const len = buffer32.length;
    for (let i = 0; i < len; i++) {
        if (Math.random() < 0.05) {
            buffer32[i] = 0x10000000; // Minimal alpha black noise
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

  // 2. Setup Fonts
  const titleFont = `900 ${36 * SCALE}px "Noto Serif SC", serif`;
  const subtitleFont = `700 ${14 * SCALE}px "Noto Serif SC", serif`;
  const bodyFont = `500 ${13 * SCALE}px "Noto Serif SC", serif`;
  const metaFont = `bold ${10 * SCALE}px monospace`;
  const lineHeight = 1.6 * 13 * SCALE;

  // 3. Calculate Geometry based on Layout
  let canvasHeight = state.mode === 'cover' ? 500 * SCALE : 800 * SCALE; // Default start
  const contentWidth = CANVAS_WIDTH - (PADDING * 2);

  // Simulating measurement to determine height for long-text mode
  ctx.font = bodyFont;
  const wrappedBody1 = wrapText(ctx, bodyText, contentWidth, lineHeight);
  const wrappedBody2 = wrapText(ctx, bodyText2, contentWidth, lineHeight);

  if (state.mode === 'long-text') {
      let contentHeight = 0;
      // Header Area Estimate
      contentHeight += 150 * SCALE; 
      // Body 1
      contentHeight += wrappedBody1.height + (40 * SCALE);
      
      if (state.layoutStyle === 'duality') {
          contentHeight += wrappedBody2.height + (100 * SCALE);
      }
      
      // Footer
      contentHeight += 100 * SCALE;
      
      canvasHeight = Math.max(canvasHeight, contentHeight);
  } else {
     // Fixed heights for cover mode
     canvasHeight = (state.layoutStyle === 'duality' || state.layoutStyle === 'split') ? 500 * SCALE : 440 * SCALE;
  }

  // 4. Initialize Canvas
  canvas.width = CANVAS_WIDTH;
  canvas.height = canvasHeight;
  
  // Fill Background
  ctx.fillStyle = state.backgroundColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw Subtle Grid/Noise
  if (state.layoutStyle !== 'duality') {
      ctx.strokeStyle = state.textColor;
      ctx.globalAlpha = 0.05;
      ctx.lineWidth = 1 * SCALE;
      // Draw grid points
      for(let x=0; x<canvas.width; x+=40*SCALE) {
          for(let y=0; y<canvas.height; y+=40*SCALE) {
              ctx.beginPath();
              ctx.moveTo(x, y);
              ctx.lineTo(x + 1*SCALE, y);
              ctx.stroke();
              ctx.beginPath();
              ctx.moveTo(x, y);
              ctx.lineTo(x, y + 1*SCALE);
              ctx.stroke();
          }
      }
      ctx.globalAlpha = 1.0;
  }

  // Draw Noise Layer
  drawNoise(ctx, canvas.width, canvas.height);

  // 5. Draw Layout Specifics
  ctx.fillStyle = state.textColor;
  ctx.textBaseline = 'top';

  if (state.layoutStyle === 'duality') {
      // --- DUALITY LAYOUT ---
      const halfHeight = canvasHeight / 2;
      
      // Top Section
      let cursorY = PADDING;
      
      // Background Number 01
      ctx.font = `900 ${144 * SCALE}px "Noto Serif SC"`;
      ctx.globalAlpha = 0.06;
      ctx.fillText('01', -24 * SCALE, canvasHeight - halfHeight - (50 * SCALE)); // Rough positioning
      ctx.globalAlpha = 1.0;

      // Categories
      ctx.font = `bold ${9 * SCALE}px "Noto Serif SC"`;
      categories.forEach((cat, i) => {
          ctx.strokeStyle = state.textColor;
          ctx.lineWidth = 2 * SCALE;
          ctx.beginPath();
          ctx.moveTo(PADDING + 2*SCALE, cursorY);
          ctx.lineTo(PADDING + 2*SCALE, cursorY + 14*SCALE);
          ctx.stroke();
          ctx.fillText(cat, PADDING + 8*SCALE, cursorY);
          cursorY += 18 * SCALE;
      });

      cursorY += 10 * SCALE;
      
      // Title
      ctx.textAlign = 'right';
      ctx.font = titleFont;
      const safeTitleWidth = CANVAS_WIDTH - PADDING * 2 - 40 * SCALE;
      // Simple font scaling for title
      if (title.length > 8) ctx.font = `900 ${24 * SCALE}px "Noto Serif SC"`;
      if (title.length > 12) ctx.font = `900 ${18 * SCALE}px "Noto Serif SC"`;
      ctx.fillText(title, CANVAS_WIDTH - PADDING, PADDING);
      
      // Subtitle
      ctx.font = subtitleFont;
      ctx.globalAlpha = 0.8;
      ctx.fillText(`○ ${subtitle} ●`, CANVAS_WIDTH - PADDING, PADDING + 45 * SCALE);
      ctx.globalAlpha = 1.0;
      
      // Body 1
      ctx.textAlign = 'left';
      ctx.font = bodyFont;
      cursorY = Math.max(cursorY, PADDING + 80 * SCALE);
      wrappedBody1.lines.forEach(line => {
          ctx.fillText(line, PADDING, cursorY);
          cursorY += lineHeight;
      });

      // Split Line / Decor
      const splitY = cursorY + 30 * SCALE;
      ctx.fillStyle = state.textColor;
      ctx.beginPath();
      ctx.arc(CANVAS_WIDTH/2, splitY, 4*SCALE, 0, Math.PI*2);
      ctx.fill();
      
      // Gradient line simulation
      const grad = ctx.createLinearGradient(0, splitY, CANVAS_WIDTH, splitY + 40*SCALE);
      grad.addColorStop(0.49, "transparent");
      grad.addColorStop(0.5, state.textColor);
      grad.addColorStop(0.51, "transparent");
      ctx.fillStyle = grad;
      ctx.fillRect(0, splitY - 20*SCALE, CANVAS_WIDTH, 40*SCALE);

      // Bottom Section
      ctx.fillStyle = state.textColor;
      cursorY = splitY + 50 * SCALE;
      
      // Background Number 02
      ctx.font = `900 ${144 * SCALE}px "Noto Serif SC"`;
      ctx.globalAlpha = 0.06;
      ctx.textAlign = 'right';
      ctx.fillText('02', CANVAS_WIDTH + 24*SCALE, splitY - 50*SCALE);
      ctx.globalAlpha = 1.0;
      ctx.textAlign = 'left';

      // Accent Background
      ctx.fillStyle = state.accentColor;
      ctx.globalAlpha = 0.1;
      ctx.fillRect(0, cursorY - 20*SCALE, CANVAS_WIDTH, canvasHeight - cursorY + 20*SCALE);
      ctx.globalAlpha = 1.0;
      ctx.fillStyle = state.textColor;

      // Body 2
      ctx.font = bodyFont;
      wrappedBody2.lines.forEach(line => {
          ctx.fillText(line, PADDING, cursorY);
          cursorY += lineHeight;
      });

      // Footer Identity
      cursorY = canvasHeight - PADDING - 40 * SCALE;
      ctx.fillStyle = state.textColor;
      ctx.fillRect(PADDING, cursorY, 2*SCALE, 30*SCALE); // Vertical bar
      
      ctx.font = `bold ${8 * SCALE}px monospace`;
      ctx.fillText('IDENTITY', PADDING + 10*SCALE, cursorY);
      
      ctx.font = `900 italic ${20 * SCALE}px "Noto Serif SC"`;
      ctx.fillText(state.author, PADDING + 10*SCALE, cursorY + 12*SCALE);

      // Tech details
      ctx.textAlign = 'right';
      ctx.font = metaFont;
      ctx.globalAlpha = 0.6;
      ctx.fillText('SYS.READY', CANVAS_WIDTH - PADDING, cursorY + 10*SCALE);
      ctx.font = `normal ${6 * SCALE}px monospace`;
      ctx.fillText(`LOC: 32.45.11 N`, CANVAS_WIDTH - PADDING, cursorY + 25*SCALE);

  } else if (state.layoutStyle === 'split') {
      // --- SPLIT LAYOUT ---
      let cursorY = PADDING + 20 * SCALE;

      // Header Group (Centered)
      ctx.textAlign = 'center';
      
      ctx.font = `normal ${10 * SCALE}px "Noto Serif SC"`;
      ctx.globalAlpha = 0.7;
      ctx.fillText('THE STORY OF', CANVAS_WIDTH/2, cursorY);
      cursorY += 20 * SCALE;

      ctx.font = titleFont;
      if (title.length > 8) ctx.font = `900 ${28 * SCALE}px "Noto Serif SC"`;
      ctx.globalAlpha = 1.0;
      ctx.fillText(title, CANVAS_WIDTH/2, cursorY);
      cursorY += 45 * SCALE;

      ctx.font = subtitleFont;
      ctx.globalAlpha = 0.8;
      // Border lines for subtitle
      const subWidth = ctx.measureText(subtitle).width;
      const lineXStart = (CANVAS_WIDTH - subWidth) / 2 - 20 * SCALE;
      const lineXEnd = (CANVAS_WIDTH + subWidth) / 2 + 20 * SCALE;
      ctx.lineWidth = 1 * SCALE;
      ctx.beginPath();
      ctx.moveTo(lineXStart, cursorY - 5*SCALE);
      ctx.lineTo(lineXEnd, cursorY - 5*SCALE);
      ctx.stroke();
      
      ctx.fillText(subtitle, CANVAS_WIDTH/2, cursorY);
      
      ctx.beginPath();
      ctx.moveTo(lineXStart, cursorY + 18*SCALE);
      ctx.lineTo(lineXEnd, cursorY + 18*SCALE);
      ctx.stroke();
      
      cursorY += 50 * SCALE;

      // Decoration Circle (Accent)
      ctx.fillStyle = state.accentColor;
      ctx.globalAlpha = 0.2;
      ctx.beginPath();
      ctx.arc(CANVAS_WIDTH - 20*SCALE, 60*SCALE, 80*SCALE, 0, Math.PI*2);
      ctx.fill();
      ctx.globalAlpha = 1.0;
      ctx.fillStyle = state.textColor;

      // Body Text
      ctx.textAlign = 'left';
      ctx.font = bodyFont;
      wrappedBody1.lines.forEach(line => {
          ctx.fillText(line, PADDING, cursorY);
          cursorY += lineHeight;
      });

      // Footer
      cursorY = Math.max(cursorY + 40*SCALE, canvasHeight - PADDING - 40*SCALE);
      
      // Line
      ctx.globalAlpha = 0.3;
      ctx.beginPath();
      ctx.moveTo(PADDING, cursorY);
      ctx.lineTo(CANVAS_WIDTH - PADDING, cursorY);
      ctx.stroke();
      ctx.globalAlpha = 1.0;
      
      cursorY += 15 * SCALE;
      ctx.textAlign = 'left';
      ctx.font = `italic ${12 * SCALE}px "Noto Serif SC"`;
      ctx.fillText(state.author, PADDING + 80*SCALE, cursorY);
      
      ctx.font = `bold ${8 * SCALE}px monospace`;
      ctx.fillText('SCREENPLAY', PADDING, cursorY + 4*SCALE);

      // Categories right
      ctx.textAlign = 'right';
      let catX = CANVAS_WIDTH - PADDING;
      categories.forEach(cat => {
          ctx.strokeRect(catX - 50*SCALE, cursorY - 5*SCALE, 50*SCALE, 16*SCALE);
          ctx.font = `bold ${8 * SCALE}px "Noto Serif SC"`;
          ctx.fillText(cat, catX - 5*SCALE, cursorY);
          catX -= 55 * SCALE;
      });

  } else {
      // --- MINIMAL / DEFAULT LAYOUT ---
      let cursorY = PADDING;

      // Top Tech Bar
      ctx.fillStyle = state.accentColor;
      ctx.fillRect(PADDING, cursorY + 2*SCALE, 6*SCALE, 6*SCALE);
      
      ctx.fillStyle = state.textColor;
      ctx.font = metaFont;
      ctx.fillText('SYSTEM_NORMAL', PADDING + 12*SCALE, cursorY);
      
      // Reading stats
      ctx.textAlign = 'right';
      ctx.globalAlpha = 0.6;
      ctx.fillText(`REC-${Math.floor(Math.random()*9999)}`, CANVAS_WIDTH - PADDING, cursorY);
      ctx.globalAlpha = 1.0;
      
      cursorY += 25 * SCALE;

      // Divider
      ctx.globalAlpha = 0.2;
      ctx.fillRect(PADDING, cursorY, CANVAS_WIDTH - PADDING*2, 1*SCALE);
      ctx.globalAlpha = 1.0;
      
      cursorY += 20 * SCALE;

      // Categories
      ctx.textAlign = 'left';
      categories.forEach(cat => {
          ctx.fillStyle = 'rgba(255,255,255,0.5)';
          ctx.fillRect(PADDING, cursorY, 60*SCALE, 16*SCALE);
          ctx.strokeRect(PADDING, cursorY, 60*SCALE, 16*SCALE);
          ctx.fillStyle = state.textColor;
          ctx.font = `bold ${8 * SCALE}px "Noto Serif SC"`;
          ctx.fillText(cat, PADDING + 4*SCALE, cursorY + 2*SCALE);
          
          // Accent bar
          ctx.fillStyle = state.accentColor;
          ctx.fillRect(PADDING + 60*SCALE, cursorY, 4*SCALE, 16*SCALE);
          
          cursorY += 22 * SCALE;
      });

      // Title
      ctx.fillStyle = state.textColor;
      ctx.font = titleFont;
      // Auto scale title
      if (title.length > 8) ctx.font = `900 ${28 * SCALE}px "Noto Serif SC"`;
      if (title.length > 14) ctx.font = `900 ${20 * SCALE}px "Noto Serif SC"`;
      ctx.fillText(title, PADDING, cursorY);
      cursorY += 45 * SCALE;

      // Subtitle
      ctx.font = subtitleFont;
      ctx.fillText(`/ ${subtitle}`, PADDING, cursorY);
      
      cursorY += 30 * SCALE;

      // Body Text with side decoration
      // Sidebar
      ctx.fillStyle = state.accentColor;
      ctx.fillRect(PADDING, cursorY, 4*SCALE, 30*SCALE);
      ctx.fillStyle = state.textColor;
      ctx.globalAlpha = 0.2;
      ctx.fillRect(PADDING, cursorY + 30*SCALE, 1*SCALE, wrappedBody1.height);
      ctx.globalAlpha = 1.0;

      // Text
      ctx.font = bodyFont;
      const textX = PADDING + 20 * SCALE;
      wrappedBody1.lines.forEach(line => {
          ctx.fillText(line, textX, cursorY);
          cursorY += lineHeight;
      });

      // Footer
      cursorY += 30 * SCALE;
      ctx.globalAlpha = 0.4;
      ctx.setLineDash([4 * SCALE, 4 * SCALE]);
      ctx.beginPath();
      ctx.moveTo(PADDING, cursorY);
      ctx.lineTo(CANVAS_WIDTH - PADDING, cursorY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1.0;
      
      cursorY += 15 * SCALE;
      ctx.font = metaFont;
      ctx.globalAlpha = 0.5;
      ctx.fillText('AUTHORIZED PERSONNEL', PADDING, cursorY);
      ctx.globalAlpha = 1.0;
      
      ctx.font = `bold ${12 * SCALE}px "Noto Serif SC"`;
      ctx.fillText(author, PADDING, cursorY + 12*SCALE);
      
      ctx.textAlign = 'right';
      ctx.font = `normal ${20 * SCALE}px monospace`;
      ctx.globalAlpha = 0.2;
      ctx.fillText(new Date().getFullYear().toString(), CANVAS_WIDTH - PADDING, cursorY + 10*SCALE);
  }

  return canvas.toDataURL('image/png', 1.0);
};
