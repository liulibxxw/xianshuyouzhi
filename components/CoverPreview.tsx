
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

  // 严格遵循原始分类，禁止对“江湖”卡片进行逻辑干预
  const effectiveCategory = category;
  
  const categoryBarColor = accentColor;
  const contentBarColor = accentColor;

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

  const getTitleFontClass = () => {
    const length = title.length;
    let sizeClass = 'text-4xl';
    
    if (layoutStyle === 'split') {
        if (length > 12) sizeClass = 'text-2xl';
        else if (length > 8) sizeClass = 'text-3xl';
        else sizeClass = 'text-5xl';
    } else if (layoutStyle === 'minimal') {
        if (length > 14) sizeClass = 'text-2xl';
        else if (length > 10) sizeClass = 'text-3xl';
        else sizeClass = 'text-4xl';
    } else {
        if (length > 10) sizeClass = 'text-2xl';
        else if (length > 7) sizeClass = 'text-3xl';
        else sizeClass = 'text-4xl';
    }

    return `font-serif-sc ${sizeClass}`;
  };

  const getSubtitleSizeClass = (baseClass: string, length: number) => {
      if (length > 30) return 'text-[11px] tracking-tighter';
      if (length > 24) return 'text-[12px] tracking-tight';
      if (length > 18) return 'text-[13px] tracking-tight';
      if (length > 12) return 'text-sm';
      return baseClass;
  };
  
  const getBodyClasses = () => {
      const isJustify = bodyTextAlign === 'text-justify';
      const lastLineClass = isJustify ? '[text-align-last:left]' : '';
      
      return `${bodyTextSize} ${bodyTextAlign} ${lastLineClass} [line-break:strict] break-words leading-[1.5] outline-none transition-all duration-300 [&_*]:text-inherit [&_*]:font-serif-sc [&_div]:m-0 [&_p]:m-0 [&_.multi-align-row]:!grid [&_.multi-align-row]:!grid-cols-3 [&_.multi-align-row]:!w-full [&_.multi-align-row]:!gap-1 [&_.multi-align-row]:!my-1 [&_.multi-align-row_div:nth-child(1)]:!text-left [&_.multi-align-row_div:nth-child(2)]:!text-center [&_.multi-align-row_div:nth-child(3)]:!text-right`;
  };

  const renderTechDecorations = () => (
    <>
      <div className="absolute top-4 left-4 w-2 h-2 border-t border-l border-current opacity-60 pointer-events-none" style={{ color: textColor }}></div>
      <div className="absolute top-4 right-4 w-2 h-2 border-t border-r border-current opacity-60 pointer-events-none" style={{ color: textColor }}></div>
      <div className="absolute bottom-4 left-4 w-2 h-2 border-b border-l border-current opacity-60 pointer-events-none" style={{ color: textColor }}></div>
      <div className="absolute bottom-4 right-4 w-2 h-2 border-b border-r border-current opacity-60 pointer-events-none" style={{ color: textColor }}></div>
      <div className="absolute top-[110px] right-0 w-8 h-[1px] bg-current opacity-30 pointer-events-none" style={{ color: textColor }}></div>
      <div className="absolute top-[116px] right-0 w-4 h-[1px] bg-current opacity-30 pointer-events-none" style={{ color: textColor }}></div>
    </>
  );

  const renderVintageDecorations = () => (
    <>
      <div className="absolute inset-4 border border-current opacity-20 pointer-events-none" style={{ color: textColor }}></div>
      <div className="absolute inset-[18px] border border-dotted border-current opacity-20 pointer-events-none" style={{ color: textColor }}></div>
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2 w-px h-12 bg-current opacity-30 pointer-events-none" style={{ color: textColor }}></div>
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-px h-12 bg-current opacity-30 pointer-events-none" style={{ color: textColor }}></div>
      <div className="absolute top-4 right-6 text-[3rem] font-serif-sc opacity-5 italic leading-none pointer-events-none" style={{ color: textColor }}>Vol.01</div>
    </>
  );

  const renderContent = () => {
    if (layoutStyle === 'duality') {
      return (
        <div className={`relative z-10 w-full flex flex-col ${flexGrowClass} ${minHeightClass}`}>
            <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
                <div className="absolute top-[10%] left-[-15%] w-[320px] h-[320px] rounded-[40px] border-[16px] border-current opacity-[0.08] -rotate-[15deg] transform origin-center" style={{ color: textColor }}></div>
                <div className="absolute top-[15%] left-[-5%] w-[280px] h-[280px] rounded-full border-[2px] border-current opacity-[0.15] rotate-[30deg] transform origin-center border-dashed" style={{ color: textColor }}></div>
                <div className="absolute top-[28%] left-[10%] w-[100px] h-[100px] rounded-full border-r-4 border-t-4 border-current opacity-[0.1] -rotate-[45deg]" style={{ color: textColor }}></div>
                <div className="absolute top-[5%] right-[-10%] w-[120%] h-px bg-current opacity-[0.1] -rotate-[25deg]" style={{ color: textColor }}></div>
                <div className="absolute top-[8%] right-[-10%] w-[120%] h-[20px] bg-current opacity-[0.03] -rotate-[25deg]" style={{ color: textColor }}></div>
                <div className="absolute bottom-[5%] right-[-5%] w-[150px] h-[150px] border-t border-l border-current opacity-[0.1]" style={{ color: textColor }}></div>
            </div>

            <div className={`flex flex-col relative px-6 py-4 ${isLongText ? 'min-h-[300px]' : 'flex-1 h-1/2'} overflow-hidden ${minHeightClass}`}>
                <div className="absolute -left-6 bottom-0 text-[9rem] font-bold opacity-[0.06] pointer-events-none leading-none z-0 font-serif-sc select-none" style={{ color: textColor }}>01</div>

                <div className="shrink-0 flex justify-between items-start z-10 mb-2 min-h-[50px] gap-2">
                     <div className="flex flex-col items-start gap-1 mt-1 z-10">
                        {displayCategories.map((cat, i) => (
                             <div key={i} className="relative group">
                                <div className="absolute inset-0 skew-x-[12deg] opacity-10" style={{ backgroundColor: textColor }}></div>
                                <div className="relative px-2 py-[2px] border-l-2 border-r-2 text-[9px] font-bold tracking-widest uppercase flex items-center gap-1" style={{ color: textColor, borderColor: textColor }}>
                                    <div className="w-1 h-1 bg-current rounded-full"></div>{cat}
                                </div>
                             </div>
                        ))}
                     </div>

                     <div className="flex flex-col items-end relative text-right flex-1 min-w-0 max-w-full">
                        <h1 className={`font-bold font-serif-sc leading-none mb-1.5 z-10 whitespace-nowrap ${getTitleFontClass()}`} style={{ color: textColor }}>{title}</h1>
                        <div className={`flex items-center gap-1.5 opacity-80 font-bold font-serif-sc z-10 whitespace-nowrap overflow-hidden max-w-full ${getSubtitleSizeClass('text-[12px]', subtitle.length)}`} style={{ color: textColor }}>
                           <span className="scale-75 shrink-0">○</span>
                           <span className="border-b border-current pb-0.5 opacity-90 truncate">{subtitle}</span>
                           <span className="scale-75 shrink-0">●</span>
                        </div>
                     </div>
                </div>

                <div className={`relative ${flexGrowClass} cursor-text overflow-hidden pl-1 z-10 ${minHeightClass} mb-2`} onClick={(e) => handleContainerClick(e, editableRef)}>
                   <div ref={editableRef} contentEditable={!isExporting} onInput={(e) => handleInput(e, false)} onCompositionStart={() => isComposing.current = true} onCompositionEnd={() => isComposing.current = false} suppressContentEditableWarning={true} className={`${getBodyClasses()} w-full pl-3 pr-1 py-1 block outline-none ${isLongText ? 'h-auto' : 'h-full overflow-y-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]'}`} style={{ color: textColor, fontFamily: FONT_FAMILY }} />
                </div>
            </div>

            <div className="relative shrink-0 h-0 z-20">
                 <div className="absolute top-0 left-0 w-full h-[40px] -translate-y-1/2" style={{ background: `linear-gradient(to bottom right, transparent 49%, ${textColor} 49%, ${textColor} 51%, transparent 51%)` }}></div>
                 <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-full p-2 border border-current shadow-sm" style={{ color: textColor }}>
                    <div className="w-2 h-2 rounded-full bg-current" style={{ color: accentColor }}></div>
                 </div>
            </div>

            <div className={`flex flex-col relative px-6 py-4 ${isLongText ? 'min-h-[300px]' : 'flex-1 h-1/2'} ${minHeightClass}`}>
                <div className="absolute -right-6 -top-4 text-[9rem] font-bold opacity-[0.06] pointer-events-none leading-none z-0 font-serif-sc select-none" style={{ color: textColor }}>02</div>
                <div className="absolute left-0 right-0 bottom-0 -z-10" style={{ top: '-20px', background: `linear-gradient(to bottom right, transparent 49.5%, ${accentColor} 49.5%) top center / 100% 40px no-repeat, linear-gradient(${accentColor}, ${accentColor}) top 40px center / 100% calc(100% - 40px) no-repeat` }} />
                <div className={`relative ${flexGrowClass} cursor-text overflow-hidden pl-1 z-10 ${minHeightClass} mt-2`} onClick={(e) => handleContainerClick(e, secondaryEditableRef)}>
                   <div ref={secondaryEditableRef} contentEditable={!isExporting} onInput={(e) => handleInput(e, true)} onCompositionStart={() => isComposing.current = true} onCompositionEnd={() => isComposing.current = false} suppressContentEditableWarning={true} className={`${getBodyClasses()} w-full pl-3 pr-1 py-1 block outline-none ${isLongText ? 'h-auto' : 'h-full overflow-y-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]'}`} style={{ color: textColor, fontFamily: FONT_FAMILY }} />
                </div>
                <div className="shrink-0 pt-6 flex justify-between items-end z-10 relative mt-auto">
                    <div className="relative pr-10 flex flex-col items-start">
                        <div className="relative z-10 flex items-center gap-3">
                            <div className="flex flex-col items-end justify-center relative pr-3 border-r-2 border-current" style={{ color: textColor }}>
                                <span className="text-[5px] uppercase tracking-[0.25em] font-mono opacity-50 mb-0.5 block leading-none">Identity</span>
                                <div className="relative">
                                    <span className="text-xl font-black italic tracking-wide block leading-none font-serif-sc" style={{ color: textColor }}>{author}</span>
                                    <div className="absolute -top-1 -left-2 w-1.5 h-1.5 border-t border-l border-current opacity-60"></div>
                                </div>
                            </div>
                            <div className="flex items-end gap-[1.5px] h-6 select-none opacity-80" style={{ color: textColor }}>
                                {[2, 1, 3, 1, 4, 1, 2, 1, 3, 2, 1, 4, 1, 2, 3].map((w, i) => (<div key={i} className={`bg-current ${i % 3 === 0 ? 'h-full' : 'h-[70%]'}`} style={{ width: `${w}px` }}></div>))}
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col gap-1.5 opacity-60 select-none font-mono items-end text-right" style={{ color: textColor }}>
                         <div className="flex items-center gap-1"><span className="text-[7px] tracking-widest">SYS.READY</span><div className="w-1.5 h-1.5 bg-current animate-pulse"></div></div>
                         <div className="flex flex-col text-[6px] leading-tight opacity-70"><span>/// {new Date().getFullYear()}.{new Date().getMonth() + 1}</span><span>LOC: 32.45.11 N</span></div>
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
                <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-sm animate-pulse" style={{ backgroundColor: accentColor }}></div><span className="text-[9px] font-mono tracking-widest font-bold" style={{ color: textColor }}>SYSTEM_NORMAL</span></div>
                <div className="flex items-center gap-2"><div className="h-1 w-12 bg-current opacity-20" style={{ color: textColor }}><div className="h-full w-2/3 bg-current" style={{ color: textColor }}></div></div><span className="text-[9px] font-mono opacity-60 tracking-widest" style={{ color: textColor }}>REC-{Math.floor(Math.random() * 9999)}</span></div>
              </div>
              <div className="mb-2 relative shrink-0">
                <div className="flex flex-wrap gap-2 mb-2">
                    {displayCategories.map((cat, idx) => (
                      <div key={idx} className="flex items-stretch select-none shadow-sm">
                        <div className="w-1.5 flex-shrink-0" style={{ backgroundColor: textColor }}></div>
                        <div className="px-2 py-0.5 border border-l-0 bg-white/40 flex items-center relative" style={{ borderColor: textColor }}><span className="text-[10px] tracking-wider font-bold uppercase leading-none" style={{ color: textColor }}>{cat}</span></div>
                        <div className="w-1" style={{ backgroundColor: categoryBarColor }}></div>
                      </div>
                    ))}
                </div>
                <h1 className={`leading-none mb-2 relative z-10 whitespace-nowrap ${getTitleFontClass()}`} style={{ color: textColor }}>{title}</h1>
                <div className="w-full h-px opacity-20 my-2" style={{ backgroundColor: textColor }}></div>
                <p className={`font-bold font-serif-sc whitespace-nowrap overflow-hidden truncate ${getSubtitleSizeClass('text-sm', subtitle.length)}`} style={{ color: textColor }}>/ {subtitle}</p>
              </div>
              <div className={`relative mt-0 ${flexGrowClass} flex flex-col ${minHeightClass}`}>
                <div className="flex items-center mb-1 shrink-0"><div className="px-2 py-0.5 text-[9px] font-bold tracking-widest text-white flex items-center justify-center" style={{ backgroundColor: textColor }}>ARCHIVE</div><div className="h-px flex-1 bg-current opacity-30 mx-2" style={{ color: textColor }}></div><div className="text-[9px] font-mono opacity-40" style={{ color: textColor }}>REF.07</div></div>
                <div className={`relative pl-6 pt-1 pb-1 ${flexGrowClass} cursor-text ${minHeightClass}`} onClick={handleContainerClick}><div className="absolute left-0 top-0 bottom-2 w-px bg-current opacity-20" style={{ color: textColor }}></div><div className="absolute left-0 top-0 w-1 h-8" style={{ backgroundColor: contentBarColor }}></div><div ref={editableRef} contentEditable={!isExporting} onInput={(e) => handleInput(e)} onCompositionStart={() => isComposing.current = true} onCompositionEnd={() => isComposing.current = false} suppressContentEditableWarning={true} className={`${getBodyClasses()} w-full p-0 m-0 block opacity-90 transform-none ${isLongText ? 'h-auto overflow-visible min-h-[100px]' : 'h-full overflow-y-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]'}`} style={{ color: textColor, fontFamily: FONT_FAMILY }} /></div>
              </div>
          </div>
          <div className="shrink-0 flex flex-col mt-1"><div className="ml-6 flex gap-0.5 opacity-20 mb-1.5 shrink-0"><div className="h-1 w-4 bg-current" style={{ color: textColor }}></div><div className="h-1 w-2 bg-current" style={{ color: textColor }}></div><div className="h-1 w-8 bg-current" style={{ color: textColor }}></div><div className="h-1 w-1 bg-current" style={{ color: textColor }}></div></div><div className="flex justify-between items-center opacity-80 border-t pt-1.5 border-dashed shrink-0" style={{ borderColor: `${textColor}40` }}><div className="flex flex-col"><span className="text-[8px] font-mono opacity-50">AUTHORIZED PERSONNEL</span><span className="text-[12px] font-bold uppercase tracking-wider font-serif-sc">{author}</span></div><div className="text-[20px] opacity-20 font-mono tracking-tighter">{new Date().getFullYear()}</div></div></div>
        </div>
      );
    }

    if (layoutStyle === 'split') {
      return (
        <div className={`relative z-10 p-8 flex flex-col ${flexGrowClass}`}>
          {renderVintageDecorations()}
          <div className="flex flex-col items-center text-center mt-2 mb-2 relative shrink-0 flex-none">
             <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[120%] h-full bg-white/30 blur-xl rounded-full -z-10"></div>
             <span className="text-xs mb-1 tracking-[0.3em] uppercase opacity-70 font-serif-sc" style={{ color: textColor }}>The Story of</span>
             <h1 className={`mb-2 leading-tight whitespace-nowrap ${getTitleFontClass()}`} style={{ color: textColor }}>{title}</h1>
             <span className={`px-4 py-1 border-y border-current uppercase opacity-80 font-serif-sc whitespace-nowrap overflow-hidden truncate max-w-full ${getSubtitleSizeClass('text-xs tracking-widest', subtitle.length)}`} style={{ color: textColor, borderColor: `${textColor}40` }}>{subtitle}</span>
          </div>
          <div className={`relative flex flex-col justify-start pt-6 ${flexGrowClass} cursor-text ${minHeightClass}`} style={{ marginBottom: isLongText ? '0.25rem' : '0', overflow: isLongText ? 'visible' : 'hidden' }} onClick={handleContainerClick}>
             <div className="absolute top-0 right-0 w-24 h-24 rounded-bl-[4rem] opacity-20 -z-10" style={{ backgroundColor: accentColor }}></div>
             <div ref={editableRef} contentEditable={!isExporting} onInput={(e) => handleInput(e)} onCompositionStart={() => isComposing.current = true} onCompositionEnd={() => isComposing.current = false} suppressContentEditableWarning={true} className={`${getBodyClasses()} px-2 w-full outline-none ${isLongText ? 'h-auto' : 'h-full overflow-y-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]'}`} style={{ color: textColor, fontFamily: FONT_FAMILY }} />
          </div>
          <div className="pt-2 border-t border-current/30 flex flex-col items-center opacity-80 shrink-0 flex-none mt-auto" style={{ color: textColor }}>
             <div className="flex items-center gap-4 mb-2"><div className="text-[8px] uppercase tracking-[0.2em]">SCREENPLAY</div><div className="text-sm italic font-serif-sc">{author}</div></div>
             <div className="w-full flex justify-between items-center text-[8px] tracking-widest opacity-60 font-mono">
                <div className="flex items-center gap-2">{displayCategories.map((cat, idx) => (<div key={idx} className="px-2 py-[2px] border border-current rounded-sm relative" style={{ borderColor: textColor }}><div className="absolute top-[-1px] right-[-1px] w-[3px] h-[3px] bg-white border-b border-l border-current opacity-100" style={{ borderColor: textColor }}></div><span className="uppercase font-semibold">{cat}</span></div>))}</div>
                <div className="h-px w-8 bg-current opacity-20 mx-2"></div><span>NO. {Date.now().toString().slice(-4)}</span>
             </div>
          </div>
        </div>
      );
    }

    return (
      <div className={`relative z-10 p-6 flex flex-col ${flexGrowClass}`}>
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-10" style={{ background: `linear-gradient(to left, ${accentColor}, transparent)` }}></div>
        <div className="absolute top-6 left-6 w-12 h-1 bg-current" style={{ color: textColor }}></div>
        <div className={`relative border-2 border-current p-1 flex-col flex ${flexGrowClass}`} style={{ color: textColor }}>
          <div className={`relative border border-current p-4 bg-white/20 backdrop-blur-sm flex flex-col ${flexGrowClass}`}>
            <div className="flex flex-col items-center mb-4 w-full shrink-0 flex-none">
              <h2 className={`w-full text-center leading-tight whitespace-nowrap z-20 ${getTitleFontClass()}`}>{title}</h2>
              <div className="w-full flex justify-between items-end mt-4 min-h-[40px] gap-4 relative z-10">
                 <div className="flex-1 pb-1 min-w-0"><div className="inline-block px-3 py-1 text-white shadow-md transform -rotate-1 origin-bottom-left whitespace-nowrap max-w-full overflow-hidden text-ellipsis" style={{ backgroundColor: textColor }}><p className={`font-bold font-serif-sc whitespace-nowrap overflow-hidden text-ellipsis ${getSubtitleSizeClass('text-xl md:text-2xl', subtitle.length)}`}>{subtitle}</p></div></div>
                 <div className="flex gap-2 shrink-0">{displayCategories.map((cat, idx) => (<div key={idx} className="border-2 px-1 py-2 bg-white/80 shadow-sm relative shrink-0" style={{ borderColor: textColor }}><div className="absolute inset-[2px] border border-current opacity-50" style={{ borderColor: textColor }}></div><div className="text-[10px] font-black tracking-[0.2em] relative z-10 flex flex-col items-center">{cat.split('').map((char, charIndex) => (<span key={charIndex} className="block leading-tight">{char}</span>))}</div></div>))}</div>
              </div>
            </div>
            <div className={`relative ${flexGrowClass} cursor-text ${minHeightClass}`} style={{ marginBottom: isLongText ? '0' : '0', overflow: isLongText ? 'visible' : 'hidden' }} onClick={handleContainerClick}><div ref={editableRef} contentEditable={!isExporting} onInput={(e) => handleInput(e)} onCompositionStart={() => isComposing.current = true} onCompositionEnd={() => isComposing.current = false} suppressContentEditableWarning={true} className={`${getBodyClasses()} opacity-90 w-full outline-none`} style={{ color: textColor, fontFamily: FONT_FAMILY }} /></div>
            <div className="pt-2 border-t border-dashed border-current opacity-60 flex justify-between text-[10px] font-mono shrink-0 flex-none mt-auto"><span className="uppercase tracking-wide">By {author}</span><span>{new Date().toLocaleDateString()}</span></div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div ref={ref} className={`relative shadow-2xl antialiased overflow-hidden w-[400px] shrink-0 ${isLongText ? 'h-auto min-h-[600px] md:min-h-[712px]' : 'h-[440px]'}`} style={renderingIsolation}>
      <div className="absolute inset-0 z-0" style={{ background: `radial-gradient(circle at 10% 20%, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 80%)`, opacity: 0.6 }} />
      {layoutStyle !== 'duality' && ( <div className="absolute inset-0 pointer-events-none z-0" style={{ backgroundImage: `linear-gradient(${textColor} 1px, transparent 1px), linear-gradient(90deg, ${textColor} 1px, transparent 1px)`, backgroundSize: '40px 40px', opacity: 0.05 }} /> )}
      {renderContent()}
    </div>
  );
});

export default CoverPreview;
