import React, { useState, useCallback, useEffect, useRef } from 'react';
import { CoverState, ContentPreset, EditorTab } from '../types';
import { 
  INITIAL_TITLE, 
  INITIAL_SUBTITLE, 
  INITIAL_BODY_TEXT, 
  INITIAL_AUTHOR, 
  INITIAL_BG_COLOR,
  INITIAL_ACCENT_COLOR,
  INITIAL_TEXT_COLOR,
  PALETTE, 
  DEFAULT_PRESETS,
  PastelColor,
  INITIAL_CATEGORY
} from '../constants';
import CoverPreview from './CoverPreview';
import EditorControls, { MobileDraftsStrip, MobileStylePanel, ContentEditorModal, MobileExportPanel } from './EditorControls';
import ExportModal from './ExportModal';
import RichTextToolbar from './RichTextToolbar';
import { ArrowDownTrayIcon, PaintBrushIcon, BookmarkIcon, ArrowsRightLeftIcon, SwatchIcon } from '@heroicons/react/24/solid';
import { toPng } from 'html-to-image';

const GOOGLE_FONTS_URL = "https://fonts.googleapis.com/css2?family=Ma+Shan+Zheng&family=Noto+Sans+SC:wght@400;500;700&family=Noto+Serif+SC:wght@400;500;700;900&family=ZCOOL+QingKe+HuangYou&display=swap";

