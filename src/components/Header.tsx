import React from 'react';
import { 
  Bot, 
  Settings as SettingsIcon, 
  RefreshCw, 
  Plus, 
  Download, 
  Sparkles,
  ShieldCheck,
  FolderOpen
} from 'lucide-react';
import { AppConfig } from '../types';

interface HeaderProps {
  config: AppConfig;
  onOpenSettings: () => void;
  onOpenAddModal: () => void;
  onOpenExportModal: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  config,
  onOpenSettings,
  onOpenAddModal,
  onOpenExportModal,
  onRefresh,
  isRefreshing,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
        {/* Brand & App info */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-slate-950">
            <Bot className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                Gemini Image Bot
              </h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                Excel Queue
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Local-first batch image generation engine
            </p>
          </div>
        </div>

        {/* Status badges & Quick settings info */}
        <div className="hidden lg:flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 text-slate-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-400">Model:</span>
            <span className="font-mono font-medium text-slate-200">{config.geminiModel || 'gemini-3.1-flash-lite-image'}</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 text-slate-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-400">Max/Run:</span>
            <span className="font-mono font-medium text-emerald-300">{config.maxImagesPerRun || 5}</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 text-slate-300">
            <FolderOpen className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-slate-400 font-mono text-[11px] truncate max-w-[140px]" title={config.windowsImageDir}>
              {config.windowsImageDir || 'data/images'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition disabled:opacity-50"
            title="Refresh Table Data"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
          </button>

          <button
            onClick={onOpenExportModal}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-300 hover:text-white transition flex items-center gap-1.5"
            title="Export CSV / JSON"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>

          <button
            onClick={onOpenSettings}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition"
            title="Configuration Settings"
          >
            <SettingsIcon className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenAddModal}
            className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Topic</span>
          </button>
        </div>
      </div>
    </header>
  );
};
