import React, { useState } from 'react';
import { 
  X, 
  Plus, 
  ListPlus, 
  Sparkles, 
  FileSpreadsheet,
  Layers
} from 'lucide-react';

interface AddTopicModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSingle: (topic: string) => Promise<void>;
  onAddMultiple: (topics: string[]) => Promise<void>;
}

export const AddTopicModal: React.FC<AddTopicModalProps> = ({
  isOpen,
  onClose,
  onAddSingle,
  onAddMultiple,
}) => {
  const [tab, setTab] = useState<'single' | 'bulk'>('single');
  const [singleInput, setSingleInput] = useState('');
  const [bulkInput, setBulkInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleInput.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onAddSingle(singleInput.trim());
      setSingleInput('');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const lines = bulkInput
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0 || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onAddMultiple(lines);
      setBulkInput('');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const sampleBulkTopics = [
    'Luxury modern penthouse bedroom with city sunset view',
    'Futuristic neo-Tokyo cyberpunk street under rain',
    'Ancient bamboo forest temple with glowing lanterns',
    'Minimalist Scandinavian kitchen with morning sunlight',
    'Epic fantasy dragon perched on mountain crystal peak',
  ].join('\n');

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Plus className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Add Image Topics
              </h3>
              <p className="text-xs text-slate-400">
                Enter single or bulk spreadsheet topics to queue
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

        {/* Tab switch */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 p-1.5 gap-1">
          <button
            type="button"
            onClick={() => setTab('single')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition flex items-center justify-center gap-2 cursor-pointer ${
              tab === 'single'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Single Topic</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('bulk')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition flex items-center justify-center gap-2 cursor-pointer ${
              tab === 'bulk'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ListPlus className="w-3.5 h-3.5 text-emerald-400" />
            <span>Bulk Import (Multi-Line)</span>
          </button>
        </div>

        {/* Modal Body */}
        {tab === 'single' ? (
          <form onSubmit={handleSingleSubmit} className="p-5 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Topic Description
              </label>
              <input
                type="text"
                value={singleInput}
                onChange={(e) => setSingleInput(e.target.value)}
                placeholder="e.g., Luxury modern bedroom"
                autoFocus
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition"
              />
              <p className="text-[11px] text-slate-500">
                This topic will be substituted into {'{{TOPIC}}'} in the Master Prompt.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/80">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!singleInput.trim() || isSubmitting}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold shadow-sm transition flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add to Queue</span>
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleBulkSubmit} className="p-5 space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300">
                  Paste Topics (One per line)
                </label>
                <button
                  type="button"
                  onClick={() => setBulkInput(sampleBulkTopics)}
                  className="text-[11px] text-emerald-400 hover:text-emerald-300 transition flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Insert sample 5 topics</span>
                </button>
              </div>
              <textarea
                value={bulkInput}
                onChange={(e) => setBulkInput(e.target.value)}
                rows={6}
                placeholder="Luxury modern bedroom&#10;Futuristic city at night&#10;Japanese zen garden..."
                autoFocus
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-3 text-xs text-white placeholder-slate-500 font-mono focus:outline-none transition leading-relaxed"
              />
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>
                  Topics parsed:{' '}
                  <strong className="text-emerald-400 font-mono">
                    {bulkInput.split('\n').filter((l) => l.trim().length > 0).length}
                  </strong>
                </span>
                <span>Duplicates and empty lines ignored</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/80">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!bulkInput.trim() || isSubmitting}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold shadow-sm transition flex items-center gap-1.5 cursor-pointer"
              >
                <ListPlus className="w-4 h-4" />
                <span>Add Bulk Topics</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
