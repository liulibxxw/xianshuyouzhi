
import React, { useEffect, useState, forwardRef, useRef } from 'react';
import { CoverState } from '../types';

interface CoverPreviewProps {
  state: CoverState;
  onBodyTextChange: (text: string) => void;
  onSecondaryBodyTextChange: (text: string) => void;
  isExporting?: boolean;
}

const CoverPreview = forwardRef<HTMLDivElement, CoverPreviewProps>(({ state, onBodyTextChange, onSecondaryBodyTextChange, isExporting = false }, ref) => {
  const { 
    title, 
    subtitle, 
    bodyText,
    secondaryBodyText,
    category, 
    author,
    backgroundColor, 
    accentColor, 
    textColor, 
    titleFont,
    bodyFont,
    layoutStyle,
    mode,
    bodyTextSize = 'text-[13px]',
    bodyTextAlign = 'text-justify', 
  } = state;

  const effectiveCategory = category;
  const accentBarColor = accentColor;

  const editableRef = useRef<HTMLDivElement>(null);
  const secondaryEditableRef = useRef<HTMLDivElement>(null);
  const isComposing = useRef(false);

  const FONT_FAMILY = '"Noto Serif SC", serif';

  const renderingIsolation: React.CSSProperties = {
    fontFamily: FONT_FAMILY,
    textRendering: 'geometricPrecision',
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
    transform: 'translateZ(0)',
    contain: 'layout style',
    width: '400px',
    minWidth: '400px',
    maxWidth: '400px',
    fontSynthesis: 'none',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: backgroundColor,
    flexShrink: 0,
  };

  useEffect(() => {
    const el = editableRef.current;
    if (el && el.innerHTML !== bodyText && !isComposing.current) {
      el.innerHTML = bodyText;
    }
  }, [bodyText, layoutStyle, mode]);

  useEffect(() => {
    const el = secondaryEditableRef.current;
    if (el && el.innerHTML !== secondaryBodyText && !isComposing.current) {
      el.innerHTML = secondaryBodyText;
    }
  }, [secondaryBodyText, layoutStyle, mode]);

  const handleContainerClick = (e: React.MouseEvent, targetRef?: React.RefObject<HTMLDivElement>) => {
    if (isExporting) return;
    if (editableRef.current && editableRef.current.contains(e.target as Node)) return;
    if (secondaryEditableRef.current && secondaryEditableRef.current.contains(e.target as Node)) return;

    const refToFocus = targetRef || editableRef;
    if (refToFocus.current) {
      refToFocus.current.focus();
      const range = document.createRange();
      range.selectNodeContents(refToFocus.current);
      range.collapse(false);
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }
  };

  const handleInput = (e: React.FormEvent<HTMLDivElement>, isSecondary = false) => {
      const html = e.currentTarget.innerHTML;
      if (isSecondary) {
          if (html !== secondaryBodyText) onSecondaryBodyTextChange(html);
      } else {
          if (html !== bodyText) onBodyTextChange(html);
      }
  };

  const isLongText = mode === 'long-text';
  const flexGrowClass = isLongText ? 'flex-auto' : 'flex-1';
  const minHeightClass = isLongText ? '' : 'min-h-0';

  const categories = effectiveCategory ? effectiveCategory.split(/[、, ]/).map(c => c.trim()).filter(Boolean) : [];
  const displayCategories = categories.length > 0 ? categories : (effectiveCategory ? [effectiveCategory] : []);

  // 动态计算标题样式，确保不换行
  const getDynamicTitleStyle = (baseSize: number = 36): React.CSSProperties => {
    const length = title.length || 1;
    const containerWidth = 340; // 400px - padding
    const charWidth = baseSize * 0.95;
    const estimatedWidth = length * charWidth;
    
    let fontSize = baseSize;
    if (estimatedWidth > containerWidth) {
        fontSize = Math.floor(containerWidth / length / 0.95);
    }
    
    return {
        fontSize: `${Math.max(fontSize, 12)}px`,
        lineHeight: '1.1',
        whiteSpace: 'nowrap',
        color: textColor,
        fontWeight: '900',
        fontFamily: FONT_FAMILY
    };
  };

  // 动态计算副标题样式，确保不换行
  const getDynamicSubtitleStyle = (baseSize: number = 14): React.CSSProperties => {
    const length = subtitle.length || 1;
    const containerWidth = 340;
    const charWidth = baseSize * 0.85; 
    const estimatedWidth = length * charWidth;
    
    let fontSize = baseSize;
    if (estimatedWidth > containerWidth) {
        fontSize = Math.floor(containerWidth / length / 0.85);
    }
    
    return {
        fontSize: `${Math.max(fontSize, 10)}px`,
        whiteSpace: 'nowrap',
        color: textColor,
        opacity: 0.9,
        fontWeight: '700',
        fontFamily: FONT_FAMILY
    };
  };

  const getBodyClasses = () => {
      const isJustify = bodyTextAlign === 'text-justify';
      const lastLineClass = isJustify ? '[text-align-last:left]' : '';
      return `${bodyTextSize} ${bodyTextAlign} ${lastLineClass} [line-break:strict] break-words leading-[1.5] outline-none transition-all duration-300 [&_*]:text-inherit [&_*]:font-serif-sc [&_div]:m-0 [&_p]:m-0`;
  };

  const renderTechDecorations = () => (
    <>
      <div className="absolute top-4 left-4 w-2 h-2 border-t border-l border-current opacity-60" style={{ color: textColor }}></div>
      <div className="absolute top-4 right-4 w-2 h-2 border-t border-r border-current opacity-60" style={{ color: textColor }}></div>
      <div className="absolute bottom-4 left-4 w-2 h-2 border-b border-l border-current opacity-60" style={{ color: textColor }}></div>
      <div className="absolute bottom-4 right-4 w-2 h-2 border-b border-r border-current opacity-60" style={{ color: textColor }}></div>
    </>
  );

  const renderContent = () => {
    if (layoutStyle === 'duality') {
      return (
        <div className={`relative z-10 w-full flex flex-col ${flexGrowClass} ${minHeightClass}`}>
            <div className={`flex flex-col relative px-6 py-4 ${isLongText ? 'min-h-[300px]' : 'flex-1 h-1/2'} overflow-hidden ${minHeightClass}`}>
                <div className="shrink-0 flex justify-between items-start z-10 mb-2 min-h-[50px] gap-2">
                     <div className="flex flex-col items-start gap-1 mt-1 z-10">
                        {displayCategories.map((cat, i) => (
                             <div key={i} className="relative">
                                <div className="absolute inset-0 skew-x-[12deg] opacity-10" style={{ backgroundColor: textColor }}></div>
                                <div className="relative px-2 py-[2px] border-l-2 border-r-2 text-[9px] font-bold tracking-widest uppercase flex items-center gap-1" style={{ color: textColor, borderColor: textColor }}>
                                    <div className="w-1 h-1 bg-current rounded-full"></div>{cat}
                                </div>
                             </div>
                        ))}
                     </div>
                     <div className="flex flex-col items-end relative text-right flex-1 min-w-0">
                        <h1 style={getDynamicTitleStyle(40)} className="mb-1.5">{title}</h1>
                        <div className="flex items-center gap-1.5 font-bold z-10">
                           <span className="scale-75 shrink-0" style={{ color: textColor }}>○</span>
                           <span style={getDynamicSubtitleStyle(12)} className="border-b border-current pb-0.5">{subtitle}</span>
                           <span className="scale-75 shrink-0" style={{ color: textColor }}>●</span>
                        </div>
                     </div>
                </div>
                <div className={`relative ${flexGrowClass} cursor-text overflow-hidden pl-1 z-10 ${minHeightClass} mb-2`} onClick={(e) => handleContainerClick(e, editableRef)}>
                   <div ref={editableRef} contentEditable={!isExporting} onInput={(e) => handleInput(e, false)} onCompositionStart={() => isComposing.current = true} onCompositionEnd={() => isComposing.current = false} suppressContentEditableWarning={true} className={`${getBodyClasses()} w-full pl-3 pr-1 py-1 block outline-none ${isLongText ? 'h-auto' : 'h-full overflow-y-auto [&::-webkit-scrollbar]:hidden'}`} style={{ color: textColor }} />
                </div>
            </div>
            <div className="relative shrink-0 h-0 z-20">
                 <div className="absolute top-0 left-0 w-full h-[40px] -translate-y-1/2" style={{ background: `linear-gradient(to bottom right, transparent 49%, ${textColor} 49%, ${textColor} 51%, transparent 51%)` }}></div>
                 <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-full p-2 border border-current shadow-sm" style={{ color: textColor }}>
                    <div className="w-2 h-2 rounded-full bg-current" style={{ color: accentBarColor }}></div>
                 </div>
            </div>
            <div className={`flex flex-col relative px-6 py-4 ${isLongText ? 'min-h-[300px]' : 'flex-1 h-1/2'} ${minHeightClass}`}>
                <div className={`relative ${flexGrowClass} cursor-text overflow-hidden pl-1 z-10 ${minHeightClass} mt-2`} onClick={(e) => handleContainerClick(e, secondaryEditableRef)}>
                   <div ref={secondaryEditableRef} contentEditable={!isExporting} onInput={(e) => handleInput(e, true)} onCompositionStart={() => isComposing.current = true} onCompositionEnd={() => isComposing.current = false} suppressContentEditableWarning={true} className={`${getBodyClasses()} w-full pl-3 pr-1 py-1 block outline-none ${isLongText ? 'h-auto' : 'h-full overflow-y-auto [&::-webkit-scrollbar]:hidden'}`} style={{ color: textColor }} />
                </div>
                <div className="shrink-0 pt-6 flex justify-between items-end z-10 relative mt-auto">
                    <div className="relative pr-10 flex flex-col items-start">
                        <div className="relative z-10 flex items-center gap-3">
                            <div className="flex flex-col items-end justify-center relative pr-3 border-r-2 border-current" style={{ color: textColor }}>
                                <span className="text-[5px] uppercase tracking-[0.25em] font-mono opacity-50 mb-0.5 block leading-none">Identity</span>
                                <span className="text-xl font-black italic tracking-wide block leading-none" style={{ color: textColor }}>{author}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
      </div>
      );
    }

    if (layoutStyle === 'minimal') {
      return (
        <div className={`relative z-10 p-6 w-full flex flex-col justify-between ${isLongText ? 'flex-auto' : 'h-full overflow-hidden'}`}>
          {renderTechDecorations()}
          <div className={`${flexGrowClass} flex flex-col ${minHeightClass}`}>
              <div className="flex justify-between items-center border-b pb-2 mb-3 opacity-80 shrink-0" style={{ borderColor: `${textColor}40` }}>
                <span className="text-[9px] font-mono tracking-widest font-bold" style={{ color: textColor }}>SYSTEM_NORMAL</span>
                <span className="text-[9px] font-mono opacity-60 tracking-widest" style={{ color: textColor }}>REC-{Math.floor(Math.random() * 9999)}</span>
              </div>
              <div className="mb-2 relative shrink-0">
                <div className="flex flex-wrap gap-2 mb-2">
                    {displayCategories.map((cat, idx) => (
                      <div key={idx} className="flex items-stretch select-none shadow-sm">
                        <div className="w-1.5 flex-shrink-0" style={{ backgroundColor: textColor }}></div>
                        <div className="px-2 py-0.5 border border-l-0 bg-white/40 flex items-center relative" style={{ borderColor: textColor }}>
                          <span className="text-[10px] tracking-wider font-bold uppercase leading-none" style={{ color: textColor }}>{cat}</span>
                        </div>
                      </div>
                    ))}
                </div>
                <h1 style={getDynamicTitleStyle(36)} className="mb-2">{title}</h1>
                <div className="w-full h-px opacity-20 my-2" style={{ backgroundColor: textColor }}></div>
                <p style={getDynamicSubtitleStyle(14)}>/ {subtitle}</p>
              </div>
              <div className={`relative mt-0 ${flexGrowClass} flex flex-col ${minHeightClass}`}>
                <div className="flex items-center mb-1 shrink-0"><div className="px-2 py-0.5 text-[9px] font-bold tracking-widest text-white flex items-center justify-center" style={{ backgroundColor: textColor }}>ARCHIVE</div><div className="h-px flex-1 bg-current opacity-30 mx-2" style={{ color: textColor }}></div></div>
                <div className={`relative pl-6 pt-1 pb-1 ${flexGrowClass} cursor-text ${minHeightClass}`} onClick={handleContainerClick}>
                  <div className="absolute left-0 top-0 bottom-2 w-px bg-current opacity-20" style={{ color: textColor }}></div>
                  <div className="absolute left-0 top-0 w-1 h-8" style={{ backgroundColor: accentBarColor }}></div>
                  <div ref={editableRef} contentEditable={!isExporting} onInput={(e) => handleInput(e)} onCompositionStart={() => isComposing.current = true} onCompositionEnd={() => isComposing.current = false} suppressContentEditableWarning={true} className={`${getBodyClasses()} w-full p-0 m-0 block opacity-90 outline-none ${isLongText ? 'h-auto overflow-visible min-h-[100px]' : 'h-full overflow-y-auto [&::-webkit-scrollbar]:hidden'}`} style={{ color: textColor }} />
                </div>
              </div>
          </div>
          <div className="shrink-0 flex justify-between items-center opacity-80 border-t pt-1.5 border-dashed mt-1" style={{ borderColor: `${textColor}40` }}>
            <div className="flex flex-col"><span className="text-[8px] font-mono opacity-50 uppercase">Authorized By</span><span className="text-[12px] font-bold uppercase tracking-wider">{author}</span></div>
            <div className="text-[20px] opacity-20 font-mono tracking-tighter">{new Date().getFullYear()}</div>
          </div>
        </div>
      );
    }

    if (layoutStyle === 'split') {
      return (
        <div className={`relative z-10 p-8 flex flex-col ${flexGrowClass}`}>
          <div className="absolute inset-4 border border-current opacity-20 pointer-events-none" style={{ color: textColor }}></div>
          <div className="flex flex-col items-center text-center mt-2 mb-2 relative shrink-0 flex-none">
             <span className="text-xs mb-1 tracking-[0.3em] uppercase opacity-70" style={{ color: textColor }}>The Story of</span>
             <h1 style={getDynamicTitleStyle(44)} className="mb-2">{title}</h1>
             <div className="w-full flex justify-center">
                <span className="px-4 py-1 border-y border-current uppercase opacity-80" style={{ borderColor: `${textColor}40`, ...getDynamicSubtitleStyle(12) }}>{subtitle}</span>
             </div>
          </div>
          <div className={`relative flex flex-col justify-start pt-6 ${flexGrowClass} cursor-text ${minHeightClass}`} style={{ overflow: isLongText ? 'visible' : 'hidden' }} onClick={handleContainerClick}>
             <div ref={editableRef} contentEditable={!isExporting} onInput={(e) => handleInput(e)} onCompositionStart={() => isComposing.current = true} onCompositionEnd={() => isComposing.current = false} suppressContentEditableWarning={true} className={`${getBodyClasses()} px-2 w-full outline-none ${isLongText ? 'h-auto' : 'h-full overflow-y-auto [&::-webkit-scrollbar]:hidden'}`} style={{ color: textColor }} />
          </div>
          <div className="pt-2 border-t border-current/30 flex flex-col items-center opacity-80 shrink-0 flex-none mt-auto" style={{ color: textColor }}>
             <div className="flex items-center gap-4 mb-2"><div className="text-[8px] uppercase tracking-[0.2em]">SCREENPLAY</div><div className="text-sm italic">{author}</div></div>
          </div>
        </div>
      );
    }

    return (
      <div className={`relative z-10 p-6 flex flex-col ${flexGrowClass}`}>
        <div className={`relative border-2 border-current p-1 flex-col flex ${flexGrowClass}`} style={{ color: textColor }}>
          <div className={`relative border border-current p-4 bg-white/20 backdrop-blur-sm flex flex-col ${flexGrowClass}`}>
            <div className="flex flex-col items-center mb-4 w-full shrink-0 flex-none">
              <h2 style={getDynamicTitleStyle(36)} className="w-full text-center mb-4">{title}</h2>
              <div className="w-full flex justify-between items-end gap-4 relative z-10">
                 <div className="flex-1 pb-1 min-w-0">
                    <div className="inline-block px-3 py-1 text-white shadow-md transform -rotate-1 origin-bottom-left" style={{ backgroundColor: textColor }}>
                       <p style={getDynamicSubtitleStyle(20)} className="text-white">{subtitle}</p>
                    </div>
                 </div>
                 <div className="flex gap-2 shrink-0">
                    {displayCategories.map((cat, idx) => (
                      <div key={idx} className="border-2 px-1 py-2 bg-white/80 shadow-sm relative shrink-0" style={{ borderColor: textColor }}>
                        <div className="text-[10px] font-black tracking-[0.2em] relative z-10 flex flex-col items-center">
                          {cat.split('').map((char, charIndex) => (<span key={charIndex} className="block leading-tight">{char}</span>))}
                        </div>
                      </div>
                    ))}
                 </div>
              </div>
            </div>
            <div className={`relative ${flexGrowClass} cursor-text ${minHeightClass}`} onClick={handleContainerClick}>
               <div ref={editableRef} contentEditable={!isExporting} onInput={(e) => handleInput(e)} onCompositionStart={() => isComposing.current = true} onCompositionEnd={() => isComposing.current = false} suppressContentEditableWarning={true} className={`${getBodyClasses()} opacity-90 w-full outline-none`} style={{ color: textColor }} />
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div ref={ref} className={`relative shadow-2xl antialiased overflow-hidden w-[400px] shrink-0 ${isLongText ? 'h-auto min-h-[600px] md:min-h-[712px]' : 'h-[440px]'}`} style={renderingIsolation}>
      <div className="absolute inset-0 z-0" style={{ background: `radial-gradient(circle at 10% 20%, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 80%)`, opacity: 0.6 }} />
      {renderContent()}
    </div>
  );
});

export default CoverPreview;
