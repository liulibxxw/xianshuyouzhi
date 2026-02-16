
import React, { useEffect, useState, forwardRef, useRef, useMemo, useCallback } from 'react';
import { CoverState } from '../types';
import { getCleanContent } from './nativeExport';

interface CoverPreviewProps {
  state: CoverState;
  onBodyTextChange: (text: string) => void;
  onSecondaryBodyTextChange: (text: string) => void;
  isExporting?: boolean;
  longTextMinHeight?: number;
}

const CoverPreview = forwardRef<HTMLDivElement, CoverPreviewProps>(({ state, onBodyTextChange, onSecondaryBodyTextChange, isExporting = false, longTextMinHeight = 0 }, ref) => {
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

  const isJianghuTheme = title === '江湖就是要打打杀杀';
  const effectiveCategory = (isJianghuTheme && category === '文稿创作') ? '文稿、短打' : category;
  
  const categoryBarColor = accentColor;
  const contentBarColor = accentColor;

  const editableRef = useRef<HTMLDivElement>(null);
  const secondaryEditableRef = useRef<HTMLDivElement>(null);
  const isComposing = useRef(false);

  // 渲染隔离样式，确保导出一致性
  const renderingIsolation: React.CSSProperties = {
    backgroundColor: layoutStyle === 'storybook' ? '#FFF8F0' : backgroundColor,
    display: 'flex', 
    flexDirection: 'column',
    // 强制隔离渲染环境
    width: '400px',
    flexShrink: 0,
    boxSizing: 'border-box',
  };

  const displayBodyText = useMemo(() => isExporting ? getCleanContent(bodyText) : bodyText, [bodyText, isExporting]);
  // 仅在 Duality 布局使用 secondaryText，这里统一处理以防万一
  const displaySecondaryText = useMemo(() => isExporting ? getCleanContent(secondaryBodyText) : secondaryBodyText, [secondaryBodyText, isExporting]);

  useEffect(() => {
    const el = editableRef.current;
    if (el && el.innerHTML !== displayBodyText && !isComposing.current) {
      el.innerHTML = displayBodyText;
    }
  }, [displayBodyText, layoutStyle, mode]);

  useEffect(() => {
    const el = secondaryEditableRef.current;
    if (el && el.innerHTML !== displaySecondaryText && !isComposing.current) {
      el.innerHTML = displaySecondaryText;
    }
  }, [displaySecondaryText, layoutStyle, mode]);

  const readingStats = useMemo(() => {
      const plainText = bodyText.replace(/<[^>]+>/g, '').trim();
      const length = plainText.length;
      const minutes = Math.max(1, Math.ceil(length / 400));
      return { length, minutes };
  }, [bodyText]);

  const handleContainerClick = (e: React.MouseEvent, targetRef?: React.RefObject<HTMLDivElement>) => {
    if (isExporting) return;
    
    // 如果点击的是特定的编辑区域，不做处理（让浏览器处理 focus）
    if (editableRef.current && editableRef.current.contains(e.target as Node)) return;
    if (secondaryEditableRef.current && secondaryEditableRef.current.contains(e.target as Node)) return;

    // 否则聚焦到传入的 ref 或默认的 editableRef
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
  
  // 长文模式使用 flex-none，让容器高度完全由内容决定，不拉伸填充
  // 封面模式使用 flex-1，在固定高度容器中均分空间
  const flexGrowClass = isLongText ? 'flex-none' : 'flex-1';
  const minHeightClass = isLongText ? '' : 'min-h-0';

  const categories = effectiveCategory ? effectiveCategory.split(/[、, ]/).map(c => c.trim()).filter(Boolean) : [];
  const displayCategories = categories.length > 0 ? categories : (effectiveCategory ? [effectiveCategory] : []);

  const getFontClass = (style: string) => {
    switch (style) {
      case 'jianghu': return 'font-jianghu';
      case 'serif': return 'font-serif-sc';
      case 'bold': return 'font-bold-sc';
      default: return 'font-sans-sc';
    }
  };

  const getTitleFontClass = () => {
    const baseFont = getFontClass(titleFont);
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
    } else if (layoutStyle === 'storybook') {
        if (length > 12) sizeClass = 'text-2xl';
        else if (length > 8) sizeClass = 'text-3xl';
        else sizeClass = 'text-4xl';
    } else {
        if (length > 10) sizeClass = 'text-2xl';
        else if (length > 7) sizeClass = 'text-3xl';
        else sizeClass = 'text-4xl';
    }

    return `${baseFont} ${sizeClass}`;
  };

  const getBodyFontClass = () => {
     return getFontClass(bodyFont);
  };
  
  const getBodyClasses = () => {
      return `${bodyTextSize} ${bodyTextAlign} leading-[1.5] outline-none ${getBodyFontClass()}`;
  };

  // 自适应副标题组件：动态缩小字号直到能在 maxWidth 内完整显示
  const AutoFitSubtitle: React.FC<{
    children: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
    maxWidth: number; // 可用的最大像素宽度
    align?: 'left' | 'right'; // 缩放锚点方向
  }> = useCallback(({ children, className = '', style = {}, maxWidth, align = 'left' }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const innerRef = useRef<HTMLSpanElement>(null);
    const [fontSize, setFontSize] = useState<number | undefined>(undefined);

    useEffect(() => {
      const inner = innerRef.current;
      if (!inner) return;
      // Reset to default font size to measure natural width
      setFontSize(undefined);
      requestAnimationFrame(() => {
        const naturalWidth = inner.scrollWidth;
        if (naturalWidth > maxWidth && naturalWidth > 0) {
          // Calculate scaled font size: original size * (maxWidth / naturalWidth)
          const computedSize = parseFloat(getComputedStyle(inner).fontSize);
          const newSize = Math.max(computedSize * 0.55, computedSize * (maxWidth / naturalWidth));
          setFontSize(newSize);
        } else {
          setFontSize(undefined);
        }
      });
    }, [children, maxWidth]);

    return (
      <div
        ref={containerRef}
        className={className}
        style={{
          ...style,
          width: `${maxWidth}px`,
          overflow: 'hidden',
        }}
      >
        <span
          ref={innerRef}
          style={{
            display: 'inline-block',
            whiteSpace: 'nowrap',
            fontSize: fontSize !== undefined ? `${fontSize}px` : undefined,
          }}
        >
          {children}
        </span>
      </div>
    );
  }, []);

  const renderTechDecorations = () => (
    <>
      <div className="absolute top-4 left-4 w-2 h-2 border-t border-l border-current opacity-60 pointer-events-none" style={{ color: textColor }}></div>
      <div className="absolute top-4 right-4 w-2 h-2 border-t border-r border-current opacity-60 pointer-events-none" style={{ color: textColor }}></div>
      <div className="absolute bottom-4 left-4 w-2 h-2 border-b border-l border-current opacity-60 pointer-events-none" style={{ color: textColor }}></div>
      <div className="absolute bottom-4 right-4 w-2 h-2 border-b border-r border-current opacity-60 pointer-events-none" style={{ color: textColor }}></div>
      
      <div className="absolute top-[110px] right-0 w-8 h-[1px] bg-current opacity-30 pointer-events-none" style={{ color: textColor }}></div>
      <div className="absolute top-[116px] right-0 w-4 h-[1px] bg-current opacity-30 pointer-events-none" style={{ color: textColor }}></div>
      
      <div className="absolute bottom-20 left-2.5 flex flex-col items-center gap-1 opacity-50 pointer-events-none" style={{ color: textColor }}>
         <div className="w-px h-8 bg-current opacity-50"></div>
         <div className="text-[8px] tracking-widest font-mono uppercase flex flex-col items-center">
           {'Non-Linear Narrative'.split('').map((char, index) => (
             <span key={index} className="block leading-tight scale-x-90 -mb-px">
               {char === ' ' ? '\u00A0' : char}
             </span>
           ))}
         </div>
         <div className="w-px h-2 bg-current opacity-50"></div>
      </div>
    </>
  );

  const renderVintageDecorations = () => (
    <>
      <div className="absolute inset-4 border border-current opacity-20 pointer-events-none" style={{ color: textColor }}></div>
      <div className="absolute inset-[18px] border border-dotted border-current opacity-20 pointer-events-none" style={{ color: textColor }}></div>
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2 w-px h-12 bg-current opacity-30 pointer-events-none" style={{ color: textColor }}></div>
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-px h-12 bg-current opacity-30 pointer-events-none" style={{ color: textColor }}></div>
      <div className="absolute top-4 right-6 text-[3rem] font-serif opacity-5 italic leading-none pointer-events-none" style={{ color: textColor }}>
        Vol.01
      </div>
    </>
  );

  const renderContent = () => {
    if (layoutStyle === 'minimal') {
      return (
        <div 
          className={`relative z-10 p-6 w-full flex flex-col ${isLongText ? 'flex-1' : 'h-full overflow-hidden justify-between'}`}
        >
          {renderTechDecorations()}

          <div className={`${flexGrowClass} flex flex-col ${minHeightClass}`}>
              <div className="flex justify-between items-center border-b pb-2 mb-4 opacity-80 shrink-0" style={{ borderColor: `${textColor}40` }}>
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-sm animate-pulse" style={{ backgroundColor: accentColor }}></div>
                    <span className="text-[9px] font-mono tracking-widest font-bold" style={{ color: textColor }}>SYSTEM_NORMAL</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[8px] font-mono tracking-wide opacity-70 font-semibold" style={{ color: textColor }}>
                      {readingStats.length}字 · {readingStats.minutes}min
                    </span>
                    <div className="w-px h-2.5 bg-current opacity-20" style={{ color: textColor }}></div>
                    <span className="text-[8px] font-mono opacity-50 tracking-widest" style={{ color: textColor }}>
                      REC
                    </span>
                    <div className="h-1 w-8 bg-current opacity-15 rounded-full overflow-hidden" style={{ color: textColor }}>
                      <div className="h-full w-2/3 bg-current rounded-full" style={{ color: textColor }}></div>
                    </div>
                </div>
              </div>

              <div className="mb-3 relative shrink-0">
                <div className="flex flex-wrap gap-2 mb-2">
                    {displayCategories.map((cat, idx) => (
                      <div key={idx} className="flex items-stretch select-none shadow-sm">
                        <div className="w-1.5 flex-shrink-0" style={{ backgroundColor: textColor }}></div>
                        <div className="px-2 py-0.5 border border-l-0 bg-white/40 flex items-center relative" style={{ borderColor: textColor }}>
                          <span className="text-[10px] tracking-wider font-bold uppercase leading-none" style={{ color: textColor }}>
                            {cat}
                          </span>
                        </div>
                        <div className="w-1" style={{ backgroundColor: categoryBarColor }}></div>
                      </div>
                    ))}
                </div>

                <h1 className={`leading-none mb-2 relative z-10 whitespace-nowrap ${getTitleFontClass()}`} style={{ color: textColor }}>
                  {title}
                </h1>
                <div className="w-full h-px opacity-20 my-2" style={{ backgroundColor: textColor }}></div>
                <AutoFitSubtitle
                  className={`text-sm font-bold opacity-80 ${getBodyFontClass()}`}
                  style={{ color: textColor }}
                  maxWidth={352}
                >
                  / {subtitle}
                </AutoFitSubtitle>
              </div>

              <div className={`relative mt-1 ${flexGrowClass} flex flex-col ${minHeightClass}`}>
                <div className="flex items-center mb-2 shrink-0">
                    <div className="px-2 py-0.5 text-[9px] font-bold tracking-widest text-white flex items-center justify-center" style={{ backgroundColor: textColor }}>
                      ARCHIVE
                    </div>
                    <div className="h-px flex-1 bg-current opacity-30 mx-2" style={{ color: textColor }}></div>
                    <div className="text-[9px] font-mono opacity-40" style={{ color: textColor }}>REF.07</div>
                </div>

                <div 
                   className={`relative pl-6 pt-1 pb-2 ${flexGrowClass} cursor-text ${minHeightClass}`}
                   onClick={handleContainerClick}
                >
                    <div className="absolute left-0 top-0 bottom-4 w-px bg-current opacity-20" style={{ color: textColor }}></div>
                    <div className="absolute left-0 top-0 w-1 h-8" style={{ backgroundColor: contentBarColor }}></div>

                    <div
                      ref={editableRef}
                      contentEditable={!isExporting}
                      onInput={(e) => handleInput(e, false)}
                      onCompositionStart={() => isComposing.current = true}
                      onCompositionEnd={() => isComposing.current = false}
                      suppressContentEditableWarning={true}
                      className={`${getBodyClasses()} w-full p-0 m-0 block opacity-90 transform-none ${isLongText ? 'h-auto overflow-visible' : 'h-full overflow-y-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]'}`}
                      style={{ color: textColor }}
                    />
                </div>
              </div>
          </div>
          
          <div className="shrink-0 flex flex-col mt-auto pt-2">
              <div className="ml-6 flex gap-0.5 opacity-20 mb-2 shrink-0">
                  <div className="h-1 w-4 bg-current" style={{ color: textColor }}></div>
                  <div className="h-1 w-2 bg-current" style={{ color: textColor }}></div>
                  <div className="h-1 w-8 bg-current" style={{ color: textColor }}></div>
                  <div className="h-1 w-1 bg-current" style={{ color: textColor }}></div>
              </div>
              
              <div 
                className="flex justify-between items-center opacity-80 border-t pt-2 border-dashed shrink-0" 
                style={{ 
                  borderColor: `${textColor}40`, 
                }}
              >
                <div className="flex flex-col">
                    <span className="text-[8px] font-mono opacity-50">AUTHORIZED PERSONNEL</span>
                    <span className={`text-[12px] font-bold uppercase tracking-wider ${getBodyFontClass()}`}>{author}</span>
                </div>
                <div className="text-[20px] opacity-20 font-mono tracking-tighter">
                    {new Date().getFullYear()}
                </div>
              </div>
          </div>
        </div>
      );
    }

    if (layoutStyle === 'split') {
      return (
        <div 
          className={`relative z-10 p-8 flex flex-col ${isLongText ? 'flex-1' : 'flex-1'}`}
        >
          {renderVintageDecorations()}

          <div className="flex flex-col items-center text-center mt-2 mb-2 relative shrink-0 flex-none">
             <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[120%] h-full bg-white/30 blur-xl rounded-full -z-10"></div>
             
             <span className={`text-xs mb-1 tracking-[0.3em] uppercase opacity-70 ${getBodyFontClass()}`} style={{ color: textColor }}>
                The Story of
             </span>
             <h1 className={`mb-2 leading-tight whitespace-nowrap ${getTitleFontClass()}`} style={{ color: textColor }}>
              {title}
            </h1>
             <AutoFitSubtitle
               className={`px-4 py-1 border-y border-current text-xs tracking-widest uppercase opacity-80 ${getBodyFontClass()}`}
               style={{ color: textColor, borderColor: `${textColor}40` }}
               maxWidth={336}
             >
               {subtitle}
             </AutoFitSubtitle>
          </div>

          <div 
            className={`relative flex flex-col justify-start pt-6 ${flexGrowClass} cursor-text`}
            style={{ 
               marginBottom: isLongText ? '0.25rem' : '0',
               overflow: isLongText ? 'visible' : 'hidden'
            }}
            onClick={handleContainerClick}
          >
             <div className="absolute top-0 right-0 w-24 h-24 rounded-bl-[4rem] opacity-20 -z-10" style={{ backgroundColor: accentColor }}></div>
             
             <div
                ref={editableRef}
                contentEditable={!isExporting}
                onInput={(e) => handleInput(e, false)}
                onCompositionStart={() => isComposing.current = true}
                onCompositionEnd={() => isComposing.current = false}
                suppressContentEditableWarning={true}
                className={`${getBodyClasses()} px-2 w-full outline-none ${isLongText ? 'h-auto overflow-visible' : 'h-full overflow-y-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]'}`}
                style={{ color: textColor }}
              />
          </div>

          <div 
            className="pt-2 border-t border-current/30 flex flex-col items-center opacity-80 shrink-0 flex-none mt-auto" 
            style={{ 
               color: textColor,
            }}
          >
             <div className="flex items-center gap-4 mb-2">
                <div className="text-[8px] uppercase tracking-[0.2em]">SCREENPLAY</div>
                <div className={`text-sm italic font-serif ${getBodyFontClass()}`}>{author}</div>
             </div>
             <div className="w-full flex justify-between items-center text-[8px] tracking-widest opacity-60 font-mono">
                <div className="flex items-center gap-2">
                    {displayCategories.map((cat, idx) => (
                        <div 
                          key={idx} 
                          className="px-2 py-[2px] border border-current rounded-sm relative"
                          style={{ borderColor: textColor }}
                        >
                           <div className="absolute top-[-1px] right-[-1px] w-[3px] h-[3px] bg-white border-b border-l border-current opacity-100" style={{ borderColor: textColor }}></div>
                           <span className="uppercase font-semibold">{cat}</span>
                        </div>
                    ))}
                </div>
                
                <div className="h-px w-8 bg-current opacity-20 mx-2"></div>
                <span>NO. {Date.now().toString().slice(-4)}</span>
             </div>
          </div>
        </div>
      );
    }

    if (layoutStyle === 'duality') {
      return (
        <div key="layout-duality" className={`relative z-10 w-full flex flex-col ${isLongText ? 'flex-1' : 'flex-1'} ${minHeightClass}`}>
            <div className={`flex flex-col relative px-[10px] py-4 ${isLongText ? '' : 'flex-1 h-1/2'} overflow-hidden ${minHeightClass}`}>
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
                        <h1 className={`font-bold leading-tight mb-1.5 z-10 ${getTitleFontClass()}`} style={{ color: textColor }}>{title}</h1>
                        <div className={`flex items-center gap-1.5 opacity-80 font-bold font-serif-sc z-10 max-w-full whitespace-nowrap text-[12px]`} style={{ color: textColor }}>
                           <span className="scale-75 shrink-0">○</span>
                           <span className="border-b border-current pb-0.5 opacity-90 truncate">{subtitle}</span>
                           <span className="scale-75 shrink-0">●</span>
                        </div>
                     </div>
                </div>
                <div className={`relative ${flexGrowClass} cursor-text overflow-hidden pl-0 z-10 ${minHeightClass} mb-2`} onClick={(e) => handleContainerClick(e, editableRef)}>
                   <div ref={editableRef} contentEditable={!isExporting} onInput={(e) => handleInput(e, false)} onCompositionStart={() => isComposing.current = true} onCompositionEnd={() => isComposing.current = false} suppressContentEditableWarning={true} className={`${getBodyClasses()} w-full px-0 py-1 block outline-none ${isLongText ? 'h-auto' : 'h-full overflow-y-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]'}`} style={{ color: textColor }} />
                </div>
            </div>
            <div className="relative shrink-0 h-0 z-20">
                 <div className="absolute top-0 left-0 w-full h-[40px] -translate-y-1/2" style={{ background: `linear-gradient(to bottom right, transparent 49%, ${textColor} 49%, ${textColor} 51%, transparent 51%)` }}></div>
                 <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-full p-2 border border-current shadow-sm" style={{ color: textColor }}><div className="w-2 h-2 rounded-full bg-current" style={{ color: accentColor }}></div></div>
            </div>
            <div className={`flex flex-col relative px-[10px] py-4 ${isLongText ? '' : 'flex-1 h-1/2'} ${minHeightClass}`}>
                <div className="absolute -right-6 -top-4 text-[9rem] font-bold opacity-[0.06] pointer-events-none leading-none z-0 font-serif-sc select-none" style={{ color: textColor }}>02</div>
                <div className="absolute left-0 right-0 bottom-0 -z-10" style={{ top: '-20px', background: `linear-gradient(to bottom right, transparent 49.5%, ${accentColor} 49.5%) top center / 100% 40px no-repeat, linear-gradient(${accentColor}, ${accentColor}) top 40px center / 100% calc(100% - 40px) no-repeat` }} />
                <div className={`relative ${flexGrowClass} cursor-text overflow-hidden pl-0 z-10 ${minHeightClass} mt-2`} onClick={(e) => handleContainerClick(e, secondaryEditableRef)}>
                   <div ref={secondaryEditableRef} contentEditable={!isExporting} onInput={(e) => handleInput(e, true)} onCompositionStart={() => isComposing.current = true} onCompositionEnd={() => isComposing.current = false} suppressContentEditableWarning={true} className={`${getBodyClasses()} w-full px-0 py-1 block outline-none ${isLongText ? 'h-auto' : 'h-full overflow-y-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]'}`} style={{ color: textColor }} />
                </div>
                <div className="shrink-0 pt-6 flex justify-between items-end z-10 relative mt-auto">
                    <div className="relative pr-10 flex flex-col items-start"><div className="relative z-10 flex items-center gap-3"><div className="flex flex-col items-end justify-center relative pr-3 border-r-2 border-current" style={{ color: textColor }}><span className="text-[5px] uppercase tracking-[0.25em] font-mono opacity-50 mb-0.5 block leading-none">Identity</span><div className="relative"><span className="text-xl font-black italic tracking-wide block leading-none font-serif-sc" style={{ color: textColor }}>{author}</span><div className="absolute -top-1 -left-2 w-1.5 h-1.5 border-t border-l border-current opacity-60"></div></div></div><div className="flex items-end gap-[1.5px] h-6 select-none opacity-80" style={{ color: textColor }}>{[2, 1, 3, 1, 4, 1, 2, 1, 3, 2, 1, 4, 1, 2, 3].map((w, i) => (<div key={i} className={`bg-current ${i % 3 === 0 ? 'h-full' : 'h-[70%]'}`} style={{ width: `${w}px` }}></div>))}</div></div></div>
                    <div className="flex flex-col gap-1.5 opacity-60 select-none font-mono items-end text-right" style={{ color: textColor }}><div className="flex items-center gap-1"><span className="text-[7px] tracking-widest">SYS.READY</span><div className="w-1.5 h-1.5 bg-current animate-pulse"></div></div><div className="flex flex-col text-[6px] leading-tight opacity-70"><span>/// {new Date().getFullYear()}.{new Date().getMonth() + 1}</span><span>LOC: 32.45.11 N</span></div></div>
                </div>
            </div>
      </div>
      );
    }

    if (layoutStyle === 'storybook') {
      // Storybook Crayon Aesthetic — warm earthy palette with hand-drawn feel
      const earthyColors = {
        forestGreen: '#2D5F3E',
        mustardYellow: '#D4A843',
        brickRed: '#C7442B',
        cream: '#FFF8F0',
        brown: '#5B4A3F',
        warmBg: '#FEF3E2',
      };

      return (
        <div 
          className={`relative z-10 p-5 w-full flex flex-col storybook-paper-bg ${isLongText ? 'flex-1' : 'h-full overflow-hidden justify-between'}`}
          style={{ color: earthyColors.brown }}
        >
          {/* Paper texture overlay */}
          <div className="absolute inset-0 pointer-events-none z-0" style={{
            backgroundImage: `radial-gradient(circle at 20% 80%, rgba(212,168,67,0.08) 0%, transparent 50%),
                              radial-gradient(circle at 80% 20%, rgba(199,68,43,0.06) 0%, transparent 50%),
                              radial-gradient(circle at 50% 50%, rgba(45,95,62,0.04) 0%, transparent 60%)`,
          }} />

          {/* Tape decorations - top corners */}
          <div className="storybook-tape" style={{ top: '-4px', left: '16px', zIndex: 20 }} />
          <div className="storybook-tape-right" style={{ top: '-4px', right: '16px', zIndex: 20 }} />

          {/* Main bordered content area */}
          <div className={`storybook-border relative flex flex-col ${isLongText ? 'flex-1' : flexGrowClass} ${minHeightClass}`} style={{ backgroundColor: earthyColors.cream, overflow: 'hidden' }}>
            {/* Inner dashed border is handled by CSS ::before */}
            
            {/* Header section with categories as cute stickers */}
            <div className="px-4 pt-4 pb-1 shrink-0 flex-none relative z-10">
              {/* Category stickers + reading stats */}
              <div className="flex items-center gap-1.5 mb-2">
                {/* Left: category stickers */}
                <div className="flex flex-wrap items-center gap-1.5 flex-1">
                  {displayCategories.map((cat, idx) => {
                    const stickerColors = [earthyColors.forestGreen, earthyColors.brickRed, earthyColors.mustardYellow];
                    const stickerColor = stickerColors[idx % stickerColors.length];
                    return (
                      <div 
                        key={idx} 
                        className="wobbly-box px-2 py-0.5 wiggle-hover select-none"
                        style={{ 
                          color: stickerColor, 
                          backgroundColor: `${stickerColor}15`,
                          transform: `rotate(${idx % 2 === 0 ? '-2' : '1.5'}deg)`,
                        }}
                      >
                        <span className="text-[10px] font-bold tracking-wider font-storybook leading-none">{cat}</span>
                      </div>
                    );
                  })}
                </div>
                {/* Right: reading stats — auto-width centered text */}
                <div className="shrink-0 select-none relative" style={{ transform: 'rotate(2.5deg)', marginRight: '-2px' }}>
                  <div className="relative px-2 py-1" style={{
                    backgroundColor: '#FFF5E6',
                    border: `1.5px solid ${earthyColors.brown}40`,
                    borderRadius: '2px 6px 4px 2px',
                    boxShadow: `1px 1px 0 ${earthyColors.brown}15`,
                  }}>
                    <div className="absolute inset-0 pointer-events-none opacity-[0.06]" style={{
                      backgroundImage: `radial-gradient(${earthyColors.brown} 0.5px, transparent 0.5px)`,
                      backgroundSize: '3px 3px',
                    }} />
                    <div className="relative flex items-center justify-center gap-1">
                      <span className="text-[9px] font-bold leading-none font-caveat" style={{ color: earthyColors.brickRed }}>{readingStats.length}</span>
                      <span className="text-[7px] opacity-40 leading-none" style={{ color: earthyColors.brown }}>字</span>
                      <span className="text-[8px] opacity-25 leading-none mx-0.5" style={{ color: earthyColors.brown }}>·</span>
                      <span className="text-[9px] font-bold leading-none font-caveat" style={{ color: earthyColors.forestGreen }}>{readingStats.minutes}</span>
                      <span className="text-[7px] opacity-40 leading-none" style={{ color: earthyColors.brown }}>min</span>
                    </div>
                    <svg width="100%" height="3" viewBox="0 0 80 3" preserveAspectRatio="none" className="mt-0.5 opacity-20">
                      <path d="M0 1.5 Q8 0.5 16 1.8 Q24 2.8 32 1.2 Q40 0.2 48 1.6 Q56 2.6 64 1 Q72 0.4 80 1.5" stroke={earthyColors.mustardYellow} strokeWidth="2" fill="none" strokeLinecap="round" />
                    </svg>
                  </div>
                  <div className="absolute -top-[3px] -left-[4px] w-[14px] h-[6px]" style={{
                    backgroundColor: 'rgba(255,230,150,0.65)',
                    transform: 'rotate(-12deg)',
                    borderRadius: '1px',
                  }} />
                </div>
              </div>

              {/* Title with crayon underline + star behind last char */}
              <div className="relative mb-2">
                <h1 
                  className={`leading-tight relative font-caveat ${getTitleFontClass()}`} 
                  style={{ 
                    color: earthyColors.brown,
                  }}
                >
                  {/* Title text with inline star tucked behind last character */}
                  <span className="relative z-10">{title}</span>
                  <span className="gold-star select-none pointer-events-none relative z-0" style={{
                    fontSize: '0.65em',
                    display: 'inline-block',
                    verticalAlign: 'baseline',
                    marginLeft: '-0.6em',
                    marginBottom: '-0.15em',
                    transform: 'rotate(12deg) translateY(0.1em)',
                  }}>
                    <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path d="M313.991837 914.285714c-20.37551 0-40.228571-6.269388-56.946939-18.808163-30.302041-21.942857-44.930612-58.514286-38.661225-95.085714l24.032654-141.061225c3.134694-18.285714-3.134694-36.571429-16.195919-49.110204L123.297959 509.910204c-26.644898-26.122449-36.04898-64.261224-24.555102-99.787755 11.493878-35.526531 41.795918-61.126531 78.889796-66.35102l141.583674-20.375511c18.285714-2.612245 33.959184-14.106122 41.795918-30.30204l63.216326-128.522449C440.946939 130.612245 474.383673 109.714286 512 109.714286s71.053061 20.897959 87.24898 54.334694L662.987755 292.571429c8.359184 16.195918 24.032653 27.689796 41.795918 30.30204l141.583674 20.375511c37.093878 5.22449 67.395918 30.82449 78.889796 66.35102 11.493878 35.526531 2.089796 73.665306-24.555102 99.787755l-102.4 99.787755c-13.061224 12.538776-19.330612 31.346939-16.195919 49.110204l24.032654 141.061225c6.269388 37.093878-8.359184 73.142857-38.661225 95.085714-30.302041 21.942857-69.485714 24.555102-102.4 7.314286L538.122449 836.440816c-16.195918-8.359184-35.526531-8.359184-51.722449 0l-126.955102 66.87347c-14.628571 7.314286-30.302041 10.971429-45.453061 10.971428z m162.481632-96.653061z" fill="#F2CB51"/></svg>
                  </span>
                </h1>
                {/* Crayon stroke underline */}
                <div className="mt-1 w-full" style={{
                  height: '6px',
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='200' height='6' viewBox='0 0 200 6' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 3 Q10 1 20 3 Q30 5 40 3 Q50 1 60 3 Q70 5 80 3 Q90 1 100 3 Q110 5 120 3 Q130 1 140 3 Q150 5 160 3 Q170 1 180 3 Q190 5 200 3' fill='none' stroke='${encodeURIComponent(earthyColors.brickRed)}' stroke-width='2.5' stroke-linecap='round' opacity='0.4'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'repeat-x',
                  backgroundSize: '200px 6px',
                }} />
              </div>

              {/* Subtitle — single line, auto-shrink to fit body area width */}
              <AutoFitSubtitle
                className="text-sm opacity-75 font-bold"
                style={{ 
                  color: earthyColors.brown,
                  fontFamily: '"Noto Serif SC", serif',
                }}
                maxWidth={322}
              >
                {subtitle}
              </AutoFitSubtitle>
            </div>

            {/* Divider with doodle dots */}
            <div className="mx-4 flex items-center gap-2 shrink-0 select-none" style={{ color: earthyColors.mustardYellow }}>
              <div className="flex-1 border-t-2 border-dashed opacity-40" style={{ borderColor: earthyColors.brown }} />
              <span className="text-xs opacity-60">✿</span>
              <span className="text-xs opacity-40">❋</span>
              <span className="text-xs opacity-60">✿</span>
              <div className="flex-1 border-t-2 border-dashed opacity-40" style={{ borderColor: earthyColors.brown }} />
            </div>

            {/* Body text area */}
            <div 
              className={`relative mx-4 mt-2 ${flexGrowClass} cursor-text ${minHeightClass}`}
              onClick={handleContainerClick}
            >
              {/* Lined paper effect — 使用 linear-gradient + background-size/repeat 实现，
                  html2canvas-pro 不支持 repeating-linear-gradient，但支持普通 linear-gradient */}
              <div className="absolute inset-0 pointer-events-none" style={{
                backgroundImage: `linear-gradient(to bottom, transparent 27px, ${earthyColors.brown} 27px)` ,
                backgroundSize: '100% 28px',
                backgroundRepeat: 'repeat',
                backgroundPosition: '0 4px',
                opacity: 0.08,
              }} />

              {/* Left margin crayon line */}
              <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-full" style={{ 
                backgroundColor: earthyColors.brickRed,
                opacity: 0.2,
                height: isLongText ? '100%' : undefined,
              }} />

              <div
                ref={editableRef}
                contentEditable={!isExporting}
                onInput={(e) => handleInput(e, false)}
                onCompositionStart={() => isComposing.current = true}
                onCompositionEnd={() => isComposing.current = false}
                suppressContentEditableWarning={true}
                className={`${getBodyClasses()} w-full pl-4 pr-1 py-1 block outline-none opacity-90 transform-none ${isLongText ? (isExporting ? 'h-auto' : 'min-h-[400px]') : 'h-full overflow-y-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]'}`}
                style={{ 
                  color: earthyColors.brown,
                  lineHeight: '28px',
                }}
              />
            </div>

            {/* Footer — author as cute "Written by" */}
            <div className="mx-4 mb-4 mt-auto pt-3 shrink-0 flex-none flex justify-between items-end relative z-10" style={{ marginTop: isLongText ? 'auto' : '0' }}>
              {/* Left: Author with cat paw avatar */}
                <div className="flex items-center gap-2" style={{ paddingBottom: '2px' }}>
                {/* Mini cat paw avatar circle */}
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center select-none"
                  style={{ 
                    backgroundColor: `${earthyColors.forestGreen}20`,
                    border: `2px solid ${earthyColors.forestGreen}`,
                    borderRadius: '50% 45% 55% 48%',
                  }}
                >
                  <svg viewBox="0 0 1024 1024" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
                    <path d="M578.358 232.332l0.665 1.664 0.665-1.065c40.429-58.962 98.825-76.298 171.095-49.313l2.696 1c60.558 23.424 92.169 70.772 97.992 130.466 1.963 20.065 0.665 41.393-2.829 60.693l-0.864 4.59 1.663-0.332a95.663 95.663 0 0 1 38.864-0.2l2.662 0.6c40.728 9.317 75.666 49.578 87.844 98.49 13.509 54.138-2.297 109.472-48.348 149.068-61.258 54.836-94.631 136.657-99.755 246.56a19.498 19.498 0 0 1-20.43 18.568 19.498 19.498 0 0 1-18.634-20.33C797.2 753.137 834.6 661.5 904.576 598.777c34.872-29.946 46.317-70.14 36.269-110.47-8.885-35.702-33.607-64.252-58.663-69.975-14.906-3.46-29.713-0.565-43.654 6.656a80.889 80.889 0 0 0-9.584 5.823l-1.664 1.23-2.163 1.664-0.399 0.266-0.233 0.233-0.366 0.233-1.564 0.665-4.658 1.897-1.065 0.2-1.297 0.166-1.598 0.1-3.193-0.166-5.857-1.83-6.389-4.991-3.726-6.921-0.8-5.723 0.234-2.996 0.333-1.463 0.166-0.666 1.864-4.292 0.5-0.998 0.265-0.4 0.4-0.532 0.166-0.166 0.2-0.333c9.482-14.974 17.734-53.572 14.44-87.145-4.492-45.918-27.384-80.224-73.203-97.958-69.11-26.686-115.793-4.226-147.736 72.404-7.42 17.735-33.44 15.206-37.267-3.627-18.967-93.8-66.416-130.667-147.937-117.324-89.573 16.97-119.453 69.21-93.932 166.703 4.724 18.001-16.238 31.677-30.979 20.197-42.457-33.074-87.244-35.204-138.42-5.923l-1.63 0.932-1.464 1.13c-47.814 36.603-58.33 73.004-41.725 118.556l0.798 2.197 1.331 3.393 0.699 1.697 1.431 3.394 0.764 1.665 1.532 3.426 1.63 3.394 1.73 3.461 1.797 3.46 1.93 3.56 1.996 3.594 2.163 3.66 2.263 3.76 2.395 3.86 2.53 3.96 2.661 4.06 2.795 4.225 2.962 4.325 3.128 4.526 3.26 4.658 3.46 4.825 5.491 7.62 7.986 10.846 13.941 18.633c11.148 14.907 20.33 33.607 27.618 56.067l1.73 5.49c4.492 14.774 8.186 31.145 11.114 49.08l1.098 6.787 0.998 6.988 0.466 3.493 0.864 7.188 0.833 7.32 0.732 7.454 0.332 3.793 0.666 7.686 0.566 7.852c0.2 2.63 0.332 5.292 0.499 7.987l0.433 8.118 0.366 8.319 0.333 8.419 0.2 8.551 0.065 4.358 0.133 8.818 0.034 8.951v4.525l-0.034 9.184-0.066 4.658-0.133 9.383-0.133 4.759-0.233 9.65-0.333 9.749a19.498 19.498 0 0 1-20.264 18.733 19.498 19.498 0 0 1-18.833-20.131l0.333-9.417 0.133-4.658 0.2-9.183 0.166-9.051 0.067-8.851V810.9l-0.133-8.418-0.167-8.252-0.233-8.12-0.166-3.992-0.333-7.853-0.4-7.72a793.353 793.353 0 0 0-0.233-3.826l-0.498-7.453-0.532-7.32-0.666-7.188-0.665-6.988a606.252 606.252 0 0 0-0.333-3.494l-0.8-6.754-0.864-6.655-0.433-3.227-0.931-6.389c-6.655-43.123-17.636-75.299-32.81-96.328l-13.207-17.702-6.588-8.917-6.156-8.419-3.86-5.323-5.457-7.72-3.394-4.892-3.26-4.758-3.095-4.658-2.961-4.459-2.795-4.359-2.663-4.259-2.495-4.192-1.231-2.03-2.33-4.06-1.13-1.996-2.164-3.993-1.065-1.963-1.996-3.894-1.93-3.892-1.83-3.893-1.763-3.86a241.902 241.902 0 0 1-0.832-1.963l-1.664-3.893a248.092 248.092 0 0 1-0.764-1.963l-1.565-3.993c-24.124-63.388-8.252-119.121 56.333-167.368a19.565 19.565 0 0 1 1.763-1.165c50.244-29.614 98.89-35.304 144.143-16.804l1.565 0.666v-0.333c-10.317-92.035 33.804-150.83 129.9-170.195l3.36-0.666c87.244-14.308 148.036 19.798 178.815 98.292z m-37.367 239.24c47.082 7.852 82.852 31.943 112.266 63.82 43.19 46.85 65.384 99.888 65.218 158.75-0.067 20.43-4.725 39.796-17.969 56.565-19.431 24.69-48.347 33.375-82.086 32.044-29.382-1.198-56-9.417-76.698-29.947-5.622-5.557-12.544-10.215-19.297-14.807a53.072 53.072 0 0 0-46.751-7.52c-8.485 2.496-17.303 4.859-24.889 8.718-25.488 12.91-52.773 11.978-80.257 4.326-36.734-10.315-63.686-30.446-70.541-64.651-2.895-14.376-2.895-30.314 1.265-44.088 24.123-79.726 80.09-134.66 171.261-160.282a149.2 149.2 0 0 1 68.478-2.928z m262.499 6.588a63.553 63.553 0 1 1 63.52 110.038 63.553 63.553 0 0 1-63.554-110.038z m-582.296-93.2a84.682 84.682 0 1 1 0 169.365 84.682 84.682 0 0 1 0-169.365z m385.28-68.545a84.682 84.682 0 1 1 161.114 52.374 84.682 84.682 0 0 1-161.114-52.34z m-254.08-42.325a84.682 84.682 0 1 1 161.079 52.34 84.682 84.682 0 0 1-161.08-52.34z" fill="${earthyColors.forestGreen}" />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <span className="text-[14px] lowercase tracking-wide opacity-70 font-pingfang" style={{ marginBottom: '-8px' }}>written by</span>
                  <span className="text-[16px] font-bold font-serif-sc" style={{ 
                    color: earthyColors.brown,
                  }}>{author}</span>
                </div>
              </div>

              {/* Right: Date — scrapbook luggage tag */}
              <div className="select-none" style={{ transform: 'rotate(6deg)' }}>
                <div className="relative">
                  {/* Tag body */}
                  <div className="relative px-2 py-0 flex items-center justify-center" style={{
                    backgroundColor: `${earthyColors.mustardYellow}20`,
                    border: `2px solid ${earthyColors.mustardYellow}`,
                    borderRadius: '4px 10px 10px 4px',
                    lineHeight: 0,
                  }}>
                    {/* Hole punch on left */}
                    <div className="absolute left-[3px] top-1/2 -translate-y-1/2 w-[5px] h-[5px] rounded-full" style={{ 
                      border: `1.5px solid ${earthyColors.mustardYellow}`,
                      backgroundColor: earthyColors.cream,
                    }} />
                    {/* Date text */}
                    <span className="text-[20px] font-black leading-none font-pingfang inline-block" style={{ 
                      color: earthyColors.brown,
                      transform: 'translate(3px, 1px)',
                    }}>
                      {String(new Date().getMonth() + 1)}/{String(new Date().getDate())}
                    </span>
                  </div>
                  {/* String loop from hole */}
                  <svg width="10" height="14" viewBox="0 0 10 14" className="absolute -left-[6px] top-1/2 -translate-y-1/2" style={{ overflow: 'visible' }}>
                    <path d="M8 7 Q0 2 3 0 Q6 -1 8 3" stroke={earthyColors.brown} strokeWidth="0.8" fill="none" opacity="0.35" strokeLinecap="round" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom decorative washi-tape strip */}
          <div className="mt-2 flex items-center justify-center gap-3 shrink-0 flex-none select-none opacity-60">
            <div className="flex gap-1">
              {[earthyColors.brickRed, earthyColors.forestGreen, earthyColors.mustardYellow, earthyColors.brickRed].map((c, i) => (
                <div key={i} className="w-5 h-1.5 rounded-full" style={{ backgroundColor: c, opacity: 0.5 }} />
              ))}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div 
        className={`relative z-10 p-6 flex flex-col ${isLongText ? 'flex-1' : 'flex-1'}`}
      >
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-10" style={{ background: `linear-gradient(to left, ${accentColor}, transparent)` }}></div>
        <div className="absolute top-6 left-6 w-12 h-1 bg-current" style={{ color: textColor }}></div>

        <div 
          className={`relative border-2 border-current p-1 flex-col flex ${flexGrowClass}`}
          style={{ 
             color: textColor
          }}
        >
          <div 
            className={`relative border border-current p-4 bg-white/20 backdrop-blur-sm flex flex-col ${flexGrowClass}`}
          >
            
            <div className="flex flex-col items-center mb-4 w-full shrink-0 flex-none">
              <h2 className={`w-full text-center leading-tight whitespace-nowrap z-20 ${getTitleFontClass()}`}>
                {title}
              </h2>

              <div className="w-full flex justify-between items-end mt-4 min-h-[40px] gap-4 relative z-10">
                 <div className="flex-1 pb-1 min-w-0">
                    <div className="inline-block px-3 py-1 text-white shadow-md transform -rotate-1 origin-bottom-left max-w-full overflow-hidden" style={{ backgroundColor: textColor }}>
                       <AutoFitSubtitle
                         className={`text-xl font-bold ${getBodyFontClass()}`}
                         maxWidth={280}
                       >
                         {subtitle}
                       </AutoFitSubtitle>
                    </div>
                 </div>

                 <div className="flex gap-2 shrink-0">
                     {displayCategories.map((cat, idx) => (
                        <div 
                          key={idx} 
                          className="border-2 px-1 py-2 bg-white/80 shadow-sm relative shrink-0"
                          style={{ borderColor: textColor }}
                        >
                           <div className="absolute inset-[2px] border border-current opacity-50" style={{ borderColor: textColor }}></div>
                            <div className="text-[10px] font-black tracking-[0.2em] relative z-10 flex flex-col items-center">
                              {cat.split('').map((char, charIndex) => (
                                <span key={charIndex} className="block leading-tight">{char}</span>
                              ))}
                            </div>
                        </div>
                     ))}
                 </div>
              </div>
            </div>

            <div 
               className={`relative ${flexGrowClass} cursor-text`}
               style={{
                 marginBottom: isLongText ? '0' : '0',
                 overflow: isLongText ? 'visible' : 'hidden'
               }}
               onClick={handleContainerClick}
            >
               <div
                  ref={editableRef}
                  contentEditable={!isExporting}
                  onInput={(e) => handleInput(e, false)}
                  onCompositionStart={() => isComposing.current = true}
                  onCompositionEnd={() => isComposing.current = false}
                  suppressContentEditableWarning={true}
                  className={`${getBodyClasses()} opacity-90 w-full outline-none ${isLongText ? 'h-auto overflow-visible' : 'h-full overflow-y-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]'}`}
                  style={{ color: textColor }}
                />
            </div>
            
            <div 
               className="pt-2 border-t border-dashed border-current opacity-60 flex justify-between text-[10px] font-mono shrink-0 flex-none mt-auto"
            >
               <span className="uppercase tracking-wide">By {author}</span>
               <span>{new Date().toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 容器高度：封面模式固定440px（导出scale:4 → 1760px PNG），长文模式完全由内容撑开
  const containerHeightClass = useMemo(() => {
      if (!isLongText) return 'h-[440px]';
      return 'h-auto';
  }, [isLongText]);

  // 长文模式下，如果传入了 longTextMinHeight，作为容器最小高度
  // 但导出时需要移除最小高度，避免额外空白一同输出
  const containerMinHeight = (!isExporting && isLongText && longTextMinHeight > 0)
    ? longTextMinHeight
    : undefined;

  return (
    <div 
      ref={ref}
      className={`relative shadow-2xl antialiased overflow-hidden w-[400px] shrink-0 ${containerHeightClass}`}
      style={{
        ...renderingIsolation,
        minHeight: containerMinHeight ? `${containerMinHeight}px` : undefined,
      }}
      data-long-text-scroll={isLongText ? true : undefined}
    >
      {layoutStyle !== 'storybook' && (
        <div 
          className="absolute inset-0 z-0"
          style={{ 
            background: `radial-gradient(circle at 10% 20%, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 80%)`,
            opacity: 0.6
          }}
        />
      )}
      
      {layoutStyle !== 'duality' && layoutStyle !== 'storybook' && (
        <div 
            className="absolute inset-0 pointer-events-none z-0"
            style={{
                backgroundImage: `linear-gradient(${textColor} 1px, transparent 1px), linear-gradient(90deg, ${textColor} 1px, transparent 1px)`,
                backgroundSize: '40px 40px',
                opacity: 0.05
            }}
        />
      )}

      {renderContent()}
    </div>
  );
});

export default CoverPreview;
