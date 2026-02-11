
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  BoldIcon, 
  ItalicIcon, 
  Bars3BottomLeftIcon, 
  Bars3BottomRightIcon, 
  Bars3Icon, 
  PencilIcon, 
  AdjustmentsHorizontalIcon, 
  MinusIcon, 
  PlusIcon
} from '@heroicons/react/24/solid';
import { TEXT_PALETTE } from '../constants';
import { CoverState } from '../types';

interface RichTextToolbarProps {
  visible: boolean;
  state: CoverState;
  onChange: (newState: Partial<CoverState>) => void;
  keyboardOffset?: number;
}

const RichTextToolbar: React.FC<RichTextToolbarProps> = ({ visible, state, onChange, keyboardOffset = 0 }) => {
  const [showTextColorPalette, setShowTextColorPalette] = useState(false);
  const [showSizePalette, setShowSizePalette] = useState(false);
  const [palettePosition, setPalettePosition] = useState<{left: number, bottom: number} | null>(null);

  const [formatStates, setFormatStates] = useState({
    bold: false,
    italic: false,
    alignLeft: false,
    alignCenter: false,
    alignRight: false,
    alignJustify: false
  });
  
  const toolbarRef = useRef<HTMLDivElement>(null);
  const paletteRef = useRef<HTMLDivElement>(null);

  const currentSizeVal = useMemo(() => {
      const match = state.bodyTextSize?.match(/text-\[(\d+)px\]/);
      return match ? parseInt(match[1], 10) : 13;
  }, [state.bodyTextSize]);

  useEffect(() => {
    if (visible) {
        document.execCommand('styleWithCSS', false, 'true');
        document.execCommand('defaultParagraphSeparator', false, 'div');
    }

    const updateFormatStates = () => {
      if (!visible) return;
      
      const selection = window.getSelection();
      let computedTextAlign = '';
      if (selection && selection.rangeCount > 0) {
          // 获取选区锚点（起始点）所在的节点
          let node = selection.anchorNode;
          if (node && node.nodeType === 3) node = node.parentNode;
          
          // 向上查找最近的块级容器
          if (node) {
              const block = (node as HTMLElement).closest('div, p, h1, h2, h3, li, [contenteditable="true"]');
              if (block) {
                  computedTextAlign = window.getComputedStyle(block).textAlign;
              }
          }
      }

      // 综合原生命令状态和计算样式判断，确保检测准确
      setFormatStates({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        alignLeft: computedTextAlign === 'left' || computedTextAlign === 'start' || document.queryCommandState('justifyLeft'),
        alignCenter: computedTextAlign === 'center' || document.queryCommandState('justifyCenter'),
        alignRight: computedTextAlign === 'right' || computedTextAlign === 'end' || document.queryCommandState('justifyRight'),
        alignJustify: computedTextAlign === 'justify' || document.queryCommandState('justifyFull'),
      });
    };

    document.addEventListener('selectionchange', updateFormatStates);
    return () => document.removeEventListener('selectionchange', updateFormatStates);
  }, [visible]);

  useEffect(() => {
    if (!visible) {
      setShowTextColorPalette(false);
      setShowSizePalette(false);
    }
  }, [visible]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (toolbarRef.current && toolbarRef.current.contains(event.target as Node)) return;
      if (paletteRef.current && paletteRef.current.contains(event.target as Node)) return;
      setShowTextColorPalette(false);
      setShowSizePalette(false);
    };

    if (showTextColorPalette || showSizePalette) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showTextColorPalette, showSizePalette]);

  if (!visible) return null;

  const handleFormat = (command: string, value?: string) => {
    // 开启 CSS 模式，确保对齐通过 style="text-align:..." 实现，这样 getComputedStyle 才能检测到
    document.execCommand('styleWithCSS', false, 'true');
    
    // 使用原生的 execCommand。原生命令能完美处理多行选中：
    // 如果选中了多个段落，它会分别为每个段落应用对齐样式。
    document.execCommand(command, false, value);

    // 立即手动触发同步
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
        let node = selection.anchorNode;
        if (node && node.nodeType === 3) node = node.parentNode;
        const editor = (node as HTMLElement)?.closest?.('[contenteditable="true"]');
        if (editor) {
            editor.dispatchEvent(new Event('input', { bubbles: true }));
        }
    }

    // 更新按钮高亮状态
    setTimeout(() => {
        document.dispatchEvent(new Event('selectionchange'));
    }, 50);
  };

  const preventFocusLoss = (e: React.MouseEvent | React.TouchEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA' && !target.closest('.interactive-area')) {
       e.preventDefault();
    }
  };

  const calculatePalettePosition = (target: HTMLElement) => {
      const rect = target.getBoundingClientRect();
      const screenW = window.innerWidth;
      const PALETTE_WIDTH = 280; 
      const PADDING = 10;
      const bottom = window.innerHeight - rect.top + 10; 
      let left = rect.left + rect.width / 2;
      const minLeft = PALETTE_WIDTH / 2 + PADDING;
      const maxLeft = screenW - PALETTE_WIDTH / 2 - PADDING;
      if (left < minLeft) left = minLeft;
      if (left > maxLeft) left = maxLeft;
      setPalettePosition({ left, bottom });
  };

  const toggleTextColor = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      if (showTextColorPalette) setShowTextColorPalette(false);
      else {
          calculatePalettePosition(e.currentTarget);
          setShowTextColorPalette(true);
          setShowSizePalette(false);
      }
  };

  const toggleSize = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      if (showSizePalette) setShowSizePalette(false);
      else {
          calculatePalettePosition(e.currentTarget);
          setShowSizePalette(true);
          setShowTextColorPalette(false);
      }
  };

  const handleTextColorChange = (color: string) => {
      document.execCommand('styleWithCSS', false, 'true');
      document.execCommand('foreColor', false, color);
      setShowTextColorPalette(false);
  };

  const handleSizeChange = (newSize: number) => {
      onChange({ bodyTextSize: `text-[${newSize}px]` });
  };

  const containerClass = "flex items-center gap-0.5 bg-white rounded-xl p-0.5 border border-gray-200 shadow-sm shrink-0";
  const buttonClass = "p-1.5 hover:bg-gray-50 rounded-lg text-gray-600 transition-all active:scale-95";
  const activeButtonClass = "p-1.5 bg-purple-50 text-purple-600 rounded-lg transition-all active:scale-95 border border-purple-100";

  return (
    <>
        <div 
            ref={toolbarRef}
            className="w-full bg-white/95 backdrop-blur-md px-4 py-3 flex flex-col gap-3 animate-in slide-in-from-bottom-2 duration-200 lg:hidden border-t border-gray-100/50"
            onMouseDown={preventFocusLoss}
            onTouchStart={preventFocusLoss}
        >
            <div className="flex items-center justify-around w-full">
                <div className={containerClass}>
                    <button onClick={() => handleFormat('bold')} className={formatStates.bold ? activeButtonClass : buttonClass} title="加粗"><BoldIcon className="w-5 h-5" /></button>
                    <button onClick={() => handleFormat('italic')} className={formatStates.italic ? activeButtonClass : buttonClass} title="斜体"><ItalicIcon className="w-5 h-5" /></button>
                </div>

                <div className={containerClass}>
                    <button onClick={() => handleFormat('justifyLeft')} className={formatStates.alignLeft ? activeButtonClass : buttonClass} title="左对齐"><Bars3BottomLeftIcon className="w-5 h-5" /></button>
                    <button onClick={() => handleFormat('justifyCenter')} className={formatStates.alignCenter ? activeButtonClass : buttonClass} title="居中">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M3 4h18v2H3V4zm4 5h10v2H7V9zm-4 5h18v2H3v-2zm4 5h10v2H7v-2z" /></svg>
                    </button>
                    <button onClick={() => handleFormat('justifyRight')} className={formatStates.alignRight ? activeButtonClass : buttonClass} title="右对齐"><Bars3BottomRightIcon className="w-5 h-5" /></button>
                    <button onClick={() => handleFormat('justifyFull')} className={formatStates.alignJustify ? activeButtonClass : buttonClass} title="两端对齐"><Bars3Icon className="w-5 h-5" /></button>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <button onClick={toggleSize} className={`p-2 rounded-xl border shadow-sm transition-all active:scale-95 ${showSizePalette ? 'bg-purple-50 text-purple-600 border-purple-200' : 'bg-white text-gray-600 border-gray-200'}`} title="字号大小"><AdjustmentsHorizontalIcon className="w-5 h-5" /></button>
                    <button onClick={toggleTextColor} className={`p-2 rounded-xl border shadow-sm transition-all active:scale-95 ${showTextColorPalette ? 'bg-purple-50 text-purple-600 border-purple-200' : 'bg-white text-gray-600 border-gray-200'}`} title="正文颜色"><PencilIcon className="w-5 h-5" /></button>
                </div>
            </div>
        </div>

        {(showTextColorPalette || showSizePalette) && palettePosition && (
            <div 
                ref={paletteRef}
                className="fixed z-[60] bg-white border border-gray-100 shadow-xl rounded-xl p-3 flex flex-wrap justify-center gap-2 animate-in slide-in-from-bottom-2 fade-in lg:hidden"
                style={{ left: palettePosition.left, bottom: palettePosition.bottom, transform: 'translateX(-50%)', width: 'max-content', maxWidth: '90vw' }}
                onMouseDown={preventFocusLoss} 
            >
                {showSizePalette && (
                    <div className="flex items-center gap-2 px-2 py-1">
                        <button onClick={() => handleSizeChange(Math.max(10, currentSizeVal - 1))} className="p-1.5 text-gray-500 hover:text-purple-600 hover:bg-gray-100 rounded-full transition-colors"><MinusIcon className="w-4 h-4" /></button>
                        <input type="range" min="10" max="40" step="1" value={currentSizeVal} onChange={(e) => handleSizeChange(parseInt(e.target.value))} className="w-32 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600" />
                        <button onClick={() => handleSizeChange(Math.min(40, currentSizeVal + 1))} className="p-1.5 text-gray-500 hover:text-purple-600 hover:bg-gray-100 rounded-full transition-colors"><PlusIcon className="w-4 h-4" /></button>
                        <span className="text-xs font-mono font-bold text-gray-600 w-8 text-center ml-1">{currentSizeVal}</span>
                    </div>
                )}
                {showTextColorPalette && TEXT_PALETTE.map((color) => (
                    <button key={color.value} onClick={() => handleTextColorChange(color.value)} className="w-8 h-8 rounded-full border shadow-sm hover:scale-110 transition-transform border-gray-200" style={{ backgroundColor: color.value }} title={color.label} />
                ))}
            </div>
        )}
    </>
  );
};

export default RichTextToolbar;
