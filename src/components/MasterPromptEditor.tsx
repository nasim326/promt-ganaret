import React, { useState } from 'react';
import { 
  FileText, 
  RotateCcw, 
  Check, 
  Sparkles, 
  Info, 
  Copy,
  ChevronDown,
  ChevronUp,
  Eye
} from 'lucide-react';
import { DEFAULT_MASTER_PROMPT, generateFinalPrompt } from '../lib/promptUtils';
import { TopicItem } from '../types';

interface MasterPromptEditorProps {
  masterPrompt: string;
  onChangeMasterPrompt: (newPrompt: string) => void;
  selectedTopic: TopicItem | null;
  activeProcessingTopic: TopicItem | null;
}

export const MasterPromptEditor: React.FC<MasterPromptEditorProps> = ({
  masterPrompt,
  onChangeMasterPrompt,
  selectedTopic,
  activeProcessingTopic,
}) => {
  const [isCopied, setIsCopied] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Topic for local preview: prioritizes currently active processing topic, then selected row, then fallback example
  const previewTopicItem = activeProcessingTopic || selectedTopic;
  const previewTopicText = previewTopicItem ? previewTopicItem.topic : 'Luxury modern bedroom';
  const finalPromptPreview = generateFinalPrompt(masterPrompt, previewTopicText);

  const handleInsertTag = () => {
    if (!masterPrompt.includes('{{TOPIC}}')) {
      onChangeMasterPrompt(masterPrompt.trim() + '\n\n{{TOPIC}}');
    }
  };

  const handleResetDefault = () => {
    onChangeMasterPrompt(DEFAULT_MASTER_PROMPT);
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(finalPromptPreview);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-3.5">
      {/* Header & Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              Master Prompt
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono font-normal">
                Tag: {'{{TOPIC}}'}
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Only replaces <code className="text-emerald-300 font-mono">{'{{TOPIC}}'}</code> with row topic. Zero rewriting.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleInsertTag}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] font-mono text-emerald-300 hover:text-emerald-200 transition cursor-pointer"
            title="Append {{TOPIC}} placeholder"
          >
            + {'{{TOPIC}}'}
          </button>
          <button
            onClick={handleResetDefault}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
            title="Reset to default master prompt"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
          {/* Master Prompt Input Area */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <label className="font-semibold text-slate-300">Prompt Template</label>
              <span className="font-mono text-[11px] text-slate-500">
                {masterPrompt.length} chars
              </span>
            </div>
            <div className="relative">
              <textarea
                value={masterPrompt}
                onChange={(e) => onChangeMasterPrompt(e.target.value)}
                rows={4}
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-emerald-500/80 rounded-xl p-3 text-xs text-slate-100 font-mono leading-relaxed focus:outline-none transition resize-y"
                placeholder="Create a professional cinematic image about:&#10;&#10;{{TOPIC}}"
              />
            </div>
          </div>

          {/* Local Instant Prompt Preview Card */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-emerald-400" />
                <label className="font-semibold text-emerald-300">Prompt Preview (Local Only)</label>
              </div>
              <button
                onClick={handleCopyPrompt}
                className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-emerald-300 transition cursor-pointer"
              >
                {isCopied ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            <div className="bg-slate-950/90 border border-emerald-500/20 rounded-xl p-3 text-xs space-y-2 relative shadow-inner">
              <div className="flex items-center gap-2 pb-1.5 border-b border-slate-800/80 text-[11px]">
                <span className="text-slate-400 font-semibold">Topic:</span>
                <span className="font-medium text-emerald-300 truncate">
                  {previewTopicText}
                </span>
                {previewTopicItem && (
                  <span className="ml-auto text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                    ID #{previewTopicItem.id}
                  </span>
                )}
              </div>

              <div>
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1">
                  Final Prompt:
                </div>
                <div className="font-mono text-slate-200 text-xs whitespace-pre-wrap leading-relaxed max-h-24 overflow-y-auto bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                  {finalPromptPreview}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
