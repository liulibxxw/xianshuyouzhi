import React from 'react';
import { ArrowDownTrayIcon, XMarkIcon, ArrowPathIcon } from '@heroicons/react/24/solid';

interface ExportModalProps {
  imageUrl: string | null;
  isExporting: boolean;
  onClose: () => void;
  onDownload: () => void;
}

const ExportModal: React.FC<ExportModalProps> = ({ imageUrl, isExporting, onClose, onDownload }) => {
  return (
    <div 
      className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 transition-opacity duration-300 animate-in fade-in"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-[90vw] max-w-screen-xl h-[90vh] flex flex-col p-6 m-4 transform transition-all duration-300 animate-in slide-in-from-bottom-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4 shrink-0">
          <h3 className="text-lg font-bold text-gray-800">导出预览</h3>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 rounded-full hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            aria-label="关闭"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 min-h-0 bg-gray-100/80 rounded-lg overflow-auto p-4 border border-gray-200">
          {isExporting ? (
            <div className="flex h-full w-full flex-col items-center justify-center gap-4 text-gray-500">
              <ArrowPathIcon className="w-10 h-10 animate-spin text-purple-500" />
              <p className="font-medium">正在生成高清图片...</p>
              <p className="text-xs text-gray-400">长图模式可能需要更长时间</p>
            </div>
          ) : imageUrl ? (
            <img 
              src={imageUrl} 
              alt="导出预览" 
              className="mx-auto shadow-lg rounded-sm"
            />
          ) : null}
        </div>

        <div className="mt-6 flex justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-semibold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
          >
            关闭
          </button>
          <button
            onClick={onDownload}
            disabled={!imageUrl || isExporting}
            className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-br from-purple-600 to-blue-500 rounded-lg shadow-md hover:from-purple-700 hover:to-blue-600 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <ArrowDownTrayIcon className="w-5 h-5" />
            下载图片
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;