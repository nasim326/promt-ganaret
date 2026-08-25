import React from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  RotateCcw, 
  Plus, 
  Trash2, 
  Search, 
  SlidersHorizontal,
  X,
  FileSpreadsheet
} from 'lucide-react';
import { AutomationStatus } from '../types';

interface ControlsBarProps {
  automationStatus: AutomationStatus;
  onStart: () => void;
  onPause: () => void;
  onStop: () => void;
  onRetryFailed: () => void;
  onOpenAddModal: () => void;
  onDeleteSelected: () => void;
  onClearTopics: (type: 'all' | 'done' | 'error') => void;
  selectedCount: number;
  totalTopics: number;
  pendingCount: number;
  errorCount: number;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  batchLimit: number;
  onBatchLimitChange: (limit: number) => void;
}

export const ControlsBar: React.FC<ControlsBarProps> = ({
  automationStatus,
  onStart,
  onPause,
  onStop,
  onRetryFailed,
  onOpenAddModal,
  onDeleteSelected,
  onClearTopics,
  selectedCount,
  totalTopics,
  pendingCount,
  errorCount,
  searchQuery,
  onSearchChange,
  batchLimit,
  onBatchLimitChange,
}) => {
  const isRunning = automationStatus === 'running';
  const isPaused = automationStatus === 'paused';

  return (
    <div className="bg-slate-900/90 backdrop-blur border border-slate-800 rounded-2xl p-3.5 shadow-sm space-y-3">
      {/* Primary Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2">
          {/* Start Automation */}
          {!isRunning ? (
            <button
              onClick={onStart}
              disabled={pendingCount === 0}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm transition cursor-pointer ${
                pendingCount === 0
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white hover:shadow-emerald-600/20 hover:shadow-md'
              }`}
              title={pendingCount === 0 ? 'No pending topics to process' : 'Start processing queue'}
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{isPaused ? 'Resume Automation' : 'Start Automation'}</span>
              <span className="px-1.5 py-0.2 rounded bg-emerald-700/60 text-[10px] font-mono">
                {pendingCount}
              </span>
            </button>
          ) : (
            <button
              onClick={onPause}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition cursor-pointer"
              title="Pause automation after current topic"
            >
              <Pause className="w-4 h-4 fill-current" />
              <span>Pause</span>
            </button>
          )}

          {/* Stop Button */}
          <button
            onClick={onStop}
            disabled={automationStatus === 'idle' && !isPaused}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              automationStatus === 'idle' && !isPaused
                ? 'bg-slate-800/60 text-slate-500 cursor-not-allowed border border-slate-800'
                : 'bg-rose-600/90 hover:bg-rose-600 text-white'
            }`}
            title="Stop automation immediately"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span>Stop</span>
          </button>

          {/* Retry Failed */}
          <button
            onClick={onRetryFailed}
            disabled={errorCount === 0 || isRunning}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition cursor-pointer ${
              errorCount === 0 || isRunning
                ? 'bg-slate-800/40 border-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 text-amber-300'
            }`}
            title="Reset failed topics back to Pending"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retry Failed</span>
            {errorCount > 0 && (
              <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-[10px] font-mono text-amber-300">
                {errorCount}
              </span>
            )}
          </button>

          {/* Add Topic button */}
          <button
            onClick={onOpenAddModal}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <Plus className="w-4 h-4 text-emerald-400 stroke-[2.5]" />
            <span>Add Topic</span>
          </button>

          {/* Delete action */}
          {selectedCount > 0 ? (
            <button
              onClick={onDeleteSelected}
              className="px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Delete Selected ({selectedCount})</span>
            </button>
          ) : (
            <div className="relative group">
              <button
                disabled={totalTopics === 0 || isRunning}
                className="px-3 py-2 rounded-xl bg-slate-800/70 hover:bg-slate-700 border border-slate-700/70 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Delete...</span>
              </button>
              <div className="absolute left-0 mt-1 hidden group-hover:block w-44 bg-slate-900 border border-slate-700 rounded-xl shadow-xl z-20 p-1.5 text-xs text-slate-200">
                <button
                  onClick={() => onClearTopics('done')}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-emerald-300 transition"
                >
                  Clear Completed (Done)
                </button>
                <button
                  onClick={() => onClearTopics('error')}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-amber-300 transition"
                >
                  Clear Failed (Error)
                </button>
                <div className="my-1 border-t border-slate-800" />
                <button
                  onClick={() => onClearTopics('all')}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-rose-500/20 text-rose-400 transition"
                >
                  Clear All Topics
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Batch Limit & Search Filter */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Max images per run selector */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/70 text-xs text-slate-300">
            <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-400">Run Limit:</span>
            <select
              value={batchLimit}
              onChange={(e) => onBatchLimitChange(Number(e.target.value))}
              disabled={isRunning}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-0.5 text-xs text-emerald-300 font-mono font-semibold focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value={1}>1 image</option>
              <option value={3}>3 images</option>
              <option value={5}>5 images (Default)</option>
              <option value={10}>10 images</option>
              <option value={20}>20 images</option>
              <option value={50}>50 images</option>
              <option value={999}>Unlimited</option>
            </select>
          </div>

          {/* Search box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search topics..."
              className="pl-8.5 pr-7 py-1.5 w-40 sm:w-48 rounded-xl bg-slate-800/90 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
