import React, { useState } from 'react';
import { 
  TopicItem, 
  TopicStatus 
} from '../types';
import { 
  CheckCircle2, 
  Clock, 
  Loader2, 
  AlertTriangle, 
  Play, 
  Trash2, 
  RotateCcw, 
  Eye, 
  Edit3, 
  Check, 
  X, 
  Copy, 
  Image as ImageIcon,
  ExternalLink,
  PlusCircle,
  Sparkles
} from 'lucide-react';

interface TopicsTableProps {
  topics: TopicItem[];
  selectedTopicId: number | null;
  onSelectTopic: (topic: TopicItem) => void;
  selectedIds: number[];
  onToggleSelectAll: () => void;
  onToggleSelectRow: (id: number) => void;
  onUpdateTopicText: (id: number, newTopic: string) => void;
  onDeleteTopic: (id: number) => void;
  onGenerateSingle: (topic: TopicItem) => void;
  onRetryTopic: (id: number) => void;
  onOpenLightbox: (imageUrl: string, topic: string) => void;
  isAutomationRunning: boolean;
  onLoadSampleData: () => void;
}

export const TopicsTable: React.FC<TopicsTableProps> = ({
  topics,
  selectedTopicId,
  onSelectTopic,
  selectedIds,
  onToggleSelectAll,
  onToggleSelectRow,
  onUpdateTopicText,
  onDeleteTopic,
  onGenerateSingle,
  onRetryTopic,
  onOpenLightbox,
  isAutomationRunning,
  onLoadSampleData,
}) => {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const [copiedFilename, setCopiedFilename] = useState<string | null>(null);

  const startEditing = (topic: TopicItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(topic.id);
    setEditText(topic.topic);
  };

  const saveEditing = (id: number) => {
    if (editText.trim()) {
      onUpdateTopicText(id, editText.trim());
    }
    setEditingId(null);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditText('');
  };

  const handleCopyFilename = (filename: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(filename);
    setCopiedFilename(filename);
    setTimeout(() => setCopiedFilename(null), 2000);
  };

  const allSelected = topics.length > 0 && selectedIds.length === topics.length;

  const renderStatusBadge = (status: TopicStatus) => {
    switch (status) {
      case 'Done':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 stroke-[2.5]" />
            <span>Done</span>
          </span>
        );
      case 'Processing':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-blue-500/15 text-blue-300 border border-blue-500/40 animate-pulse">
            <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />
            <span>Processing</span>
          </span>
        );
      case 'Error':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400 stroke-[2.2]" />
            <span>Error</span>
          </span>
        );
      case 'Pending':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-amber-500/10 text-amber-300/90 border border-amber-500/20">
            <Clock className="w-3.5 h-3.5 text-amber-400/80" />
            <span>Pending</span>
          </span>
        );
    }
  };

  if (topics.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center shadow-sm space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 text-slate-400 mx-auto flex items-center justify-center">
          <ImageIcon className="w-7 h-7" />
        </div>
        <div className="max-w-md mx-auto space-y-1">
          <h3 className="text-base font-bold text-white">No topics in the queue</h3>
          <p className="text-xs text-slate-400">
            Add image topics one by one, paste bulk lines, or load initial sample topics to start generating.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={onLoadSampleData}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Load Sample Topics</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col">
      {/* Excel Table Toolbar / Summary Header */}
      <div className="px-4 py-2.5 bg-slate-800/60 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-slate-200">Topics Table</span>
          <span className="text-slate-500">•</span>
          <span>{topics.length} rows</span>
          {selectedIds.length > 0 && (
            <span className="text-emerald-400 font-medium">
              ({selectedIds.length} selected)
            </span>
          )}
        </div>
        <div className="text-[11px] text-slate-500 font-mono hidden sm:inline">
          Click row to inspect • Double-click topic to edit inline
        </div>
      </div>

      {/* Spreadsheet Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/70 text-slate-400 font-mono text-[11px] uppercase tracking-wider select-none">
              {/* Checkbox Column */}
              <th className="w-10 px-3 py-3 text-center">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={onToggleSelectAll}
                  className="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900 cursor-pointer"
                />
              </th>
              {/* ID */}
              <th className="w-16 px-3 py-3 font-semibold text-slate-300">ID</th>
              {/* Topic */}
              <th className="px-4 py-3 font-semibold text-slate-300 min-w-[220px]">Topic</th>
              {/* Status */}
              <th className="w-28 px-3 py-3 font-semibold text-slate-300">Status</th>
              {/* Image */}
              <th className="w-20 px-3 py-3 text-center font-semibold text-slate-300">Image</th>
              {/* Filename */}
              <th className="px-3 py-3 font-semibold text-slate-300 min-w-[160px]">Filename</th>
              {/* Error */}
              <th className="px-3 py-3 font-semibold text-slate-300 min-w-[140px]">Error</th>
              {/* Attempts */}
              <th className="w-20 px-3 py-3 text-center font-semibold text-slate-300">Attempts</th>
              {/* Actions */}
              <th className="w-24 px-3 py-3 text-right font-semibold text-slate-300">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80 font-sans">
            {topics.map((t) => {
              const isSelected = selectedTopicId === t.id;
              const isChecked = selectedIds.includes(t.id);
              const isEditing = editingId === t.id;
              const isRowProcessing = t.status === 'Processing';

              return (
                <tr
                  key={t.id}
                  onClick={() => onSelectTopic(t)}
                  className={`group transition-colors cursor-pointer select-none ${
                    isRowProcessing
                      ? 'bg-blue-500/10 hover:bg-blue-500/15'
                      : isSelected
                      ? 'bg-slate-800/90 text-white'
                      : isChecked
                      ? 'bg-emerald-500/5 hover:bg-slate-800/60'
                      : 'hover:bg-slate-800/40 text-slate-300'
                  }`}
                >
                  {/* Select Checkbox */}
                  <td className="px-3 py-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => onToggleSelectRow(t.id)}
                      className="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900 cursor-pointer"
                    />
                  </td>

                  {/* ID */}
                  <td className="px-3 py-2.5 font-mono text-slate-400 font-medium">
                    #{t.id}
                  </td>

                  {/* Topic (Editable) */}
                  <td
                    className="px-4 py-2.5 font-medium text-slate-200"
                    onDoubleClick={(e) => startEditing(t, e)}
                  >
                    {isEditing ? (
                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEditing(t.id);
                            if (e.key === 'Escape') cancelEditing();
                          }}
                          autoFocus
                          className="w-full bg-slate-950 border border-emerald-500 rounded px-2 py-1 text-xs text-white focus:outline-none"
                        />
                        <button
                          onClick={() => saveEditing(t.id)}
                          className="p-1 text-emerald-400 hover:text-emerald-300"
                          title="Save topic"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="p-1 text-slate-400 hover:text-white"
                          title="Cancel"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between group/cell">
                        <span className="truncate max-w-[280px] sm:max-w-md">{t.topic}</span>
                        <button
                          onClick={(e) => startEditing(t, e)}
                          className="opacity-0 group-hover/cell:opacity-100 p-1 text-slate-500 hover:text-slate-300 transition"
                          title="Edit Topic"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    {renderStatusBadge(t.status)}
                  </td>

                  {/* Image Thumbnail */}
                  <td className="px-3 py-2.5 text-center">
                    {t.imageUrl ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenLightbox(t.imageUrl!, t.topic);
                        }}
                        className="relative group/thumb inline-block rounded-lg overflow-hidden border border-slate-700 hover:border-emerald-500 transition shadow-sm"
                        title="Click to view image"
                      >
                        <img
                          src={t.imageUrl}
                          alt={t.topic}
                          className="w-9 h-9 object-cover rounded"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition">
                          <Eye className="w-3.5 h-3.5 text-white" />
                        </div>
                      </button>
                    ) : (
                      <div className="w-9 h-9 mx-auto rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-center justify-center text-slate-600">
                        <ImageIcon className="w-4 h-4" />
                      </div>
                    )}
                  </td>

                  {/* Filename */}
                  <td className="px-3 py-2.5 font-mono text-[11px] text-slate-400">
                    {t.filename ? (
                      <div className="flex items-center gap-1.5 group/file">
                        <span className="truncate max-w-[140px]" title={t.filename}>
                          {t.filename}
                        </span>
                        <button
                          onClick={(e) => handleCopyFilename(t.filename!, e)}
                          className="opacity-0 group-hover/file:opacity-100 p-1 text-slate-400 hover:text-emerald-300 transition"
                          title="Copy filename"
                        >
                          {copiedFilename === t.filename ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </td>

                  {/* Error Message */}
                  <td className="px-3 py-2.5 text-rose-400/90 text-[11px]">
                    {t.error ? (
                      <span className="truncate max-w-[140px] block" title={t.error}>
                        {t.error}
                      </span>
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </td>

                  {/* Attempts */}
                  <td className="px-3 py-2.5 text-center font-mono text-[11px]">
                    <span className={t.attempts > 0 ? (t.status === 'Error' ? 'text-rose-400 font-semibold' : 'text-slate-300') : 'text-slate-600'}>
                      {t.attempts} / 3
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-3 py-2.5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      {/* Run single */}
                      {t.status !== 'Done' && (
                        <button
                          onClick={() => onGenerateSingle(t)}
                          disabled={isAutomationRunning || isRowProcessing}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-emerald-600/30 text-slate-300 hover:text-emerald-300 border border-slate-700/60 transition disabled:opacity-40"
                          title="Generate image for this topic now"
                        >
                          <Play className="w-3 h-3 fill-current" />
                        </button>
                      )}

                      {/* Retry if error */}
                      {t.status === 'Error' && (
                        <button
                          onClick={() => onRetryTopic(t.id)}
                          disabled={isAutomationRunning}
                          className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition disabled:opacity-40"
                          title="Reset topic status to Pending"
                        >
                          <RotateCcw className="w-3 h-3" />
                        </button>
                      )}

                      {/* Delete */}
                      <button
                        onClick={() => onDeleteTopic(t.id)}
                        disabled={isAutomationRunning && isRowProcessing}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700/60 transition disabled:opacity-40"
                        title="Delete topic"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
