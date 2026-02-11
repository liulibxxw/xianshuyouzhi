
import React, { useEffect, useState } from 'react';
import { ArrowDownTrayIcon, XMarkIcon, ArrowPathIcon, SparklesIcon } from '@heroicons/react/24/solid';

interface ExportModalProps {
  imageUrl: string | null;
  isExporting: boolean;
  onClose: () => void;
  onDownload: () => void;
}

const ExportModal: React.FC<ExportModalProps> = ({ imageUrl, isExporting, onClose, onDownload }) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  // 将 Base64 转换为 BlobURL 渲染，这在移动端 WebView 中显著提高长按稳定性
  useEffect(() => {
    if (imageUrl) {
        const parts = imageUrl.split(',');
        const mime = parts[0].match(/:(.*?);/)![1];
        const bstr = atob(parts[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) { u8arr[n] = bstr.charCodeAt(n); }
        const blob = new Blob([u8arr], { type: mime });
        const url = URL.createObjectURL(blob);
        setBlobUrl(url);
        return () => URL.revokeObjectURL(url);
    }
  }, [imageUrl]);

  return (
    <div 
      className="fixed inset-0 bg-gray-900/90 backdrop-blur-sm flex items-center justify-center z-[100] transition-opacity duration-300 animate-in fade-in"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div 
        className="bg-white rounded-t-3xl lg:rounded-2xl shadow-2xl w-full lg:max-w-screen-xl h-[92vh] flex flex-col p-4 transform transition-all duration-500 animate-in slide-in-from-bottom-20"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4 shrink-0 px-2">
          <div className="flex items-center gap-2">
            <SparklesIcon className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-bold text-gray-800">导出预览</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 rounded-full bg-gray-100 active:scale-90 transition-all"
            aria-label="关闭"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 min-h-0 bg-gray-50 rounded-xl overflow-auto p-2 border border-gray-100 flex flex-col items-center custom-scrollbar">
          {isExporting ? (
            <div className="flex h-full w-full flex-col items-center justify-center gap-4 text-gray-400">
              <div className="relative">
                  <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-2 h-2 bg-purple-600 rounded-full animate-pulse"></div>
                  </div>
              </div>
              <div className="text-center">
                <p className="font-bold text-gray-600">正在生成超清作品</p>
                <p className="text-[10px] mt-1 opacity-60 tracking-widest uppercase">High Fidelity Rendering...</p>
              </div>
            </div>
          ) : blobUrl ? (
            <div className="flex flex-col items-center gap-6 py-6 w-full animate-in fade-in zoom-in-95 duration-500">
              <div className="relative group">
                {/* 重要：显式开启 WebkitTouchCallout 确保长按保存 */}
                <img 
                  src={blobUrl} 
                  alt="点击下方按钮下载或长按图片直接保存" 
                  className="max-w-[85vw] lg:max-w-[400px] shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-sm transition-all select-all touch-auto"
                  style={{ 
                    WebkitTouchCallout: 'default',
                    userSelect: 'auto',
                  } as React.CSSProperties}
                />
                <div className="absolute -top-3 -right-3 bg-purple-600 text-white p-2 rounded-full shadow-lg border-2 border-white animate-bounce">
                    <ArrowDownTrayIcon className="w-4 h-4" />
                </div>
              </div>

              <div className="flex flex-col items-center gap-2 px-6 text-center">
                 <div className="px-4 py-2 bg-purple-50 text-purple-700 rounded-xl border border-purple-100 flex items-center gap-2 shadow-sm">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                    </span>
                    <span className="text-[11px] font-bold">APK 提示：若下载按钮无效，请长按图片保存</span>
                 </div>
                 <p className="text-[10px] text-gray-400 font-medium">生成的图片为 4X 超清画质，支持直接长按</p>
              </div>
            </div>
          ) : null}
        </div>

        <div className="mt-6 flex flex-col lg:flex-row gap-3 shrink-0 px-2 pb-2">
          <button
            onClick={onDownload}
            disabled={!imageUrl || isExporting}
            className="flex-1 py-4 bg-gray-900 text-white rounded-2xl font-black text-sm shadow-xl active:scale-95 transition-all disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-2"
          >
            <ArrowDownTrayIcon className="w-5 h-5" />
            保存作品到相册
          </button>
          <button
            onClick={onClose}
            className="py-4 lg:px-8 bg-gray-100 text-gray-500 rounded-2xl font-bold text-sm active:bg-gray-200 transition-colors"
          >
            返回编辑
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