async function getEmbedFontCSS() {
    try {
        const res = await fetch(GOOGLE_FONTS_URL);
        const css = await res.text();
        
        const urls: string[] = [];
        css.replace(/url\(([^)]+)\)/g, (match, url) => {
            urls.push(url.replace(/['"]/g, '').trim());
            return match;
        });

        const uniqueUrls = [...new Set(urls)];
        const fontMap = new Map<string, string>();

        await Promise.all(uniqueUrls.map(async (url) => {
            try {
                const response = await fetch(url);
                const blob = await response.blob();
                const reader = new FileReader();
                await new Promise((resolve) => {
                    reader.onloadend = () => resolve(null);
                    reader.readAsDataURL(blob);
                });
                if (reader.result) {
                    fontMap.set(url, reader.result as string);
                }
            } catch (e) {
                console.warn('Failed to load font', url, e);
            }
        }));

        let newCss = css;
        fontMap.forEach((base64, url) => {
            newCss = newCss.split(url).join(base64);
        });
        
        return newCss;
    } catch (e) {
        console.error('Error embedding fonts', e);
        return '';
    }
}

const App: React.FC = () => {
  const [state, setState] = useState<CoverState>(() => {
    try {
      const saved = localStorage.getItem('coverState_v3');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
           ...parsed,
           backgroundColor: parsed.backgroundColor || INITIAL_BG_COLOR,
           accentColor: parsed.accentColor || INITIAL_ACCENT_COLOR,
           textColor: parsed.textColor || INITIAL_TEXT_COLOR,
           titleFont: parsed.titleFont || 'serif',
           secondaryBodyText: parsed.secondaryBodyText || '',
           layoutStyle: parsed.layoutStyle || 'minimal'
        };
      }
    } catch (e) {
      console.error("Failed to load state", e);
    }
    return {
      title: INITIAL_TITLE,
      subtitle: INITIAL_SUBTITLE,
      bodyText: INITIAL_BODY_TEXT,
      secondaryBodyText: "",
      category: INITIAL_CATEGORY,
      author: INITIAL_AUTHOR,
      backgroundColor: INITIAL_BG_COLOR,
      accentColor: INITIAL_ACCENT_COLOR,
      textColor: INITIAL_TEXT_COLOR,
      titleFont: 'serif',
      bodyFont: 'serif',
      layoutStyle: 'minimal',
      mode: 'cover',
      bodyTextSize: 'text-[13px]',
      bodyTextAlign: 'text-justify',
      isBodyBold: false,
      isBodyItalic: false,
    };
  });

  const [activeTab, setActiveTab] = useState<EditorTab | undefined>(undefined);
  const [showExportModal, setShowExportModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportImage, setExportImage] = useState<string | null>(null);
  const [presets, setPresets] = useState<ContentPreset[]>(() => {
    try {
      const saved = localStorage.getItem('coverPresets_v3');
      return saved ? JSON.parse(saved) : DEFAULT_PRESETS;
    } catch {
      return DEFAULT_PRESETS;
    }
  });
  const [showContentModal, setShowContentModal] = useState(false);
  const [activePresetId, setActivePresetId] = useState<string | null>('preset_jianghu');
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [showBgColorPalette, setShowBgColorPalette] = useState(false);
  const [previewScale, setPreviewScale] = useState(1);
  const [viewportHeight, setViewportHeight] = useState<string>('100%');

  const previewRef = useRef<HTMLDivElement>(null);
  const bgColorPaletteRef = useRef<HTMLDivElement>(null);
  const bgColorButtonRef = useRef<HTMLButtonElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!window.visualViewport) return;

    const handleResize = () => {
        if (!window.visualViewport) return;
        setViewportHeight(`${window.visualViewport.height}px`);
    };

    window.visualViewport.addEventListener('resize', handleResize);
    window.visualViewport.addEventListener('scroll', handleResize);
    
    // Initial calculation
    handleResize();

    return () => {
      window.visualViewport?.removeEventListener('resize', handleResize);
      window.visualViewport?.removeEventListener('scroll', handleResize);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('coverState_v3', JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    localStorage.setItem('coverPresets_v3', JSON.stringify(presets));
  }, [presets]);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (
            bgColorPaletteRef.current && 
            !bgColorPaletteRef.current.contains(event.target as Node) &&
            bgColorButtonRef.current &&
            !bgColorButtonRef.current.contains(event.target as Node)
        ) {
            setShowBgColorPalette(false);
        }
    };

    if (showBgColorPalette) {
        document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showBgColorPalette]);

  useEffect(() => {
    const handleResize = () => {
        if (previewContainerRef.current) {
            const width = previewContainerRef.current.clientWidth;
            if (width < 432) {
                setPreviewScale((width - 32) / 400);
            } else {
                setPreviewScale(1);
            }
        }
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    setTimeout(handleResize, 100);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleStateChange = useCallback((newState: Partial<CoverState>) => {
    setState(prev => ({ ...prev, ...newState }));
  }, []);

  const handleSavePreset = (name: string) => {
    const newId = Date.now().toString();
    const newPreset: ContentPreset = {
      id: newId,
      name,
      title: state.title,
      subtitle: state.subtitle,
      bodyText: state.bodyText,
      secondaryBodyText: state.secondaryBodyText,
      category: state.category,
      author: state.author
    };
    setPresets(prev => [newPreset, ...prev]);
    return newId;
  };

  const handleDeletePreset = (id: string) => {
    setPresets(prev => prev.filter(p => p.id !== id));
    if (activePresetId === id) setActivePresetId(null);
  };

  const handleLoadPreset = (preset: ContentPreset) => {
    setState(prev => ({
      ...prev,
      title: preset.title,
      subtitle: preset.subtitle,
      bodyText: preset.bodyText || prev.bodyText,
      secondaryBodyText: preset.secondaryBodyText || prev.secondaryBodyText || '',
      category: preset.category,
      author: preset.author
    }));
    setActivePresetId(preset.id);
  };

  const handleCreateNew = () => {
    setState(prev => ({
        ...prev,
        title: '',
        subtitle: '',
        bodyText: '',
        secondaryBodyText: '',
        category: '',
        author: INITIAL_AUTHOR
    }));
    setActivePresetId(null);
    setIsCreatingNew(true);
    setShowContentModal(true);
  }

  const handleModalConfirm = () => {
    if (isCreatingNew) {
      const name = state.title || '未命名草稿';
      const newId = handleSavePreset(name);
      setActivePresetId(newId);
      setIsCreatingNew(false);
    } else if (activePresetId) {
      setPresets(prev => prev.map(p => 
        p.id === activePresetId 
          ? { 
              ...p, 
              title: state.title, 
              subtitle: state.subtitle, 
              bodyText: state.bodyText, 
              secondaryBodyText: state.secondaryBodyText,
              category: state.category,
              author: state.author,
              name: state.title || p.name 
            } 
          : p
      ));
    }
    setShowContentModal(false);
  };

  const handleExport = async () => {
    if (!previewRef.current) return;
    
    setIsExporting(true);
    setExportImage(null);
    setShowExportModal(true);

    try {
      await document.fonts.ready;
      await new Promise(resolve => setTimeout(resolve, 200)); 

      const fontCss = await getEmbedFontCSS();

      const exportOptions: any = {
        cacheBust: true,
        pixelRatio: 4, 
        backgroundColor: state.backgroundColor,
        fontEmbedCSS: fontCss,
      };

      if (state.mode === 'cover') {
        exportOptions.width = 400;
        exportOptions.height = 440; 
        exportOptions.style = {
           width: '400px',
           height: '440px',
           maxWidth: 'none',
           maxHeight: 'none',
           transform: 'none',
           margin: '0',
        };
      } else {
        exportOptions.width = 400;
         exportOptions.style = {
           width: '400px',
           maxWidth: 'none',
           transform: 'none',
           margin: '0',
        };
      }

      const dataUrl = await toPng(previewRef.current, exportOptions);

      setExportImage(dataUrl);
    } catch (error) {
      console.error("Export failed:", error);
      alert("导出失败，请重试");
      setShowExportModal(false);
    } finally {
      setIsExporting(false);
    }
  };

  const downloadImage = () => {
    if (!exportImage) return;
    const link = document.createElement('a');
    link.href = exportImage;
    link.download = `cover-${Date.now()}.png`;
    link.click();
  };

  const toggleMobileTab = (tab: EditorTab) => {
    setShowBgColorPalette(false);
    if (activeTab === tab) {
      setActiveTab(undefined);
    } else {
      setActiveTab(tab);
    }
  };
  
  const toggleBgPalette = () => {
    setActiveTab(undefined);
    setShowBgColorPalette(prev => !prev);
  };

  const handleModeToggle = () => {
    setActiveTab(undefined);
    setShowBgColorPalette(false);
    handleStateChange({ mode: state.mode === 'cover' ? 'long-text' : 'cover' });
  };
  
  const handleExportClick = () => {
      setActiveTab(undefined);
      setShowBgColorPalette(false);
      handleExport();
  };

  return (
    <div 
        className="flex flex-col lg:flex-row fixed inset-0 w-full bg-gray-50 overflow-hidden text-gray-800"
        style={{ height: viewportHeight }}
    >
      <div className="hidden lg:block w-96 bg-white border-r border-gray-200 z-10 shadow-[4px_0_24px_rgba(0,0,0,0.02)] shrink-0 h-full overflow-hidden">
        <EditorControls 
          state={state} 
          onChange={handleStateChange}
          presets={presets}
          onSavePreset={handleSavePreset}
          onDeletePreset={handleDeletePreset}
          onLoadPreset={handleLoadPreset}
          onExport={handleExport}
          activeTab={activeTab || 'style'} 
          onTabChange={(t) => setActiveTab(t)}
          isExporting={isExporting}
        />
      </div>

      <div className="flex-1 relative flex flex-col h-full overflow-hidden">
        <div className="lg:hidden h-14 bg-white border-b border-gray-200 flex items-center justify-center px-4 shrink-0 z-20 flex-none">
            <span className="font-bold text-gray-800">衔书又止</span>
        </div>

        <div className="flex-1 relative overflow-hidden bg-gray-100/50 flex flex-col">
            <div 
                ref={previewContainerRef}
                className="flex-1 overflow-y-auto overflow-x-hidden flex justify-center custom-scrollbar items-start"
            >
               <div className="transition-all duration-300 w-full lg:w-auto p-0 lg:p-8 min-h-full lg:h-auto flex justify-center items-center">
                  <div style={{ transform: `scale(${previewScale})`, transformOrigin: 'center center' }}>
                    <CoverPreview 
                        ref={previewRef}
                        state={state}
                        onBodyTextChange={(val) => handleStateChange({ bodyText: val })}
                        onSecondaryBodyTextChange={(val) => handleStateChange({ secondaryBodyText: val })}
                        isExporting={isExporting}
                    />
                  </div>
               </div>
            </div>

            {showBgColorPalette && (
                <div 
                    ref={bgColorPaletteRef}
                    className="fixed z-50 bottom-32 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-md border border-gray-200 shadow-xl rounded-xl p-4 flex flex-wrap justify-center gap-3 animate-in slide-in-from-bottom-2 fade-in"
                    style={{ width: 'max-content', maxWidth: '90vw' }}
                >
                    {PALETTE.map((color) => (
                        <button
                            key={color.value}
                            onClick={() => {
                                handleStateChange({ backgroundColor: color.value });
                                setShowBgColorPalette(false);
                            }}
                            className={`w-10 h-10 rounded-full border shadow-sm hover:scale-110 transition-transform ${state.backgroundColor === color.value ? 'ring-2 ring-purple-500 ring-offset-2' : 'border-gray-200'}`}
                            style={{ backgroundColor: color.value }}
                            title={color.label}
                        />
                    ))}
                </div>
            )}

            <div className="lg:hidden flex-none z-40 flex flex-col shadow-[0_-4px_20px_rgba(0,0,0,0.08)] bg-white">
                <div className="relative w-full bg-gray-50/50">
                    {activeTab === 'drafts' && <MobileDraftsStrip 
                        presets={presets} 
                        onLoadPreset={handleLoadPreset} 
                        onDeletePreset={handleDeletePreset} 
                        onSavePreset={handleSavePreset} 
                        state={state} 
                        onEditContent={() => setShowContentModal(true)} 
                        activePresetId={activePresetId} 
                        onCreateNew={handleCreateNew} 
                        onChange={handleStateChange}
                        onExport={handleExport}
                    />}
                    {activeTab === 'style' && <MobileStylePanel 
                        state={state} 
                        onChange={handleStateChange} 
                        onExport={handleExport}
                    />}
                    {activeTab === 'export' && <MobileExportPanel
                        state={state}
                        onChange={handleStateChange}
                        onExport={handleExport}
                        isExporting={isExporting}
                    />}
                    
                    {!activeTab && <RichTextToolbar
                        visible={true}
                        state={state}
                        onChange={handleStateChange}
                    />}
                </div>

                <div 
                  className="h-16 bg-white border-t border-gray-100 flex items-center justify-around px-2 relative z-50"
                >
                      <button onClick={() => toggleMobileTab('drafts')} className={`flex flex-col items-center gap-1 transition-colors w-16 ${activeTab === 'drafts' ? 'text-purple-600' : 'text-gray-500'}`}>
                        <BookmarkIcon className="w-6 h-6" />
                        <span className="text-[10px] font-bold">草稿</span>
                      </button>
                      <button onClick={() => toggleMobileTab('style')} className={`flex flex-col items-center gap-1 transition-colors w-16 ${activeTab === 'style' ? 'text-purple-600' : 'text-gray-500'}`}>
                        <PaintBrushIcon className="w-6 h-6" />
                        <span className="text-[10px] font-bold">风格</span>
                      </button>
                      <button 
                        ref={bgColorButtonRef}
                        onClick={toggleBgPalette}
                        className="w-12 h-12 rounded-full border-4 border-white shadow-lg -translate-y-4 bg-gradient-to-br from-rose-200 to-blue-200 flex items-center justify-center relative z-50"
                        style={{ backgroundColor: state.backgroundColor }}
                      >
                        <SwatchIcon className="w-6 h-6 text-white/80" />
                      </button>
                      <button onClick={handleModeToggle} className="flex flex-col items-center gap-1 text-gray-500 transition-colors w-16">
                        <ArrowsRightLeftIcon className="w-6 h-6" />
                        <span className="text-[10px] font-bold">{state.mode === 'cover' ? '长图' : '封面'}</span>
                      </button>
                      <button onClick={() => toggleMobileTab('export')} className={`flex flex-col items-center gap-1 transition-colors w-16 ${activeTab === 'export' ? 'text-purple-600' : 'text-gray-500'}`}>
                        <ArrowDownTrayIcon className="w-6 h-6" />
                        <span className="text-[10px] font-bold">导出</span>
                      </button>
                </div>
            </div>
        </div>

        {showExportModal && (
          <ExportModal 
            imageUrl={exportImage} 
            isExporting={isExporting}
            onClose={() => setShowExportModal(false)}
            onDownload={downloadImage}
          />
        )}

        <ContentEditorModal 
          isOpen={showContentModal}
          onClose={() => {
            setShowContentModal(false);
            if (isCreatingNew) {
                setIsCreatingNew(false);
                if (presets.length > 0) {
                    handleLoadPreset(presets[0]);
                }
            }
          }}
          state={state}
          onChange={handleStateChange}
          onConfirm={handleModalConfirm}
        />
      </div>
    </div>
  );
};

export default App;