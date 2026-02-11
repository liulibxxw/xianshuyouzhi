
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { CoverState, ContentPreset, EditorTab, AdvancedPreset, TransformationRule } from './types';
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
} from './constants';
import CoverPreview from './components/CoverPreview';
import EditorControls, { MobileDraftsStrip, MobileStylePanel, ContentEditorModal, MobileExportPanel, MobileSearchPanel } from './components/EditorControls';
import { MobilePresetPanel } from './components/PresetPanel';
import ExportModal from './components/ExportModal';
import RichTextToolbar from './components/RichTextToolbar';
import { ArrowDownTrayIcon, PaintBrushIcon, BookmarkIcon, ArrowsRightLeftIcon, SwatchIcon, SparklesIcon, MagnifyingGlassIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';
import { toPng } from 'html-to-image';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

const GOOGLE_FONTS_URL = "https://fonts.googleapis.com/css2?family=Ma+Shan+Zheng&family=Noto+Sans+SC:wght@400;700&family=Noto+Serif+SC:wght@400;700;900&family=ZCOOL+QingKe+HuangYou&display=swap";

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
                if (reader.result) fontMap.set(url, reader.result as string);
            } catch (e) { console.warn('Failed to load font file for export:', url); }
        }));
        let newCss = css;
        fontMap.forEach((base64, url) => { newCss = newCss.split(url).join(base64); });
        return newCss;
    } catch (e) { console.error('Error embedding fonts for image export:', e); return ''; }
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
           layoutStyle: parsed.layoutStyle || 'minimal',
           mode: parsed.mode || 'long-text'
        };
      }
    } catch (e) { console.error("Failed to load state", e); }
    return {
      title: INITIAL_TITLE, subtitle: INITIAL_SUBTITLE, bodyText: INITIAL_BODY_TEXT, secondaryBodyText: "", dualityBodyText: "", dualitySecondaryBodyText: "",
      category: INITIAL_CATEGORY, author: INITIAL_AUTHOR, backgroundColor: INITIAL_BG_COLOR, accentColor: INITIAL_ACCENT_COLOR, textColor: INITIAL_TEXT_COLOR,
      titleFont: 'serif', bodyFont: 'serif', layoutStyle: 'minimal', mode: 'long-text', bodyTextSize: 'text-[13px]', bodyTextAlign: 'text-justify', isBodyBold: false, isBodyItalic: false,
    };
  });

  const [activeTab, setActiveTab] = useState<EditorTab | undefined>(undefined);
  const [showExportModal, setShowExportModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportImage, setExportImage] = useState<string | null>(null);
  const [exportFilename, setExportFilename] = useState<string>('cover.png');
  const [presets, setPresets] = useState<ContentPreset[]>(() => {
    try {
      const saved = localStorage.getItem('coverPresets_v3');
      return saved ? JSON.parse(saved) : DEFAULT_PRESETS;
    } catch { return DEFAULT_PRESETS; }
  });
  const [advancedPresets, setAdvancedPresets] = useState<AdvancedPreset[]>(() => {
    try {
      const saved = localStorage.getItem('advancedPresets_v1');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [showContentModal, setShowContentModal] = useState(false);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [showBgColorPalette, setShowBgColorPalette] = useState(false);
  const [previewScale, setPreviewScale] = useState(1);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const previewRef = useRef<HTMLDivElement>(null);
  const bgColorPaletteRef = useRef<HTMLDivElement>(null);
  const bgColorButtonRef = useRef<HTMLButtonElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  useEffect(() => {
    if (!window.visualViewport) return;
    const handleViewportChange = () => {
      const viewport = window.visualViewport;
      if (!viewport) return;
      const offset = window.innerHeight - viewport.height;
      setKeyboardHeight(offset > 150 ? offset : 0);
    };
    window.visualViewport.addEventListener('resize', handleViewportChange);
    window.visualViewport.addEventListener('scroll', handleViewportChange);
    return () => {
      window.visualViewport?.removeEventListener('resize', handleViewportChange);
      window.visualViewport?.removeEventListener('scroll', handleViewportChange);
    };
  }, []);

  useEffect(() => { localStorage.setItem('coverState_v3', JSON.stringify(state)); }, [state]);
  useEffect(() => { localStorage.setItem('coverPresets_v3', JSON.stringify(presets)); }, [presets]);
  useEffect(() => { localStorage.setItem('advancedPresets_v1', JSON.stringify(advancedPresets)); }, [advancedPresets]);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (bgColorPaletteRef.current && !bgColorPaletteRef.current.contains(event.target as Node) && bgColorButtonRef.current && !bgColorButtonRef.current.contains(event.target as Node)) {
            setShowBgColorPalette(false);
        }
    };
    if (showBgColorPalette) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showBgColorPalette]);

  useEffect(() => {
    const handleResize = () => {
        if (previewContainerRef.current) {
            const container = previewContainerRef.current;
            const availableW = container.clientWidth - 48; 
            const availableH = container.clientHeight - (state.mode === 'cover' ? 64 : 0);
            const targetW = 400;
            const targetH = state.mode === 'cover' ? 440 : 500;
            const scaleW = availableW / targetW;
            const scaleH = availableH / targetH;
            let finalScale = Math.min(scaleW, scaleH);
            setPreviewScale(Math.min(finalScale, 1));
        }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    setTimeout(handleResize, 50);
    return () => window.removeEventListener('resize', handleResize);
  }, [state.mode, activeTab, state.layoutStyle]);

  const handleStateChange = useCallback((patch: Partial<CoverState>) => {
    setState(prev => {
        const redirectedPatch = { ...patch };
        const currentLayout = redirectedPatch.layoutStyle || prev.layoutStyle;

        if (currentLayout === 'duality' && (patch.layoutStyle === undefined || patch.layoutStyle === 'duality')) {
            if (patch.bodyText !== undefined) {
                redirectedPatch.dualityBodyText = patch.bodyText;
                delete redirectedPatch.bodyText;
            }
            if (patch.secondaryBodyText !== undefined) {
                redirectedPatch.dualitySecondaryBodyText = patch.secondaryBodyText;
                delete redirectedPatch.secondaryBodyText;
            }
        }

        return { ...prev, ...redirectedPatch };
    });
  }, []);

  const handleSavePreset = (name: string) => {
    const newId = Date.now().toString();
    const newPreset: ContentPreset = {
      id: newId, name, title: state.title, subtitle: state.subtitle,
      bodyText: state.bodyText, secondaryBodyText: state.secondaryBodyText,
      dualityBodyText: state.dualityBodyText, dualitySecondaryBodyText: state.dualitySecondaryBodyText,
      category: state.category, author: state.author
    };
    setPresets(prev => [newPreset, ...prev]);
    return newId;
  };

  const handleDeletePreset = (id: string) => {
    setPresets(prev => prev.filter(p => p.id !== id));
    if (activePresetId === id) setActivePresetId(null);
  };

  const handleLoadPreset = (preset: ContentPreset) => {
    const isDualityPreset = preset.id === 'preset_duality' || (preset.category && preset.category.includes('二象性'));
    setState(prev => ({
        ...prev,
        title: preset.title,
        subtitle: preset.subtitle,
        layoutStyle: isDualityPreset ? 'duality' : (prev.layoutStyle === 'duality' ? 'minimal' : prev.layoutStyle),
        bodyText: preset.bodyText || prev.bodyText,
        secondaryBodyText: preset.secondaryBodyText || prev.secondaryBodyText,
        dualityBodyText: preset.dualityBodyText || prev.dualityBodyText,
        dualitySecondaryBodyText: preset.dualitySecondaryBodyText || prev.dualitySecondaryBodyText,
        category: preset.category,
        author: preset.author
    }));
    setActivePresetId(preset.id);
  };

  const handleSaveAdvancedPreset = (preset: AdvancedPreset) => {
    setAdvancedPresets(prev => {
        const existingIndex = prev.findIndex(p => p.id === preset.id);
        if (existingIndex > -1) { const newList = [...prev]; newList[existingIndex] = preset; return newList; }
        return [preset, ...prev];
    });
  };

  const handleApplyAdvancedPreset = (preset: AdvancedPreset) => {
    if (preset.coverState) handleStateChange(preset.coverState);
    if (preset.rules && preset.rules.length > 0) handleFormatText(preset.rules);
  };

  const handleFormatText = (rules: TransformationRule[]) => {
      if (!rules.length) return;
      const processHtml = (html: string) => {
        if (!html) return html;
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        const nodes = Array.from(tempDiv.childNodes);
        nodes.forEach(node => {
            let text = "";
            if (node.nodeType === Node.ELEMENT_NODE) text = (node as HTMLElement).innerText || "";
            else if (node.nodeType === Node.TEXT_NODE) text = node.textContent || "";
            if (!text.trim()) return;
            for (const rule of rules) {
                if (!rule.isActive) continue;
                let regex: RegExp;
                try { regex = new RegExp(rule.pattern, 'gi'); } catch (e) { continue; }
                if (regex.test(text)) {
                    const fmt = rule.formatting;
                    if (rule.structure === 'multi-align-row') {
                        const parts = text.split(/[|｜\t,，\u2014]+/).map(p => p.trim()).filter(Boolean);
                        if (parts.length > 0) {
                            const container = document.createElement('div');
                            container.className = 'multi-align-row';
                            container.style.display = 'grid'; container.style.gridTemplateColumns = '1fr 1fr 1fr'; container.style.width = '100%';
                            const createCol = (content: string, align: string) => {
                                const col = document.createElement('div'); col.style.textAlign = align; col.innerHTML = content || '&nbsp;';
                                if (fmt.fontSize) col.style.fontSize = `${fmt.fontSize}px`;
                                if (fmt.isBold) col.style.fontWeight = 'bold';
                                return col;
                            };
                            container.appendChild(createCol(parts[0], 'left'));
                            container.appendChild(createCol(parts.length > 2 ? parts[1] : "", 'center'));
                            container.appendChild(createCol(parts.length > 2 ? parts[2] : (parts.length === 2 ? parts[1] : ""), 'right'));
                            node.replaceWith(container); return; 
                        }
                    }
                    if (rule.scope === 'paragraph') {
                        let element = node.nodeType === Node.TEXT_NODE ? document.createElement('div') : (node as HTMLElement).cloneNode(true) as HTMLElement;
                        if (node.nodeType === Node.TEXT_NODE) element.textContent = node.textContent;
                        if (fmt.fontSize) element.style.fontSize = `${fmt.fontSize}px`;
                        if (fmt.isBold) element.style.fontWeight = 'bold';
                        if (fmt.textAlign) element.style.textAlign = fmt.textAlign;
                        node.replaceWith(element); return;
                    } else if (rule.scope === 'match') {
                        const styleStr = [fmt.color ? `color:${fmt.color}` : '', fmt.fontSize ? `font-size:${fmt.fontSize}px` : '', fmt.isBold ? `font-weight:bold` : ''].filter(Boolean).join(';');
                        if (node.nodeType === Node.TEXT_NODE) {
                            const span = document.createElement('span'); span.innerHTML = node.textContent!.replace(regex, match => `<span style="${styleStr}">${match}</span>`);
                            node.replaceWith(span);
                        } else (node as HTMLElement).innerHTML = (node as HTMLElement).innerHTML.replace(regex, match => `<span style="${styleStr}">${match}</span>`);
                        return;
                    }
                }
            }
        });
        return tempDiv.innerHTML;
      };
      
      if (state.layoutStyle === 'duality') {
          handleStateChange({ dualityBodyText: processHtml(state.dualityBodyText), dualitySecondaryBodyText: processHtml(state.dualitySecondaryBodyText) });
      } else {
          handleStateChange({ bodyText: processHtml(state.bodyText), secondaryBodyText: processHtml(state.secondaryBodyText) });
      }
  };

  const handleModalConfirm = () => {
    if (isCreatingNew) {
      const newId = handleSavePreset(state.title || '未命名草稿');
      setActivePresetId(newId); setIsCreatingNew(false);
    } else if (activePresetId) {
      setPresets(prev => prev.map(p => p.id === activePresetId ? { ...p, title: state.title, subtitle: state.subtitle, bodyText: state.bodyText, secondaryBodyText: state.secondaryBodyText, dualityBodyText: state.dualityBodyText, dualitySecondaryBodyText: state.dualitySecondaryBodyText, category: state.category, author: state.author, name: state.title || p.name } : p ));
    }
    setShowContentModal(false);
  };

  const toggleMobileTab = (tab: EditorTab) => {
    setShowBgColorPalette(false);
    if (activeTab === tab) setActiveTab(undefined);
    else setActiveTab(tab);
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

  const handleCreateNew = () => {
    setState(prev => ({ ...prev, title: '', subtitle: '', bodyText: '', secondaryBodyText: '', dualityBodyText: '', dualitySecondaryBodyText: '', category: '', author: INITIAL_AUTHOR }));
    setActivePresetId(null); setIsCreatingNew(true); setShowContentModal(true);
  }

  const handleExport = async (filename?: string) => {
    if (!previewRef.current) return;
    setIsExporting(true); 
    setExportImage(null); 
    if (filename) setExportFilename(filename);
    setShowExportModal(true);
    try {
      await document.fonts.ready; await new Promise(r => setTimeout(r, 500)); 
      const fontCss = await getEmbedFontCSS();
      const exportOptions: any = { cacheBust: true, pixelRatio: 4, backgroundColor: state.backgroundColor, fontEmbedCSS: fontCss };
      if (state.mode === 'cover') { exportOptions.width = 400; exportOptions.height = 440; exportOptions.style = { width: '400px', height: '440px', maxWidth: 'none', maxHeight: 'none', transform: 'none', margin: '0' }; }
      else { exportOptions.width = 400; exportOptions.style = { width: '400px', maxWidth: 'none', transform: 'none', margin: '0' }; }
      const dataUrl = await toPng(previewRef.current, exportOptions);
      setExportImage(dataUrl);
    } catch (e) { console.error("Export failed:", e); showToast("导出失败", "error"); setShowExportModal(false); } finally { setIsExporting(false); }
  };

  const downloadImage = async () => {
    if (!exportImage) return;
    const timestamp = Date.now();
    const fileName = `${exportFilename.split('.')[0]}-${timestamp}.png`;

    if (Capacitor.isNativePlatform()) {
      try {
        const base64Data = exportImage.split(',')[1];
        
        try {
          await Filesystem.writeFile({
            path: fileName,
            data: base64Data,
            directory: Directory.Documents,
            recursive: true
          });
          showToast(`已下载至系统“文档”：${fileName}`, "success");
        } catch (fileError) {
          const tempFile = await Filesystem.writeFile({
            path: `temp_${timestamp}.png`,
            data: base64Data,
            directory: Directory.Cache
          });
          
          await Share.share({
            title: '保存预览图',
            url: tempFile.uri,
          });
        }
      } catch (error) {
        console.error('Native download error:', error);
        showToast('无法保存图片，请检查权限', "error");
      }
    } else {
      const link = document.createElement('a');
      link.href = exportImage;
      link.download = fileName;
      link.click();
      showToast("开始下载图片", "success");
    }
  };

  const effectivePreviewState = {
    ...state,
    bodyText: state.layoutStyle === 'duality' ? state.dualityBodyText : state.bodyText,
    secondaryBodyText: state.layoutStyle === 'duality' ? state.dualitySecondaryBodyText : state.secondaryBodyText
  };

  return (
    <div className="flex flex-col lg:flex-row fixed inset-0 w-full h-full supports-[height:100dvh]:h-[100dvh] bg-gray-50 overflow-hidden text-gray-800">
      <div className="hidden lg:block w-96 bg-white border-r border-gray-200 z-10 shadow-[4px_0_24px_rgba(0,0,0,0.02)] shrink-0 h-full overflow-hidden">
        <EditorControls state={effectivePreviewState} onChange={handleStateChange} presets={presets} onSavePreset={handleSavePreset} onDeletePreset={handleDeletePreset} onLoadPreset={handleLoadPreset} onExport={handleExport} activeTab={activeTab || 'style'} onTabChange={setActiveTab} isExporting={isExporting} advancedPresets={advancedPresets} onSaveAdvancedPreset={handleSaveAdvancedPreset} onDeleteAdvancedPreset={id => setAdvancedPresets(p => p.filter(x => x.id !== id))} onApplyAdvancedPreset={handleApplyAdvancedPreset} onFormatText={handleFormatText} />
      </div>
      <div className="flex-1 relative flex flex-col h-full overflow-hidden">
        <div className="lg:hidden h-14 bg-white border-b border-gray-200 flex items-center justify-center px-4 shrink-0 z-20 flex-none"><span className="font-bold text-gray-800">衔书又止</span></div>
        <div className="flex-1 relative overflow-hidden bg-gray-100/50 flex flex-col">
            <div ref={previewContainerRef} className="flex-1 relative overflow-hidden">
               <div className="absolute inset-0 overflow-y-auto overflow-x-hidden flex flex-col items-center custom-scrollbar">
                  <div className={`flex-1 flex justify-center w-full min-h-full ${state.mode === 'cover' ? 'items-center p-4 lg:p-8' : 'items-start pt-0 pb-24 px-4 lg:pt-0'}`}>
                    <div className="transition-transform duration-300 relative flex justify-center" style={{ transform: `scale(${previewScale})`, transformOrigin: state.mode === 'cover' ? 'center center' : 'top center', width: '400px' }}>
                      <CoverPreview ref={previewRef} state={effectivePreviewState} onBodyTextChange={val => handleStateChange({ bodyText: val })} onSecondaryBodyTextChange={val => handleStateChange({ secondaryBodyText: val })} isExporting={isExporting} />
                    </div>
                  </div>
               </div>
            </div>
            {showBgColorPalette && (
                <div ref={bgColorPaletteRef} className="fixed z-50 bottom-32 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-md border border-gray-200 shadow-xl rounded-xl p-4 flex flex-wrap justify-center gap-3 animate-in slide-in-from-bottom-2 fade-in" style={{ width: 'max-content', maxWidth: '90vw' }}>
                    {PALETTE.map((color) => (<button key={color.value} onClick={() => { handleStateChange({ backgroundColor: color.value }); setShowBgColorPalette(false); }} className={`w-10 h-10 rounded-full border shadow-sm hover:scale-110 transition-transform ${state.backgroundColor === color.value ? 'ring-2 ring-purple-500 ring-offset-2' : 'border-gray-200'}`} style={{ backgroundColor: color.value }} />))}
                </div>
            )}
            <div className="lg:hidden flex-none z-40 flex flex-col shadow-[0_-4px_20px_rgba(0,0,0,0.08)] bg-white" style={{ paddingBottom: `${keyboardHeight}px`, transition: 'padding-bottom 0.1s ease-out' }}>
                <div className="relative w-full bg-gray-50/50 border-t border-gray-100/50">
                    {activeTab === 'drafts' && <MobileDraftsStrip presets={presets} onLoadPreset={handleLoadPreset} onDeletePreset={handleDeletePreset} onSavePreset={handleSavePreset} state={effectivePreviewState} onEditContent={() => setShowContentModal(true)} activePresetId={activePresetId} onCreateNew={handleCreateNew} onChange={handleStateChange} onExport={handleExport} />}
                    {activeTab === 'style' && <MobileStylePanel state={effectivePreviewState} onChange={handleStateChange} onExport={handleExport} />}
                    {activeTab === 'export' && <MobileExportPanel state={effectivePreviewState} onChange={handleStateChange} onExport={handleExport} isExporting={isExporting} />}
                    {activeTab === 'presets' && <MobilePresetPanel state={effectivePreviewState} presets={advancedPresets} onSavePreset={handleSaveAdvancedPreset} onDeletePreset={id => setAdvancedPresets(p => p.filter(x => x.id !== id))} onApplyPreset={handleApplyAdvancedPreset} onFormatText={handleFormatText} />}
                    {activeTab === 'search' && <MobileSearchPanel state={effectivePreviewState} onChange={handleStateChange} onExport={handleExport} />}
                    {!activeTab && <RichTextToolbar visible={true} state={effectivePreviewState} onChange={handleStateChange} />}
                </div>
                <div className="h-16 bg-white border-t border-gray-100 flex items-center justify-around px-2 relative z-50 shrink-0">
                      <button onClick={() => toggleMobileTab('drafts')} className={`flex flex-col items-center gap-1 transition-colors w-14 ${activeTab === 'drafts' ? 'text-purple-600' : 'text-gray-500'}`}><BookmarkIcon className="w-6 h-6" /><span className="text-[10px] font-bold">草稿</span></button>
                      <button onClick={() => toggleMobileTab('style')} className={`flex flex-col items-center gap-1 transition-colors w-14 ${activeTab === 'style' ? 'text-purple-600' : 'text-gray-500'}`}><PaintBrushIcon className="w-6 h-6" /><span className="text-[10px] font-bold">风格</span></button>
                      <button onClick={() => toggleMobileTab('presets')} className={`flex flex-col items-center gap-1 transition-colors w-14 ${activeTab === 'presets' ? 'text-purple-600' : 'text-gray-500'}`}><SparklesIcon className="w-6 h-6" /><span className="text-[10px] font-bold">预设</span></button>
                      <button ref={bgColorButtonRef} onClick={toggleBgPalette} className="w-12 h-12 rounded-full border-4 border-white shadow-lg -translate-y-4 bg-gradient-to-br from-rose-200 to-blue-200 flex items-center justify-center relative z-50" style={{ backgroundColor: state.backgroundColor }}><SwatchIcon className="w-6 h-6 text-white/80" /></button>
                      <button onClick={() => toggleMobileTab('search')} className={`flex flex-col items-center gap-1 transition-colors w-14 ${activeTab === 'search' ? 'text-purple-600' : 'text-gray-500'}`}><MagnifyingGlassIcon className="w-6 h-6" /><span className="text-[10px] font-bold">搜索</span></button>
                      <button onClick={handleModeToggle} className="flex flex-col items-center gap-1 text-gray-500 transition-colors w-14"><ArrowsRightLeftIcon className="w-6 h-6" /><span className="text-[10px] font-bold">{state.mode === 'cover' ? '长图' : '封面'}</span></button>
                      <button onClick={() => toggleMobileTab('export')} className={`flex flex-col items-center gap-1 transition-colors w-14 ${activeTab === 'export' ? 'text-purple-600' : 'text-gray-500'}`}><ArrowDownTrayIcon className="w-6 h-6" /><span className="text-[10px] font-bold">导出</span></button>
                </div>
            </div>
        </div>
        {showExportModal && <ExportModal imageUrl={exportImage} isExporting={isExporting} onClose={() => setShowExportModal(false)} onDownload={downloadImage} />}
        <ContentEditorModal isOpen={showContentModal} onClose={() => { setShowContentModal(false); if (isCreatingNew) { setIsCreatingNew(false); if (presets.length > 0) handleLoadPreset(presets[0]); } }} state={effectivePreviewState} onChange={handleStateChange} onConfirm={handleModalConfirm} />
        
        {toast && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none p-4">
            <div className={`pointer-events-auto px-6 py-5 rounded-2xl shadow-2xl flex flex-col items-center gap-3 border min-w-[280px] max-w-[90vw] animate-in fade-in zoom-in-95 duration-300 ${
              toast.type === 'success' ? 'bg-white/95 border-emerald-100' : 'bg-white/95 border-rose-100'
            } backdrop-blur-xl`}>
              <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-1 shadow-inner ${
                toast.type === 'success' ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'
              }`}>
                {toast.type === 'success' ? <CheckCircleIcon className="w-8 h-8" /> : <XCircleIcon className="w-8 h-8" />}
              </div>
              <div className="flex flex-col items-center gap-1">
                <p className="text-sm font-bold text-gray-800 text-center font-serif-sc tracking-wide">{toast.message}</p>
                <p className="text-[10px] text-gray-400 font-serif-sc opacity-80">衔书又止 · 系统提示</p>
              </div>
              <div className="mt-2 w-full h-1 bg-gray-50 rounded-full overflow-hidden">
                <div className={`h-full ${toast.type === 'success' ? 'bg-emerald-400' : 'bg-rose-400'} animate-toast-progress`}></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default App;