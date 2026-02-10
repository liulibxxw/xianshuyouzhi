import React, { useEffect, useState, forwardRef, useRef } from 'react';
import { CoverState } from '../types';

interface CoverPreviewProps {
  state: CoverState;
  onBodyTextChange: (text: string) => void;
  isExporting?: boolean;
}

const CoverPreview = forwardRef<HTMLDivElement, CoverPreviewProps>(({ state, onBodyTextChange, isExporting = false }, ref) => {
  const { 
    title, 
    subtitle, 
    bodyText,
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

  const [noiseDataUrl, setNoiseDataUrl] = useState<string>('');
  const editableRef = useRef<HTMLDivElement>(null);
  const isComposing = useRef(false);

  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const idata = ctx.createImageData(canvas.width, canvas.height);
    const buffer32 = new Uint32Array(idata.data.buffer);
    const len = buffer32.length;

    for (let i = 0; i < len; i++) {
        if (Math.random() < 0.5) {
            buffer32[i] = 0x08000000; 
        }
    }
    ctx.putImageData(idata, 0, 0);
    setNoiseDataUrl(canvas.toDataURL());
  }, []);

  useEffect(() => {
    const el = editableRef.current;
    if (el && el.innerHTML !== bodyText && !isComposing.current) {
      el.innerHTML = bodyText;
    }
  }, [bodyText, layoutStyle, mode]);

  const handleContainerClick = (e: React.MouseEvent) => {
    if (isExporting) return;
    
    if (editableRef.current && editableRef.current.contains(e.target as Node)) {
        return;
    }

    if (editableRef.current) {
      editableRef.current.focus();
      const range = document.createRange();
      range.selectNodeContents(editableRef.current);
      range.collapse(false);
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }
  };

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
      const html = e.currentTarget.innerHTML;
      if (html !== bodyText) {
        onBodyTextChange(html);
      }
  };

  const isLongText = mode === 'long-text';
  const flexGrowClass = isLongText ? 'flex-auto' : 'flex-1';
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
          className={`relative z-10 p-6 w-full flex flex-col justify-between ${isLongText ? 'flex-auto' : 'h-full overflow-hidden'}`}
        >
          {renderTechDecorations()}

          <div className={`${flexGrowClass} flex flex-col ${minHeightClass}`}>
              <div className="flex justify-between items-center border-b pb-2 mb-4 opacity-80 shrink-0" style={{ borderColor: `${textColor}40` }}>
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-sm animate-pulse" style={{ backgroundColor: accentColor }}></div>
                    <span className="text-[9px] font-mono tracking-widest font-bold" style={{ color: textColor }}>SYSTEM_NORMAL</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="h-1 w-12 bg-current opacity-20" style={{ color: textColor }}>
                      <div className="h-full w-2/3 bg-current" style={{ color: textColor }}></div>
                    </div>
                    <span className="text-[9px] font-mono opacity-60 tracking-widest" style={{ color: textColor }}>
                      REC-{Math.floor(Math.random() * 9999)}
                    </span>
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
                <p className={`text-sm font-bold opacity-80 ${getBodyFontClass()}`} style={{ color: textColor }}>
                  / {subtitle}
                </p>
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
                      onInput={handleInput}
                      onCompositionStart={() => isComposing.current = true}
                      onCompositionEnd={() => isComposing.current = false}
                      suppressContentEditableWarning={true}
                      className={`${getBodyClasses()} w-full p-0 m-0 block opacity-90 transform-none ${isLongText ? 'h-auto overflow-visible min-h-[100px]' : 'h-full overflow-y-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]'}`}
                      style={{ color: textColor }}
                    />
                </div>
              </div>
          </div>
          
          <div className="shrink-0 flex flex-col mt-2">
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
          className={`relative z-10 p-8 flex flex-col ${flexGrowClass}`}
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
             <span className={`px-4 py-1 border-y border-current text-xs tracking-widest uppercase opacity-80 ${getBodyFontClass()}`} style={{ color: textColor, borderColor: `${textColor}40` }}>
               {subtitle}
             </span>
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
                onInput={handleInput}
                onCompositionStart={() => isComposing.current = true}
                onCompositionEnd={() => isComposing.current = false}
                suppressContentEditableWarning={true}
                className={`${getBodyClasses()} px-2 w-full outline-none ${isLongText ? 'h-auto' : 'h-full overflow-y-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]'}`}
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

    return (
      <div 
        className={`relative z-10 p-6 flex flex-col ${flexGrowClass}`}
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
                    <div className="inline-block px-3 py-1 text-white shadow-md transform -rotate-1 origin-bottom-left whitespace-nowrap max-w-full overflow-hidden text-ellipsis" style={{ backgroundColor: textColor }}>
                       <p className={`text-xl md:text-2xl font-bold ${getBodyFontClass()} whitespace-nowrap overflow-hidden text-ellipsis`}>
                         {subtitle}
                       </p>
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
                  onInput={handleInput}
                  onCompositionStart={() => isComposing.current = true}
                  onCompositionEnd={() => isComposing.current = false}
                  suppressContentEditableWarning={true}
                  className={`${getBodyClasses()} opacity-90 w-full outline-none`}
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

  return (
    <div 
      ref={ref}
      className={`relative shadow-2xl antialiased overflow-hidden w-[400px] shrink-0 ${
        isLongText 
          ? 'h-auto min-h-[600px] md:min-h-[712px]' 
          : 'h-[500px]'
      }`}
      style={{ 
        backgroundColor: backgroundColor,
        display: 'flex', 
        flexDirection: 'column'
      }}
    >
      <div 
        className="absolute inset-0 z-0"
        style={{ 
          background: `radial-gradient(circle at 10% 20%, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 80%)`,
          opacity: 0.6
        }}
      />
      
      {noiseDataUrl && (
        <div 
          className="absolute inset-0 pointer-events-none z-0 opacity-100 w-full h-full"
          style={{ 
            backgroundImage: `url(${noiseDataUrl})`,
            backgroundRepeat: 'repeat',
            mixBlendMode: 'normal' 
          }}
        />
      )}

      <div 
         className="absolute inset-0 pointer-events-none z-0"
         style={{
            backgroundImage: `linear-gradient(${textColor} 1px, transparent 1px), linear-gradient(90deg, ${textColor} 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
            opacity: 0.05
         }}
      />

      {renderContent()}
    </div>
  );
});

export default CoverPreview;