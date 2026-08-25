import React, { useState } from 'react';
import { 
  X, 
  Download, 
  FileSpreadsheet, 
  FileJson, 
  Check, 
  Copy 
} from 'lucide-react';
import { TopicItem } from '../types';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  topics: TopicItem[];
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  topics,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const exportCSV = () => {
    const headers = ['ID', 'Topic', 'Status', 'Filename', 'Image URL', 'Error', 'Attempts', 'Created At'];
    const rows = topics.map((t) => [
      t.id,
      `"${t.topic.replace(/"/g, '""')}"`,
      t.status,
      t.filename || '',
      t.imageUrl || '',
      `"${(t.error || '').replace(/"/g, '""')}"`,
      t.attempts,
      new Date(t.createdAt).toISOString(),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `gemini-topics-export-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportJSON = () => {
    const jsonStr = JSON.stringify(topics, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `gemini-topics-export-${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(topics, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Export Topics Queue
              </h3>
              <p className="text-xs text-slate-400">
                Download table data as CSV spreadsheet or JSON
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-3">
          <button
            onClick={exportCSV}
            className="w-full p-3.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/50 transition flex items-center justify-between text-left group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:bg-emerald-500/20 transition">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-semibold text-white">Export to CSV (Excel)</div>
                <div className="text-[11px] text-slate-400">Standard spreadsheet format for Excel, Google Sheets</div>
              </div>
            </div>
            <Download className="w-4 h-4 text-slate-400 group-hover:text-white transition" />
          </button>

          <button
            onClick={exportJSON}
            className="w-full p-3.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-blue-500/50 transition flex items-center justify-between text-left group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 group-hover:bg-blue-500/20 transition">
                <FileJson className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-semibold text-white">Export to JSON file</div>
                <div className="text-[11px] text-slate-400">Full structured dataset with all metadata</div>
              </div>
            </div>
            <Download className="w-4 h-4 text-slate-400 group-hover:text-white transition" />
          </button>

          <button
            onClick={copyJSON}
            className="w-full p-3 rounded-xl bg-slate-950/60 hover:bg-slate-800 border border-slate-800 transition flex items-center justify-center gap-2 text-xs font-medium text-slate-300 hover:text-white cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied JSON to Clipboard</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy JSON to Clipboard</span>
              </>
            )}
          </button>
        </div>

        <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
