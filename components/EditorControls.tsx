import React, { useState, useMemo, useEffect } from 'react';
import { CoverState, LayoutStyle, ContentPreset, EditorTab, AdvancedPreset, TransformationRule } from '../types';
import { PALETTE, TEXT_PALETTE } from '../constants';
import { 
    BookmarkIcon, 
    TrashIcon, 
    CheckIcon, 
    XMarkIcon, 
    PlusIcon, 
    PencilSquareIcon, 
    PaintBrushIcon, 
    AdjustmentsHorizontalIcon,
    SwatchIcon,
    ArrowDownTrayIcon,
    ArrowPathIcon,
    SparklesIcon,
    MagnifyingGlassIcon,
    Bars3BottomLeftIcon,
    Bars3BottomRightIcon,
    Bars3Icon,
    ArrowsRightLeftIcon,
    MinusIcon
} from '@heroicons/react/24/solid';
import { SavePresetModal, MobilePresetPanel } from './PresetPanel';

export const MobileSearchPanel: React.FC<EditorControlsProps> = ({ state, onChange }) => {
  const [searchChar, setSearchChar] = useState('');
  const [isRegexMode, setIsRegexMode] = useState(false);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [batchFontSize, setBatchFontSize] = useState(13);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [rowEditData, setRowEditData] = useState({ left: '', center: '', right: '' });

  const allParagraphs = useMemo(() => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = state.bodyText || "";
    const nodes = Array.from(tempDiv.childNodes);
    return nodes.map((node, i) => {
        let text = "";
        if (node.nodeType === Node.ELEMENT_NODE) text = (node as HTMLElement).innerText || "";
        else if (node.nodeType === Node.TEXT_NODE) text = node.textContent || "";
        return { index: i, text: text.trim() };
    });
  }, [state.bodyText]);

  const matches = useMemo(() => {
    if (!searchChar.trim()) return [];
    let regex: RegExp | null = null;
    try { regex = isRegexMode ? new RegExp(searchChar, 'i') : null; } catch (e) { regex = null; }
    return allParagraphs.filter(p => {
        if (regex) return regex.test(p.text);
        return p.text.toLowerCase().includes(searchChar.toLowerCase());
    });
  }, [allParagraphs, searchChar, isRegexMode]);

  useEffect(() => {
    if (!searchChar.trim()) setSelectedIndices(new Set());
    else setSelectedIndices(new Set(matches.map(m => m.index)));
  }, [matches, searchChar]);

  const applyBatchAlign = (alignment: string) => {
    if (selectedIndices.size === 0) return;
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = state.bodyText || "";
    const nodes = Array.from(tempDiv.childNodes);
    nodes.forEach((node, i) => {
        if (selectedIndices.has(i)) {
            let targetEl: HTMLElement;
            if (node.nodeType === Node.TEXT_NODE) {
                const wrapper = document.createElement('div');
                wrapper.textContent = node.textContent;
                node.replaceWith(wrapper);
                targetEl = wrapper;
            } else targetEl = node as HTMLElement;
            targetEl.style.textAlign = alignment === 'justify' ? 'justify' : alignment;
        }
    });
    onChange({ bodyText: tempDiv.innerHTML });
  };

  const applyStyleToMatches = (styles: { color?: string, fontSize?: string }) => {
    if (!searchChar || selectedIndices.size === 0) return;
    let regex: RegExp;
    try {
        const pattern = isRegexMode ? searchChar : searchChar.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        regex = new RegExp(`(${pattern})(?![^<]*>)`, 'gi');
    } catch (e) { return; }
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = state.bodyText || "";
    const nodes = Array.from(tempDiv.childNodes);
    nodes.forEach((node, i) => {
        if (selectedIndices.has(i)) {
            const styleStr = [styles.color ? `color:${styles.color}` : '', styles.fontSize ? `font-size:${styles.fontSize}` : ''].filter(Boolean).join(';');
            if (node.nodeType === Node.ELEMENT_NODE) {
                (node as HTMLElement).innerHTML = (node as HTMLElement).innerHTML.replace(regex, match => `<span style="${styleStr}">${match}</span>`);
            } else if (node.nodeType === Node.TEXT_NODE) {
                const span = document.createElement('span');
                span.innerHTML = node.textContent!.replace(regex, match => `<span style="${styleStr}">${match}</span>`);
                node.replaceWith(span);
            }
        }
    });
    onChange({ bodyText: tempDiv.innerHTML });
  };

  const getSelectionText = () => {
    return window.getSelection()?.toString() || '';
  };

  const submitRowEdit = (index: number) => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = state.bodyText || "";
    const nodes = Array.from(tempDiv.childNodes);
    const target = nodes[index];
    if (target) {
        const rowHtml = `<div class="multi-align-row" style="display: grid; grid-template-columns: 1fr 1fr 1fr; width: 100%; gap: 4px; margin: 4px 0;">
            <div style="text-align: left;">${rowEditData.left || '&nbsp;'}</div>
            <div style="text-align: center;">${rowEditData.center || '&nbsp;'}</div>
            <div style="text-align: right;">${rowEditData.right || '&nbsp;'}</div>
        </div>`;
        const newEl = document.createElement('div');
        newEl.innerHTML = rowHtml;
        target.replaceWith(newEl.firstChild!);
        onChange({ bodyText: tempDiv.innerHTML });
        setEditingIndex(null);
    }
  };

  return (
    <div className="w-full h-80 bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-[0_-8px_16px_-4px_rgba(0,0,0,0.1)] flex flex-col pointer-events-auto z-50">
       <div className="px-4 py-3 flex items-center justify-between border-b border-gray-100 shrink-0 h-12">
          <span className="text-sm font-bold text-gray-800">搜索与批量修饰</span>
          <span className="text-[10px] text-gray-400 font-mono">MATCHES: {matches.length}</span>
       </div>
       <div className="flex-1 overflow-y-auto px-4 py-3 custom-scrollbar flex flex-col gap-3">
          <div className="flex gap-2">
              <div className="relative flex-1">
                  <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-purple-300 transition-all focus:bg-white"
                    placeholder="搜索并批量修饰正文..."
                    value={searchChar}
                    onChange={e => setSearchChar(e.target.value)}
                  />
              </div>
              <button 
                onClick={() => setIsRegexMode(!isRegexMode)}
                className={`px-3 rounded-xl text-[10px] font-black border transition-all ${isRegexMode ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-400 border-gray-200'}`}
              >REG</button>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-1 custom-scrollbar pb-2">
              {matches.length === 0 ? (
                  <div className="py-8 text-center text-[10px] text-gray-400 opacity-60 flex flex-col items-center gap-2">
                    <MagnifyingGlassIcon className="w-6 h-6 opacity-20" />
                    输入文字开始批量修饰
                  </div>
              ) : matches.map(m => (
                  <div key={m.index} className="p-2 bg-gray-50 border border-gray-100 rounded-xl flex flex-col gap-2">
                      <div className="flex items-start gap-2">
                        <input type="checkbox" checked={selectedIndices.has(m.index)} onChange={() => {
                            const next = new Set(selectedIndices);
                            if (next.has(m.index)) next.delete(m.index); else next.add(m.index);
                            setSelectedIndices(next);
                        }} className="mt-1 rounded text-purple-600 w-4 h-4" />
                        <span className="text-[11px] text-gray-600 flex-1 line-clamp-1">{m.text}</span>
                        <button onClick={() => { setEditingIndex(m.index); setRowEditData({ left: m.text, center: '', right: '' }); }} className="text-gray-400 hover:text-purple-600 p-1"><ArrowsRightLeftIcon className="w-4 h-4"/></button>
                      </div>
                      {editingIndex === m.index && (
                          <div className="p-2 bg-white border border-purple-100 rounded-lg flex flex-col gap-2 animate-in fade-in zoom-in-95">
                              <div className="grid grid-cols-3 gap-1">
                                  <div className="flex flex-col gap-1">
                                    <textarea className="text-[10px] p-2 bg-gray-50 border rounded-lg h-12 outline-none focus:border-purple-300 w-full" value={rowEditData.left} onChange={e => setRowEditData({...rowEditData, left: e.target.value})} placeholder="左"/>
                                    <button onClick={() => setRowEditData({...rowEditData, left: getSelectionText()})} className="py-1 bg-purple-50 text-purple-600 text-[8px] font-bold rounded border border-purple-100">填入左</button>
                                  </div>
                                  <div className="flex flex-col gap-1">
                                    <textarea className="text-[10px] p-2 bg-gray-50 border rounded-lg h-12 outline-none focus:border-purple-300 w-full" value={rowEditData.center} onChange={e => setRowEditData({...rowEditData, center: e.target.value})} placeholder="中"/>
                                    <button onClick={() => setRowEditData({...rowEditData, center: getSelectionText()})} className="py-1 bg-purple-50 text-purple-600 text-[8px] font-bold rounded border border-purple-100">填入中</button>
                                  </div>
                                  <div className="flex flex-col gap-1">
                                    <textarea className="text-[10px] p-2 bg-gray-50 border rounded-lg h-12 outline-none focus:border-purple-300 w-full" value={rowEditData.right} onChange={e => setRowEditData({...rowEditData, right: e.target.value})} placeholder="右"/>
                                    <button onClick={() => setRowEditData({...rowEditData, right: getSelectionText()})} className="py-1 bg-purple-50 text-purple-600 text-[8px] font-bold rounded border border-purple-100">填入右</button>
                                  </div>
                              </div>
                              <button onClick={() => submitRowEdit(m.index)} className="py-2 bg-purple-600 text-white text-[10px] rounded-lg font-bold uppercase tracking-widest shadow-sm">确认修改</button>
                          </div>
                      )}
                  </div>
              ))}
          </div>

          {selectedIndices.size > 0 && (
              <div className="bg-white p-3 rounded-2xl border border-gray-200 shadow-xl flex flex-col gap-3 shrink-0 mb-2">
                  <div className="flex gap-2">
                      <button onClick={() => applyBatchAlign('left')} className="flex-1 py-2 bg-gray-50 border border-gray-100 rounded-xl flex justify-center text-gray-500 active:bg-purple-50 active:text-purple-600 transition-colors"><Bars3BottomLeftIcon className="w-5 h-5"/></button>
                      <button onClick={() => applyBatchAlign('center')} className="flex-1 py-2 bg-gray-50 border border-gray-100 rounded-xl flex justify-center text-gray-500 active:bg-purple-50 active:text-purple-600 transition-colors"><Bars3Icon className="w-5 h-5"/></button>
                      <button onClick={() => applyBatchAlign('right')} className="flex-1 py-2 bg-gray-50 border border-gray-100 rounded-xl flex justify-center text-gray-500 active:bg-purple-50 active:text-purple-600 transition-colors"><Bars3BottomRightIcon className="w-5 h-5"/></button>
                  </div>
                  <div className="flex items-center gap-3">
                      <div className="flex gap-1.5 overflow-x-auto flex-1 custom-scrollbar py-1">
                          {TEXT_PALETTE.map(c => <button key={c.value} onClick={() => applyStyleToMatches({color: c.value})} className="w-6 h-6 rounded-full border border-gray-200 shrink-0 hover:scale-110 transition-transform shadow-sm" style={{backgroundColor: c.value}}/>)}
                      </div>
                      <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-xl border">
                         <input type="range" min="10" max="40" value={batchFontSize} onChange={e => {setBatchFontSize(parseInt(e.target.value)); applyStyleToMatches({fontSize: `${e.target.value}px`});}} className="w-20 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600" />
                         <span className="text-[10px] font-mono font-bold text-gray-500 w-4">{batchFontSize}</span>
                      </div>
                  </div>
              </div>
          )}
       </div>
    </div>
  );
};

