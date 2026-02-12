

import React, { useState, useMemo, useEffect } from 'react';
import { AdvancedPreset, CoverState, TransformationRule, FormattingStyles } from '../types';
import { TEXT_PALETTE } from '../constants';
import { 
    PlusIcon, 
    TrashIcon, 
    XMarkIcon,
    SparklesIcon,
    EyeDropperIcon,
    BoldIcon,
    Bars3BottomLeftIcon,
    Bars3Icon,
    ArrowsRightLeftIcon,
    Bars3BottomRightIcon,
    PencilSquareIcon,
    MinusIcon,
    ItalicIcon
} from '@heroicons/react/24/solid';

interface PresetPanelProps {
    state: CoverState;
    presets: AdvancedPreset[];
    onSavePreset: (preset: AdvancedPreset) => void;
    onDeletePreset: (id: string) => void;
    onApplyPreset: (preset: AdvancedPreset) => void;
    onFormatText: (rules: TransformationRule[]) => void;
}

const RuleConfigItem: React.FC<{ 
    rule: TransformationRule; 
    onChange: (r: TransformationRule) => void; 
    onDelete: () => void 
}> = ({ rule, onChange, onDelete }) => {
    const updateFormatting = (patch: Partial<FormattingStyles>) => {
        onChange({ ...rule, formatting: { ...rule.formatting, ...patch } });
    };

    const handleQuickRegex = (type: 'before' | 'after' | 'between') => {
        const val = rule.pattern;
        let newPattern = val;
        if (type === 'before') {
            newPattern = `^.*(?=${val.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`;
        } else if (type === 'after') {
            newPattern = `(?<=${val.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}).*$`;
        } else if (type === 'between' && val.length >= 2) {
            const start = val[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const end = val[val.length - 1].replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            newPattern = `(?<=${start}).*?(?=${end})`;
        }
        onChange({ ...rule, pattern: newPattern });
    };

    const isParagraphScope = rule.scope === 'paragraph';
    const isStructureMode = rule.structure === 'multi-align-row';

    return (
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-xs flex flex-col gap-3 shadow-sm transition-all hover:shadow-md">
            {/* 第一行：名称输入 */}
            <div className="flex justify-between items-center gap-2">
                <div className="flex-1 border-b border-gray-200 pb-1 focus-within:border-purple-300 transition-colors">
                    <input 
                        className="font-bold bg-transparent border-none p-0 focus:ring-0 text-gray-700 w-full text-xs placeholder-gray-400"
                        value={rule.name}
                        onChange={(e) => onChange({...rule, name: e.target.value})}
                        placeholder="在此输入规则名称..."
                    />
                </div>
                <button onClick={onDelete} className="text-gray-400 hover:text-red-500">
                    <XMarkIcon className="w-4 h-4" />
                </button>
            </div>
            
            {/* 第二行：触发条件 (关键词 或 分割符) */}
            <div className="flex flex-col gap-1">
                {isStructureMode ? (
                     <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded px-2 py-2 animate-in slide-in-from-left-2">
                        <span className="text-[10px] font-bold text-indigo-600 shrink-0">触发符号</span>
                        <input 
                            className="flex-1 bg-white border border-indigo-200 rounded px-2 py-1 font-mono text-xs text-indigo-700 focus:outline-none focus:border-indigo-400 placeholder-indigo-300 text-center"
                            value={rule.separator || ''}
                            onChange={(e) => onChange({...rule, separator: e.target.value})}
                            placeholder="输入符号，如 |"
                        />
                        <div className="text-[9px] text-indigo-400 ml-2">此符号所在的段落将自动应用三段式结构</div>
                    </div>
                ) : (
                    <>
                    <div className="flex items-center gap-2 bg-white border border-gray-200 rounded px-2 py-1.5 focus-within:border-purple-300 focus-within:ring-1 focus-within:ring-purple-100 transition-all">
                        <span className="text-[10px] font-bold text-gray-400 shrink-0">关键词</span>
                        <input 
                            className="flex-1 bg-transparent border-none p-0 font-mono text-[10px] outline-none focus:ring-0 w-full min-w-0"
                            value={rule.pattern}
                            onChange={(e) => onChange({...rule, pattern: e.target.value})}
                            placeholder="输入字符后点下方转换..."
                        />
                    </div>
                    {/* 模式显示 */}
                    <div className="text-[9px] text-gray-400 px-1 flex items-center justify-between">
                        <span>当前模式: <span className="font-bold text-purple-600">{isParagraphScope ? '匹配整段' : '仅修饰关键词'}</span></span>
                        {!isParagraphScope && <span className="opacity-60">仅改变颜色/字号/粗体，对齐将影响整段</span>}
                    </div>
                    </>
                )}
            </div>

            {!isStructureMode && (
                <div className="flex gap-1 ml-10">
                    <button onClick={() => handleQuickRegex('before')} className="px-2 py-0.5 bg-white border border-gray-200 rounded text-[9px] text-gray-400 hover:text-purple-600 hover:border-purple-200 transition-all">之前</button>
                    <button onClick={() => handleQuickRegex('between')} className="px-2 py-0.5 bg-white border border-gray-200 rounded text-[9px] text-gray-400 hover:text-purple-600 hover:border-purple-200 transition-all">之间</button>
                    <button onClick={() => handleQuickRegex('after')} className="px-2 py-0.5 bg-white border border-gray-200 rounded text-[9px] text-gray-400 hover:text-purple-600 hover:border-purple-200 transition-all">之后</button>
                </div>
            )}

            <div className="flex flex-col gap-2 border-t border-gray-100 pt-2">
                <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-gray-400">样式与结构</span>
                    <button 
                        onClick={() => onChange({ ...rule, structure: isStructureMode ? undefined : 'multi-align-row' })}
                        className={`flex items-center gap-1 px-2 py-1 rounded text-[9px] font-bold transition-all border ${isStructureMode ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm transform scale-105' : 'bg-white border-gray-200 text-gray-500'}`}
                    >
                        <ArrowsRightLeftIcon className="w-3 h-3" />
                        三段式结构
                    </button>
                </div>
                
                {isStructureMode && (
                     <div className="flex flex-col gap-1 mt-1 px-2 py-1.5 bg-indigo-50/50 rounded border border-indigo-50 text-[9px] text-indigo-800">
                         <div className="flex justify-between opacity-70 mb-1"><span>布局预览</span><span>自动排版</span></div>
                         <div className="flex justify-between items-center font-mono text-[8px] bg-white border border-indigo-100 p-1 rounded">
                             <span className="text-left flex-1">Text</span>
                             <span className="text-center font-bold px-1 text-indigo-500">{rule.separator || '|'}</span>
                             <span className="text-right flex-1">Text</span>
                         </div>
                    </div>
                )}
                
                <div className="flex flex-wrap gap-2 items-center mt-1">
                    {!isParagraphScope ? (
                        <div className="flex gap-1 overflow-x-auto max-w-[100px] custom-scrollbar py-0.5">
                            {TEXT_PALETTE.map(c => (
                                <button 
                                    key={c.value} 
                                    onClick={() => updateFormatting({ color: c.value })}
                                    className={`w-4 h-4 rounded-full border shrink-0 transition-all ${rule.formatting.color === c.value ? 'ring-1 ring-purple-500 ring-offset-1 border-transparent' : 'border-gray-200'}`}
                                    style={{ backgroundColor: c.value }}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="px-2 py-1 bg-gray-100 text-gray-400 rounded text-[8px] font-bold">整段模式禁用颜色</div>
                    )}

                    <div className="h-4 w-px bg-gray-200"></div>

                    <div className="flex items-center gap-1 bg-white border border-gray-200 rounded px-1.5 py-0.5">
                        <span className="text-[9px] text-gray-400">字号</span>
                        <input 
                            type="range"
                            min="10"
                            max="40"
                            className="w-16 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                            value={rule.formatting.fontSize || 13}
                            onChange={(e) => updateFormatting({ fontSize: parseInt(e.target.value) })}
                        />
                        <span className="text-[9px] font-mono font-bold text-gray-500 w-3">{rule.formatting.fontSize || 13}</span>
                    </div>

                    <button 
                        onClick={() => updateFormatting({ isBold: !rule.formatting.isBold })}
                        className={`p-1 rounded ${rule.formatting.isBold ? 'bg-purple-100 text-purple-600 border border-purple-200' : 'bg-white border border-gray-200 text-gray-400'}`}
                        title="加粗"
                    >
                        <BoldIcon className="w-3 h-3" />
                    </button>

                    <button 
                        onClick={() => updateFormatting({ isItalic: !rule.formatting.isItalic })}
                        className={`p-1 rounded ${rule.formatting.isItalic ? 'bg-purple-100 text-purple-600 border border-purple-200' : 'bg-white border border-gray-200 text-gray-400'}`}
                        title="斜体"
                    >
                        <ItalicIcon className="w-3 h-3" />
                    </button>

                    {!isStructureMode && (
                        <button 
                            onClick={() => {
                                const newScope = rule.scope === 'match' ? 'paragraph' : 'match';
                                onChange({...rule, scope: newScope});
                            }}
                            className={`px-2 py-1 rounded text-[9px] font-bold border transition-all ${rule.scope === 'paragraph' ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-gray-200 text-gray-500'}`}
                            title="切换作用范围"
                        >
                            {rule.scope === 'paragraph' ? '整段' : '仅词'}
                        </button>
                    )}
                </div>
                
                {!isStructureMode && (
                    <div className="flex gap-1 justify-around bg-white border border-gray-100 rounded p-1">
                        <button onClick={() => updateFormatting({ textAlign: 'left' })} className={`flex-1 flex justify-center py-1 rounded ${rule.formatting.textAlign === 'left' ? 'bg-purple-50 text-purple-600' : 'text-gray-300'}`} title="整段左对齐"><Bars3BottomLeftIcon className="w-3.5 h-3.5" /></button>
                        <button onClick={() => updateFormatting({ textAlign: 'center' })} className={`flex-1 flex justify-center py-1 rounded ${rule.formatting.textAlign === 'center' ? 'bg-purple-50 text-purple-600' : 'text-gray-300'}`} title="整段居中"><Bars3Icon className="w-3.5 h-3.5" /></button>
                        <button onClick={() => updateFormatting({ textAlign: 'right' })} className={`flex-1 flex justify-center py-1 rounded ${rule.formatting.textAlign === 'right' ? 'bg-purple-50 text-purple-600' : 'text-gray-300'}`} title="整段右对齐"><Bars3BottomRightIcon className="w-3.5 h-3.5" /></button>
                    </div>
                )}
            </div>
        </div>
    );
}

export const SavePresetModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (preset: AdvancedPreset) => void;
    currentState: CoverState;
    initialData?: AdvancedPreset;
}> = ({ isOpen, onClose, onConfirm, currentState, initialData }) => {
    const [name, setName] = useState('');
    const [includeStyle, setIncludeStyle] = useState(true);
    const [includeContent, setIncludeContent] = useState(false);
    const [rules, setRules] = useState<TransformationRule[]>([]);
    const [isScanning, setIsScanning] = useState(false);

    useEffect(() => {
        if (initialData) {
            setName(initialData.name);
            setIncludeStyle(initialData.includeStyle);
            setIncludeContent(initialData.includeContent);
            setRules(initialData.rules);
        } else {
            setName('');
            setIncludeStyle(true);
            setIncludeContent(false);
            setRules([]);
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const scanTextForRules = () => {
        setIsScanning(true);
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = currentState.bodyText;
        
        const newRules: TransformationRule[] = [];
        const seenKeys = new Set<string>();

        const multiRows = tempDiv.querySelectorAll('.multi-align-row');
        multiRows.forEach((row, idx) => {
            const htmlRow = row as HTMLElement;
            const textParts = Array.from(htmlRow.querySelectorAll('div')).map(d => (d as HTMLElement).innerText.trim());
            // Attempt to deduce separator
            // Since we can't easily know the original separator from the DOM structure, we default to '|' or just create a rule
            const combinedText = textParts.filter(Boolean).join(' | ');
            if (combinedText) {
                const firstCol = htmlRow.querySelector('div') as HTMLElement;
                const formatting: FormattingStyles = {};
                if (firstCol.style.fontSize) formatting.fontSize = parseInt(firstCol.style.fontSize);
                if (firstCol.style.fontWeight === 'bold') formatting.isBold = true;
                if (firstCol.style.fontStyle === 'italic') formatting.isItalic = true;
                if (firstCol.style.color) formatting.color = firstCol.style.color;
                
                const key = `struct_${idx}`;
                if (!seenKeys.has(key)) {
                    seenKeys.add(key);
                    newRules.push({
                        id: `rule_struct_${Date.now()}_${idx}`,
                        name: `结构规则`,
                        pattern: '',
                        separator: '|', // Default guess
                        formatting,
                        scope: 'paragraph',
                        structure: 'multi-align-row',
                        isActive: true
                    });
                }
            }
        });

        const styledElements = tempDiv.querySelectorAll('[style]:not(.multi-align-row)');
        styledElements.forEach((el, idx) => {
            if (el.closest('.multi-align-row')) return;
            const htmlEl = el as HTMLElement;
            const text = el.textContent || '';
            if (!text.trim()) return;
            const formatting: FormattingStyles = {};
            if (htmlEl.style.color) formatting.color = htmlEl.style.color;
            if (htmlEl.style.fontSize) formatting.fontSize = parseInt(htmlEl.style.fontSize);
            if (htmlEl.style.fontWeight === 'bold') formatting.isBold = true;
            if (htmlEl.style.fontStyle === 'italic') formatting.isItalic = true;
            if (htmlEl.style.textAlign) formatting.textAlign = htmlEl.style.textAlign as any;

            const key = `style_${text.trim()}`;
            if (!seenKeys.has(key)) {
                seenKeys.add(key);
                newRules.push({
                    id: `rule_style_${Date.now()}_${idx}`,
                    name: `修饰: ${text.trim().slice(0, 5)}...`,
                    pattern: text.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
                    formatting,
                    scope: 'match',
                    isActive: true
                });
            }
        });
        setRules(prev => [...prev, ...newRules]);
        setIsScanning(false);
    };

    const handleConfirm = () => {
        if (!name.trim()) return;
        const preset: AdvancedPreset = {
            id: initialData?.id || Date.now().toString(),
            name: name.trim(),
            includeStyle,
            includeContent,
            coverState: includeStyle ? {
                backgroundColor: currentState.backgroundColor,
                accentColor: currentState.accentColor,
                textColor: currentState.textColor,
                layoutStyle: currentState.layoutStyle,
                titleFont: currentState.titleFont,
                bodyFont: currentState.bodyFont,
                bodyTextSize: currentState.bodyTextSize,
            } : (initialData?.coverState || {}),
            rules: rules.filter(r => r.isActive)
        };
        if (includeContent) {
            preset.coverState = { ...preset.coverState, title: currentState.title, subtitle: currentState.subtitle, bodyText: currentState.bodyText, secondaryBodyText: currentState.secondaryBodyText, category: currentState.category, author: currentState.author };
        }
        onConfirm(preset);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[70] flex justify-center items-end sm:items-center sm:p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white w-full h-[calc(100dvh-3.5rem)] sm:h-[85vh] sm:w-[500px] rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 sm:zoom-in-95 transition-all">
                <div className="flex flex-col h-full w-full">
                    <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
                        <h3 className="font-bold text-gray-800">{initialData ? '查看或修改预设' : '新建排版预设'}</h3>
                        <button onClick={onClose}><XMarkIcon className="w-5 h-5 text-gray-400" /></button>
                    </div>
                    <div className="p-5 overflow-y-auto custom-scrollbar space-y-5 flex-1 min-h-0">
                        <div>
                            <label className="text-xs font-bold text-gray-500 mb-1.5 block">预设名称</label>
                            <input value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-purple-300 transition-all" placeholder="预设名称..." />
                        </div>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                                <input type="checkbox" checked={includeStyle} onChange={e => setIncludeStyle(e.target.checked)} className="rounded text-purple-600" />
                                <span className="font-medium">包含基础风格</span>
                            </label>
                            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                                <input type="checkbox" checked={includeContent} onChange={e => setIncludeContent(e.target.checked)} className="rounded text-purple-600" />
                                <span className="font-medium">包含文字内容</span>
                            </label>
                        </div>
                        <div className="border-t border-gray-100 pt-4">
                            <div className="flex justify-between items-center mb-3">
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-purple-600 uppercase">自动排版规则</span>
                                    <span className="text-[10px] text-gray-400">满足条件时应用以下修饰</span>
                                </div>
                                <button onClick={scanTextForRules} className="flex items-center gap-1 text-[10px] bg-purple-50 text-purple-600 px-2 py-1 rounded-md border border-purple-100">
                                    <EyeDropperIcon className="w-3 h-3" /> {isScanning ? '扫描中...' : '提取当前样式'}
                                </button>
                            </div>
                            <div className="space-y-3 pb-2">
                                {rules.map((rule) => (
                                    <RuleConfigItem key={rule.id} rule={rule} onChange={(updated) => setRules(prev => prev.map(r => r.id === rule.id ? updated : r))} onDelete={() => setRules(prev => prev.filter(r => r.id !== rule.id))} />
                                ))}
                                <button onClick={() => setRules(prev => [...prev, { id: `rule_${Date.now()}`, name: '新规则', pattern: '', formatting: {}, scope: 'match', isActive: true }])} className="w-full py-2 border border-gray-200 rounded-lg text-xs text-gray-500 hover:bg-gray-50 flex items-center justify-center gap-1">
                                    <PlusIcon className="w-3 h-3" /> 自定义新规则
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="p-4 border-t border-gray-100 bg-gray-50/30 shrink-0">
                        <button onClick={handleConfirm} disabled={!name.trim()} className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold text-sm active:scale-95 disabled:opacity-50 transition-all">
                            {initialData ? '保存修改' : '确认创建'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const MobilePresetPanel: React.FC<PresetPanelProps> = ({ presets, onSavePreset, onDeletePreset, onApplyPreset, state, onFormatText }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPreset, setEditingPreset] = useState<AdvancedPreset | undefined>(undefined);
    const [activePresetId, setActivePresetId] = useState<string | null>(null);

    const activeRules = useMemo(() => {
        if (!activePresetId) return [];
        return presets.find(p => p.id === activePresetId)?.rules || [];
    }, [activePresetId, presets]);

    const handleApply = (preset: AdvancedPreset) => {
        setActivePresetId(preset.id);
        onApplyPreset(preset);
    };

    const handleEdit = (e: React.MouseEvent, preset: AdvancedPreset) => {
        e.stopPropagation();
        setEditingPreset(preset);
        setIsModalOpen(true);
    };

    const openCreateModal = () => {
        setEditingPreset(undefined);
        setIsModalOpen(true);
    };

    return (
        <div className="w-full h-44 bg-white/90 backdrop-blur-md border-t border-gray-200/80 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] flex flex-col pointer-events-auto">
            <div className="px-4 py-2 flex justify-between items-center border-b border-gray-100 shrink-0 h-10">
                <span className="text-xs font-bold text-gray-500">高级预设库 ({presets.length})</span>
                {activeRules.length > 0 && (
                     <button onClick={() => onFormatText(activeRules)} className="flex items-center gap-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-3 py-1 rounded-full text-[10px] font-bold shadow-sm active:scale-95 transition-all">
                        <SparklesIcon className="w-3 h-3" /> 一键排版
                    </button>
                )}
            </div>
            <div className="flex-1 overflow-x-auto overflow-y-hidden flex items-center gap-3 px-4 py-2 custom-scrollbar">
                <div onClick={openCreateModal} className="shrink-0 w-32 h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-2 text-gray-400 cursor-pointer hover:border-purple-500 hover:text-purple-500 hover:bg-purple-50 transition-all active:scale-95 bg-gray-50/50">
                    <PlusIcon className="w-6 h-6" /> <span className="text-[10px] font-bold">新建预设</span>
                </div>
                {presets.map((preset) => {
                    const isActive = activePresetId === preset.id;
                    return (
                        <div key={preset.id} className={`relative shrink-0 w-32 h-24 bg-white border rounded-lg shadow-sm flex flex-col overflow-hidden transition-all duration-200 ${isActive ? 'border-purple-500 ring-1 ring-purple-500 shadow-md' : 'border-gray-200'}`} onClick={() => handleApply(preset)}>
                            <div className="p-2.5 flex flex-col h-full">
                                <div className="text-xs font-bold truncate text-gray-800 mb-0.5">{preset.name}</div>
                                <div className="flex gap-1 flex-wrap mb-auto">
                                    {preset.includeStyle && <span className="text-[8px] bg-blue-50 text-blue-600 px-1 rounded border border-blue-100 font-bold tracking-tight">风格</span>}
                                    {preset.rules.length > 0 && <span className="text-[8px] bg-purple-50 text-purple-600 px-1 rounded border border-purple-100 font-bold tracking-tight">规则x{preset.rules.length}</span>}
                                </div>
                                <div className="mt-auto flex justify-between items-center pt-1 border-t border-gray-50">
                                     <button onClick={(e) => handleEdit(e, preset)} className="text-gray-300 hover:text-indigo-500 p-1"><PencilSquareIcon className="w-3.5 h-3.5" /></button>
                                     <button onClick={(e) => { e.stopPropagation(); onDeletePreset(preset.id); }} className="text-gray-300 hover:text-red-500 p-1"><TrashIcon className="w-3.5 h-3.5" /></button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            <SavePresetModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onConfirm={onSavePreset} 
                currentState={state} 
                initialData={editingPreset}
            />
        </div>
    );
};
