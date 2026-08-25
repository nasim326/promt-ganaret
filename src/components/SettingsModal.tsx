import React, { useState } from 'react';
import { 
  X, 
  Settings as SettingsIcon, 
  Sparkles, 
  FolderOpen, 
  Sliders, 
  ShieldAlert, 
  Check, 
  Database,
  Layers
} from 'lucide-react';
import { AppConfig } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AppConfig;
  onSaveConfig: (updated: Partial<AppConfig>) => Promise<void>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
}) => {
  const [model, setModel] = useState(config.geminiModel || 'gemini-3.1-flash-lite-image');
  const [aspectRatio, setAspectRatio] = useState(config.aspectRatio || '1:1');
  const [maxAttempts, setMaxAttempts] = useState(config.maxAttempts || 3);
  const [maxImagesPerRun, setMaxImagesPerRun] = useState(config.maxImagesPerRun || 5);
  const [requestDelayMs, setRequestDelayMs] = useState(config.requestDelayMs || 1200);
  const [windowsImageDir, setWindowsImageDir] = useState(
    config.windowsImageDir || 'C:\\GeminiImageBot\\images\\'
  );
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSaveConfig({
        geminiModel: model,
        aspectRatio: aspectRatio as any,
        maxAttempts: Number(maxAttempts),
        maxImagesPerRun: Number(maxImagesPerRun),
        requestDelayMs: Number(requestDelayMs),
        windowsImageDir,
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <SettingsIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Automation & Gemini Settings
              </h3>
              <p className="text-xs text-slate-400">
                Configure models, batch limits, and local storage paths
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

        {/* Modal Body Form */}
        <form onSubmit={handleSave} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Gemini Model */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Gemini Image Model (Server-side)
            </label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none transition cursor-pointer"
            >
              <option value="gemini-3.1-flash-lite-image">
                gemini-3.1-flash-lite-image (Default - Fast & Cost Efficient)
              </option>
              <option value="gemini-3.1-flash-image">
                gemini-3.1-flash-image (High Quality & Multi-resolution)
              </option>
            </select>
            <p className="text-[11px] text-slate-500">
              Calls are securely executed in Node.js server runtime without client API key exposure.
            </p>
          </div>

          {/* Aspect Ratio */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Image Aspect Ratio
            </label>
            <div className="grid grid-cols-5 gap-2">
              {(['1:1', '16:9', '9:16', '4:3', '3:4'] as const).map((ar) => (
                <button
                  type="button"
                  key={ar}
                  onClick={() => setAspectRatio(ar)}
                  className={`py-1.5 px-2 rounded-xl text-xs font-mono font-medium border transition cursor-pointer ${
                    aspectRatio === ar
                      ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {ar}
                </button>
              ))}
            </div>
          </div>

          {/* Run Limit & Retries */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Max Images Per Run
              </label>
              <input
                type="number"
                min={1}
                max={100}
                value={maxImagesPerRun}
                onChange={(e) => setMaxImagesPerRun(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none"
              />
              <p className="text-[10px] text-slate-500">
                Default: 5 images (Cost optimization limit)
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Max Retries on Error
              </label>
              <input
                type="number"
                min={1}
                max={5}
                value={maxAttempts}
                onChange={(e) => setMaxAttempts(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none"
              />
              <p className="text-[10px] text-slate-500">
                Default: 3 attempts before marking Error
              </p>
            </div>
          </div>

          {/* Request Delay in ms */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Delay Between Requests (ms)
            </label>
            <input
              type="number"
              min={200}
              max={10000}
              step={100}
              value={requestDelayMs}
              onChange={(e) => setRequestDelayMs(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none"
            />
            <p className="text-[10px] text-slate-500">
              Safety delay to respect API rate limits (1200ms recommended).
            </p>
          </div>

          {/* Default Image Directory */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <FolderOpen className="w-3.5 h-3.5 text-blue-400" />
              Target Image Directory (Windows / Local)
            </label>
            <input
              type="text"
              value={windowsImageDir}
              onChange={(e) => setWindowsImageDir(e.target.value)}
              placeholder="C:\GeminiImageBot\images\"
              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none"
            />
            <p className="text-[10px] text-slate-500">
              Default path: <code className="text-slate-300">C:\GeminiImageBot\images\</code>. Files are saved locally to <code className="text-slate-300">data/images</code> on backend.
            </p>
          </div>

          {/* Database Path Note */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-start gap-2.5 text-xs text-slate-400">
            <Database className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
            <div>
              <strong className="text-white block">Local JSON Database</strong>
              Stored at <code className="text-emerald-300 font-mono text-[11px]">data/topics.json</code> with automatic resume and crash recovery.
            </div>
          </div>

          {/* Action buttons */}
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
              disabled={isSaving}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Save Configuration</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