interface EditorControlsProps {
  state: CoverState;
  onChange: (newState: Partial<CoverState>) => void;
  presets?: ContentPreset[];
  onSavePreset?: (name: string) => void;
  onDeletePreset?: (id: string) => void;
  onRenamePreset?: (id: string, newName: string) => void;
  onLoadPreset?: (preset: ContentPreset) => void;
  onExport: (filename?: string) => void;
  activeTab?: EditorTab;
  onTabChange?: (tab: EditorTab) => void;
  onClose?: () => void; 
  mobileView?: EditorTab;
  onEditContent?: () => void;
  activePresetId?: string | null;
  onCreateNew?: () => void;
  isExporting?: boolean;
  advancedPresets?: AdvancedPreset[];
  onSaveAdvancedPreset?: (preset: AdvancedPreset) => void;
  onDeleteAdvancedPreset?: (id: string) => void;
  onApplyAdvancedPreset?: (preset: AdvancedPreset) => void;
  onFormatText?: (rules: TransformationRule[]) => void;
}

export const MobileDraftsStrip: React.FC<EditorControlsProps> = ({
  presets = [],
  onLoadPreset,
  onSavePreset,
  onDeletePreset,
  state,
  onEditContent,
  activePresetId,
  onCreateNew
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [saveName, setSaveName] = useState('');

  const handleSave = () => {
    if (saveName.trim() && onSavePreset) {
      onSavePreset(saveName.trim());
      setIsSaving(false);
      setSaveName('');
    }
  };

  const getPresetColor = (index: number) => {
    const colors = ['bg-rose-300', 'bg-blue-300', 'bg-amber-300', 'bg-emerald-300', 'bg-purple-300'];
    return colors[index % colors.length];
  };

  const formatDraftTitle = (title: string) => {
    if (title.length > 6) {
      return title.substring(0, 4) + '……';
    }
    return title;
  };

  return (
    <div className="w-full h-44 bg-white/90 backdrop-blur-md border-t border-gray-200/80 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] flex flex-col pointer-events-auto transition-all">
       <div className="px-4 py-2 flex justify-between items-center border-b border-gray-100 shrink-0 h-10">
          <span className="text-xs font-bold text-gray-500">我的草稿 ({presets.length})</span>
          {isSaving && (
            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-5 absolute right-4 bg-white z-10">
              <input 
                autoFocus
                className="bg-gray-100 rounded px-2 py-1 text-xs w-32 outline-none border border-transparent focus:border-purple-500 transition-all"
                placeholder="输入草稿名称..."
                value={saveName}
                onChange={e => setSaveName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              />
              <button onClick={handleSave} className="text-green-600 bg-green-50 p-1 rounded hover:bg-green-100"><CheckIcon className="w-4 h-4"/></button>
              <button onClick={() => setIsSaving(false)} className="text-gray-400 bg-gray-50 p-1 rounded hover:bg-gray-100"><XMarkIcon className="w-4 h-4"/></button>
            </div>
          )}
          {!isSaving && <button onClick={() => setIsSaving(true)} className="text-[10px] text-purple-600 font-bold border border-purple-100 px-2 py-1 rounded-md bg-purple-50 active:scale-95 transition-all">存为草稿</button>}
       </div>
       
       <div className="flex-1 overflow-x-auto overflow-y-hidden flex items-center gap-3 px-4 py-2 custom-scrollbar">
          <div 
            onClick={onCreateNew}
            className="shrink-0 w-28 h-28 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-2 text-gray-400 cursor-pointer hover:border-purple-500 hover:text-purple-500 hover:bg-purple-50 transition-all active:scale-95 bg-gray-50/50"
          >
             <PlusIcon className="w-6 h-6" />
             <span className="text-[10px] font-bold">新建草稿</span>
          </div>

          {presets.length === 0 && (
            <div className="flex flex-col items-center justify-center text-center text-gray-400 gap-3 w-full">
              <BookmarkIcon className="w-8 h-8 opacity-50" />
              <p className="text-sm font-bold text-gray-500">暂无草稿</p>
              <p className="text-xs text-gray-400">图片内已自动填充占位文本</p>
            </div>
          )}
          {presets.map((preset, idx) => (
              <div 
                key={preset.id}
                onClick={() => {
                  const isActive = activePresetId === preset.id;
                  if (isActive) {
                    if (onEditContent) onEditContent();
                  } else {
                    if (onLoadPreset) onLoadPreset(preset);
                  }
                }}
                className={`relative shrink-0 w-28 h-28 bg-white border rounded-lg shadow-sm flex flex-col overflow-hidden transition-all duration-200 ${activePresetId === preset.id ? 'border-purple-500 ring-1 ring-purple-500 shadow-md' : 'border-gray-200 hover:border-gray-300'}`}
              >
                 <div className={`absolute top-0 left-0 h-full w-1 ${getPresetColor(idx)}`}></div>
                 <div className="p-2 pl-3 flex flex-col h-full overflow-hidden">
                    <div className="text-xs font-bold text-gray-800 leading-tight py-0.5 break-words font-serif-sc">{formatDraftTitle(preset.name)}</div>
                    
                    <div className="mt-0.5">
                       <span className="text-[8px] text-gray-500 bg-gray-50 px-1 py-0.5 rounded inline-block max-w-full truncate border border-gray-100 font-bold">
                         {preset.category || '未分类'}
                       </span>
                    </div>
                    
                    <div className="mt-auto flex justify-end items-center gap-1 w-full">
                        <button 
                            onClick={(e) => { 
                                e.stopPropagation(); 
                                if (onLoadPreset) onLoadPreset(preset);
                                if (onEditContent) onEditContent(); 
                            }}
                            className="text-purple-500 bg-purple-50 hover:bg-purple-100 p-1.5 rounded-md transition-colors"
                        >
                            <PencilSquareIcon className="w-3.5 h-3.5" />
                        </button>
                        
                        <button 
                            onClick={(e) => { e.stopPropagation(); if (onDeletePreset) onDeletePreset(preset.id); }}
                            className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-md transition-colors"
                        >
                            <TrashIcon className="w-3.5 h-3.5" />
                        </button>
                    </div>
                 </div>
              </div>
          ))}
       </div>
    </div>
  );
};

export const MobileStylePanel: React.FC<EditorControlsProps> = ({ state, onChange }) => {
  return (
    <div className="w-full h-44 bg-white/90 backdrop-blur-md border-t border-gray-200/80 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] flex flex-col pointer-events-auto">
       <div className="px-4 py-2 flex items-center border-b border-gray-100 shrink-0 h-10">
          <span className="text-xs font-bold text-gray-500">风格与布局</span>
       </div>
       <div className="flex-1 overflow-y-auto px-4 py-3 custom-scrollbar">
          <div>
             <h4 className="text-[10px] font-bold text-gray-400 uppercase mb-2">布局模板</h4>
             <div className="grid grid-cols-1 gap-3">
              {[
                { id: 'storybook', label: '绘本蜡笔' },
              ].map((layout) => (
                <button
                  key={layout.id}
                  onClick={() => onChange({ layoutStyle: layout.id as LayoutStyle })}
                  className={`shrink-0 h-20 rounded-lg border flex flex-col items-center justify-center gap-2 transition-all active:scale-95 ${state.layoutStyle === layout.id ? 'border-purple-500 bg-purple-50 text-purple-600 shadow-sm' : 'border-gray-200 bg-white text-gray-500'}`}
                >
                  <div className={`w-8 h-8 rounded border-2 ${state.layoutStyle === layout.id ? 'border-purple-300 bg-purple-100' : 'border-gray-300 bg-gray-50'}`}></div>
                  <span className="text-xs font-bold">{layout.label}</span>
                </button>
              ))}
            </div>
          </div>
       </div>
    </div>
  );
};

export const MobileExportPanel: React.FC<EditorControlsProps> = ({ state, onExport, isExporting }) => {
  const [characterName, setCharacterName] = useState('');
  
  const prefix = state.mode === 'cover' ? '封面' : '长文';
  const title = (state.title || '无标题').replace(/[\\/:*?"<>|]/g, '');
  const safeCharName = characterName.trim().replace(/[\\/:*?"<>|]/g, '');
  const filename = `${prefix}-${title}${safeCharName ? `-${safeCharName}` : ''}`;
  
  return (
    <div className="w-full h-44 bg-white/90 backdrop-blur-md border-t border-gray-200/80 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] flex flex-col pointer-events-auto">
       <div className="px-4 py-2 flex items-center border-b border-gray-100 shrink-0 h-10">
          <span className="text-xs font-bold text-gray-500">导出设置</span>
       </div>
       <div className="p-4 flex flex-col gap-3">
         <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-gray-500 shrink-0 w-12">角色名</label>
                <input 
                  value={characterName}
                  onChange={(e) => setCharacterName(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:border-purple-300 transition-all"
                  placeholder="填写角色名"
                />
            </div>
            <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-gray-500 shrink-0 w-12">文件名</label>
                <div className="flex-1 px-3 py-1.5 bg-gray-100 border border-transparent rounded-lg text-xs text-gray-500 font-mono truncate">
                    {filename}.png
                </div>
            </div>
         </div>
         <button 
           onClick={() => onExport && onExport(`${filename}.png`)}
           disabled={isExporting}
           className="w-full py-2 bg-gray-900 text-white rounded-lg font-bold text-xs shadow-md active:scale-95 transition-all disabled:opacity-70 flex justify-center items-center gap-2"
         >
           {isExporting ? (
             <>
               <ArrowPathIcon className="w-3 h-3 animate-spin" />
               生成中...
             </>
           ) : (
             <>
               <ArrowDownTrayIcon className="w-3 h-3" />
               确认导出
             </>
           )}
         </button>
       </div>
    </div>
  );
};

export const ContentEditorModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  state: CoverState;
  onChange: (newState: Partial<CoverState>) => void;
  onConfirm?: () => void;
}> = ({ isOpen, onClose, state, onChange, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-in fade-in">
       <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
          <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
             <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <PencilSquareIcon className="w-5 h-5 text-purple-600" />
                编辑卡片内容
             </h3>
             <button onClick={onClose} className="p-1.5 bg-gray-200 rounded-full text-gray-500 hover:bg-gray-300">
               <XMarkIcon className="w-4 h-4" />
             </button>
          </div>
          
          <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1.5 block uppercase">主标题</label>
              <textarea 
                value={state.title}
                onChange={(e) => onChange({ title: e.target.value })}
                className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-100 focus:border-purple-300 outline-none resize-none font-sans-sc text-sm font-bold text-gray-900"
                rows={2}
                placeholder="输入标题..."
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 mb-1.5 block uppercase">副标题 / 文案</label>
              <textarea
                value={state.subtitle}
                onChange={(e) => onChange({ subtitle: e.target.value })}
                className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-100 focus:border-purple-300 outline-none font-sans-sc text-sm resize-none"
                rows={3}
                placeholder="输入副标题..."
              />
            </div>
            
            {state.layoutStyle === 'duality' && (
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1.5 block uppercase text-purple-600">正文（里象）</label>
                 <div className="text-[10px] text-gray-400 mb-1">仅在“假作真时”风格下显示</div>
                 <textarea
                  value={state.secondaryBodyText}
                  onChange={(e) => onChange({ secondaryBodyText: e.target.value })}
                  className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-100 focus:border-purple-300 outline-none font-sans-sc text-sm resize-none"
                  rows={3}
                  placeholder="第二段正文..."
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1.5 block uppercase">分类</label>
                <input 
                  type="text"
                  value={state.category}
                  onChange={(e) => onChange({ category: e.target.value })}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-100 focus:border-purple-300 outline-none text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1.5 block uppercase">作者</label>
                <input 
                  type="text"
                  value={state.author}
                  onChange={(e) => onChange({ author: e.target.value })}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-100 focus:border-purple-300 outline-none text-sm"
                />
              </div>
            </div>
          </div>
          
          <div className="p-4 border-t border-gray-100 bg-gray-50/30">
             <button 
                onClick={() => {
                   if (onConfirm) onConfirm();
                }} 
                className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold text-sm shadow-md active:scale-95 transition-transform"
             >
                完成
             </button>
          </div>
       </div>
    </div>
  );
};


const EditorControls: React.FC<EditorControlsProps> = ({ 
  state, 
  onChange, 
  presets = [],
  onSavePreset,
  onDeletePreset,
  onLoadPreset,
  activeTab,
  onTabChange,
  onExport,
  isExporting,
  advancedPresets = [],
  onSaveAdvancedPreset,
  onDeleteAdvancedPreset,
  onApplyAdvancedPreset,
  onFormatText
}) => {
  const [isSavingPreset, setIsSavingPreset] = useState(false);
  const [presetNameInput, setPresetNameInput] = useState('');
  const [characterName, setCharacterName] = useState('');
  const [showSaveAdvancedModal, setShowSaveAdvancedModal] = useState(false);
  
  const startSavePreset = () => {
    setPresetNameInput(state.title || '无标题草稿');
    setIsSavingPreset(true);
  };

  const confirmSavePreset = () => {
    if (onSavePreset && presetNameInput.trim()) {
      onSavePreset(presetNameInput.trim());
      setIsSavingPreset(false);
    }
  };

  const getPresetColor = (index: number) => {
    const colors = ['bg-rose-300', 'bg-blue-300', 'bg-amber-300', 'bg-emerald-300', 'bg-purple-300'];
    return colors[index % colors.length];
  };

  const formatDraftTitle = (title: string) => {
    if (title.length > 6) return title.substring(0, 4) + '……';
    return title;
  };

  const renderDraftsTab = () => (
    <div className="space-y-4 h-full flex flex-col">
       <div className="flex justify-between items-center px-1 shrink-0">
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <BookmarkIcon className="w-4 h-4 text-purple-500" />
                我的草稿
                <span className="text-xs font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{presets.length}</span>
            </h3>
            
            {!isSavingPreset ? (
               <button 
                 onClick={startSavePreset}
                 className="text-xs bg-gray-900 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-black transition-all shadow-sm active:scale-95"
               >
                 <PlusIcon className="w-3 h-3" />
                 存为草稿
               </button>
            ) : (
               <div className="flex items-center gap-1 animate-in fade-in slide-in-from-right-5">
                  <input 
                    autoFocus
                    value={presetNameInput}
                    onChange={(e) => setPresetNameInput(e.target.value)}
                    placeholder="名称..."
                    className="w-24 bg-gray-100 border-none rounded-md px-2 py-1 text-xs focus:ring-2 focus:ring-purple-200 outline-none"
                    onKeyDown={(e) => e.key === 'Enter' && confirmSavePreset()}
                  />
                  <button onClick={confirmSavePreset} className="p-1.5 bg-green-500 text-white rounded-md hover:bg-green-600"><CheckIcon className="w-3 h-3" /></button>
                  <button onClick={() => setIsSavingPreset(false)} className="p-1.5 bg-gray-200 text-gray-500 rounded-md hover:bg-gray-300"><XMarkIcon className="w-3 h-3" /></button>
               </div>
            )}
        </div>

        <div className="grid grid-cols-2 gap-3 overflow-y-auto pb-4 custom-scrollbar">
          {presets.length === 0 && (
            <div className="col-span-2">
              <div className="w-full border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50 p-6 flex flex-col items-center text-center gap-3 text-gray-400">
                <BookmarkIcon className="w-8 h-8 text-gray-300" />
                <p className="text-sm font-bold text-gray-500">暂无草稿</p>
                <p className="text-xs text-gray-400">图片内已自动填充占位文本</p>
              </div>
            </div>
          )}
          {presets.map((preset, idx) => (
              <div 
                key={preset.id}
                onClick={() => onLoadPreset && onLoadPreset(preset)}
                className="group relative bg-white border border-gray-200 rounded-xl p-3 shadow-sm hover:border-purple-300 hover:shadow-md transition-all cursor-pointer overflow-hidden flex flex-col h-32 active:scale-95 duration-200"
              >
                <div className={`absolute top-0 left-0 w-1 h-full ${getPresetColor(idx)}`}></div>
                <div className="pl-2 flex-1 min-w-0 flex flex-col overflow-hidden">
                    <div className="font-bold text-sm text-gray-800 break-words mb-0.5 py-0.5 font-serif-sc">{formatDraftTitle(preset.name)}</div>
                    <div className="text-[10px] text-gray-500 line-clamp-3 font-serif-sc leading-relaxed opacity-80 flex-1 bg-gray-50 p-1 rounded mb-1">
                        {preset.subtitle || preset.title}
                    </div>
                </div>
                <div className="pl-2 flex justify-between items-end pt-1 shrink-0">
                    <span className="text-[9px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded truncate max-w-[70%] font-bold">
                        {preset.category || '未分类'}
                    </span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onDeletePreset && onDeletePreset(preset.id); }}
                      className="text-gray-300 hover:text-red-500 transition-colors p-1.5 -mr-1 -mb-1"
                    >
                        <TrashIcon className="w-3.5 h-3.5" />
                    </button>
                </div>
              </div>
              ))}
        </div>
    </div>
  );

  const renderPresetsTab = () => (
    <div className="space-y-4 h-full flex flex-col">
        <div className="flex justify-between items-center px-1 shrink-0">
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <SparklesIcon className="w-4 h-4 text-indigo-500" />
                高级预设库
                <span className="text-xs font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{advancedPresets.length}</span>
            </h3>
            
            <button 
                onClick={() => setShowSaveAdvancedModal(true)}
                className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-indigo-700 transition-all shadow-sm active:scale-95"
            >
                <PlusIcon className="w-3 h-3" />
                新建预设
            </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pb-4 custom-scrollbar">
            {advancedPresets.length === 0 && (
                <div className="py-12 flex flex-col items-center text-center px-4 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100">
                    <SparklesIcon className="w-8 h-8 text-gray-200 mb-2" />
                    <p className="text-xs text-gray-400">尚未创建高级预设</p>
                    <p className="text-[10px] text-gray-300 mt-1">预设可以保存特定的风格组合与排版规则</p>
                </div>
            )}
            {advancedPresets.map((preset) => (
                <div 
                    key={preset.id}
                    onClick={() => onApplyAdvancedPreset?.(preset)}
                    className="group relative bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer flex flex-col gap-2 active:scale-95"
                >
                    <div className="flex justify-between items-start">
                        <div className="font-bold text-sm text-gray-800 truncate">{preset.name}</div>
                        <div className="flex items-center gap-1">
                            <button 
                                onClick={(e) => { e.stopPropagation(); setShowSaveAdvancedModal(true); }}
                                className="text-gray-300 hover:text-indigo-500 transition-colors"
                            >
                                <PencilSquareIcon className="w-3.5 h-3.5" />
                            </button>
                            <button 
                                onClick={(e) => { e.stopPropagation(); onDeleteAdvancedPreset?.(preset.id); }}
                                className="text-gray-300 hover:text-red-500 transition-colors"
                            >
                                <TrashIcon className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                    
                    <div className="flex gap-1.5 flex-wrap">
                        {preset.includeStyle && <span className="text-[9px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded border border-blue-100 font-bold">风格</span>}
                        {preset.includeContent && <span className="text-[9px] px-1.5 py-0.5 bg-green-50 text-green-600 rounded border border-green-100 font-bold">内容</span>}
                        {preset.rules.length > 0 && <span className="text-[9px] px-1.5 py-0.5 bg-purple-50 text-purple-600 rounded border border-purple-100 font-bold">{preset.rules.length} 条转化规则</span>}
                    </div>

                    {preset.rules.length > 0 && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); onFormatText?.(preset.rules); }}
                            className="mt-1 w-full py-1.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-lg border border-indigo-100 hover:bg-indigo-100 transition-all flex items-center justify-center gap-1"
                        >
                            <SparklesIcon className="w-3 h-3" />
                            应用转化规则
                        </button>
                    )}
                </div>
            ))}
        </div>
        
        {showSaveAdvancedModal && onSaveAdvancedPreset && (
            <SavePresetModal 
                isOpen={showSaveAdvancedModal}
                onClose={() => setShowSaveAdvancedModal(false)}
                onConfirm={onSaveAdvancedPreset}
                currentState={state}
            />
        )}
    </div>
  );

  const renderContentTab = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2 opacity-60 px-1">
             <PencilSquareIcon className="w-4 h-4" />
             <span className="text-sm font-bold uppercase tracking-wider">文本内容</span>
        </div>
        
        <div className="p-3 bg-blue-50 text-blue-700 text-xs rounded-lg border border-blue-100 leading-relaxed">
           提示：点击正文区域即可进行富文本编辑。使用“搜索修饰”可以快速对齐或染色特定段落。在“预设”中可以保存属于你的排版模板。
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500 mb-1.5 block">主标题</label>
          <textarea 
            value={state.title}
            onChange={(e) => onChange({ title: e.target.value })}
            className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-100 focus:border-purple-300 outline-none resize-none font-sans-sc transition-all text-sm font-bold text-gray-800"
            rows={3}
            placeholder="输入引人注目的标题"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500 mb-1.5 block">副标题 / 文案</label>
          <textarea
            value={state.subtitle}
            onChange={(e) => onChange({ subtitle: e.target.value })}
            className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-100 focus:border-purple-300 outline-none font-sans-sc transition-all text-sm resize-none"
            rows={3}
            placeholder="一句话描述核心亮点"
          />
        </div>
        
        {state.layoutStyle === 'duality' && (
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">正文（里象）</label>
            <textarea
              value={state.secondaryBodyText}
              onChange={(e) => onChange({ secondaryBodyText: e.target.value })}
              className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-100 focus:border-purple-300 outline-none font-sans-sc transition-all text-sm resize-none"
              rows={3}
              placeholder="仅在“假作真时”风格下显示"
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">分类标签</label>
            <input 
              type="text"
              value={state.category}
              onChange={(e) => onChange({ category: e.target.value })}
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-100 focus:border-purple-300 outline-none font-sans-sc text-sm transition-all"
              placeholder="例如：文稿"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">作者署名</label>
            <input 
              type="text"
              value={state.author}
              onChange={(e) => onChange({ author: e.target.value })}
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-100 focus:border-purple-300 outline-none font-sans-sc text-sm transition-all"
              placeholder="例如：琉璃"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderStyleTab = () => {
    const prefix = state.mode === 'cover' ? '封面' : '长文';
    const title = (state.title || '无标题').replace(/[\\/:*?"<>|]/g, '');
    const safeCharName = characterName.trim().replace(/[\\/:*?"<>|]/g, '');
    const filename = `${prefix}-${title}${safeCharName ? `-${safeCharName}` : ''}`;

    return (
      <div className="space-y-6">
        <div className="space-y-4">
          <label className="text-sm font-bold text-gray-800">风格与布局</label>
          
          <div className="grid grid-cols-1 gap-2">
            {[
              { id: 'storybook', label: '绘本蜡笔' },
            ].map((layout) => (
              <button
                key={layout.id}
                onClick={() => onChange({ layoutStyle: layout.id as LayoutStyle })}
                className={`py-2 px-1 rounded-lg border text-[10px] md:text-xs font-medium transition-all ${state.layoutStyle === layout.id ? 'border-gray-800 bg-gray-800 text-white shadow-md transform scale-[1.02]' : 'border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700'}`}
              >
                {layout.label}
              </button>
            ))}
          </div>
        </div>
        
        <div className="pt-4 border-t border-gray-100 space-y-3">
             <div className="space-y-2">
                 <label className="text-xs font-bold text-gray-500 block">导出设置 (角色名)</label>
                 <input 
                    value={characterName}
                    onChange={(e) => setCharacterName(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-100 focus:border-purple-300 outline-none text-sm transition-all"
                    placeholder="可选..."
                 />
             </div>
             
             <button 
               onClick={() => onExport && onExport(`${filename}.png`)}
               disabled={isExporting}
               className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold text-sm shadow-md active:scale-95 transition-all disabled:opacity-70 flex justify-center items-center gap-2 hover:bg-black"
             >
               {isExporting ? (
                 <>
                   <ArrowPathIcon className="w-4 h-4 animate-spin" />
                   正在生成高清图片...
                 </>
               ) : (
                 <>
                   <ArrowDownTrayIcon className="w-4 h-4" />
                   导出当前卡片
                 </>
               )}
             </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
         <span className="font-bold text-lg text-gray-900 tracking-tight">衔书又止</span>
         <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
             <button onClick={() => onTabChange && onTabChange('style')} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === 'style' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>风格</button>
             <button onClick={() => onTabChange && onTabChange('content')} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === 'content' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>内容</button>
             <button onClick={() => onTabChange && onTabChange('drafts')} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === 'drafts' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>草稿</button>
             <button onClick={() => onTabChange && onTabChange('presets')} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === 'presets' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>预设</button>
         </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
         {activeTab === 'style' && renderStyleTab()}
         {activeTab === 'content' && renderContentTab()}
         {activeTab === 'drafts' && renderDraftsTab()}
         {activeTab === 'presets' && renderPresetsTab()}
      </div>
      
      {showSaveAdvancedModal && onSaveAdvancedPreset && (
            <SavePresetModal 
                isOpen={showSaveAdvancedModal}
                onClose={() => setShowSaveAdvancedModal(false)}
                onConfirm={onSaveAdvancedPreset}
                currentState={state}
            />
        )}
    </div>
  );
};

export default EditorControls;