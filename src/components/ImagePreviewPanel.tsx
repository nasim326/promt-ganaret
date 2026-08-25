import React, { useState } from 'react';
import { 
  TopicItem, 
  TopicStatus 
} from '../types';
import { 
  ImageIcon, 
  Download, 
  Maximize2, 
  Copy, 
  Check, 
  ExternalLink, 
  CheckCircle2, 
  Clock, 
  Loader2, 
  AlertTriangle,
  FileCode2,
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';
import { generateFinalPrompt } from '../lib/promptUtils';

interface ImagePreviewPanelProps {
  selectedTopic: TopicItem | null;
  activeProcessingTopic: TopicItem | null;
  masterPrompt: string;
  onOpenLightbox: (url: string, topic: string) => void;
}

export const ImagePreviewPanel: React.FC<ImagePreviewPanelProps> = ({
  selectedTopic,
  activeProcessingTopic,
  masterPrompt,
  onOpenLightbox,
}) => {
  const [copiedFilename, setCopiedFilename] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  // Active topic prioritizes processing item, then selected item
  const topicItem = activeProcessingTopic || selectedTopic;
  const hasImage = Boolean(topicItem?.imageUrl);
  const isProcessing = topicItem?.status === 'Processing';

  const finalPrompt = topicItem?.prompt || (topicItem ? generateFinalPrompt(masterPrompt, topicItem.topic) : '');

  const handleCopyFilename = () => {
    if (topicItem?.filename) {
      navigator.clipboard.writeText(topicItem.filename);
      setCopiedFilename(true);
      setTimeout(() => setCopiedFilename(false), 2000);
    }
  };

  const handleCopyPrompt = () => {
    if (finalPrompt) {
      navigator.clipboard.writeText(finalPrompt);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2000);
    }
  };

  const handleDownload = () => {
    if (topicItem?.imageUrl && topicItem?.filename) {
      const a = document.createElement('a');
      a.href = topicItem.imageUrl;
      a.download = topicItem.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const renderStatus = (status?: TopicStatus) => {
    if (!status) return null;
    switch (status) {
      case 'Done':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
            Done
          </span>
        );
      case 'Processing':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-500/15 text-blue-300 border border-blue-500/30 animate-pulse">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
            Generating...
          </span>
        );
      case 'Error':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
            <AlertTriangle className="w-3.5 h-3.5 stroke-[2.2]" />
            Error
          </span>
        );
      case 'Pending':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20">
            <Clock className="w-3.5 h-3.5" />
            Pending Queue
          </span>
        );
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col h-full space-y-4">
      {/* Panel Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <ImageIcon className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-bold text-white tracking-tight">
            Image Preview
          </h2>
        </div>
        {topicItem && renderStatus(topicItem.status)}
      </div>

      {/* Main Image Stage */}
      <div className="relative aspect-square w-full rounded-xl bg-slate-950 border border-slate-800/80 overflow-hidden flex items-center justify-center group shadow-inner">
        {hasImage ? (
          <>
            <img
              src={topicItem!.imageUrl}
              alt={topicItem!.topic}
              className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition flex items-end justify-between p-3">
              <button
                onClick={() => onOpenLightbox(topicItem!.imageUrl!, topicItem!.topic)}
                className="px-3 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-900 border border-slate-700 text-xs font-medium text-white transition flex items-center gap-1.5 shadow cursor-pointer"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Fullscreen</span>
              </button>

              <button
                onClick={handleDownload}
                className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition shadow cursor-pointer"
                title="Download Image"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </>
        ) : isProcessing ? (
          <div className="text-center p-6 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-400 mx-auto flex items-center justify-center animate-pulse">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold text-white">Gemini Generating Image...</p>
              <p className="text-[11px] text-slate-400">Processing topic prompt on server</p>
            </div>
          </div>
        ) : topicItem?.status === 'Error' ? (
          <div className="text-center p-6 space-y-2 max-w-xs">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-rose-300">Generation Failed</p>
            <p className="text-[11px] text-rose-400/80 line-clamp-3">
              {topicItem.error || 'Gemini image request did not succeed.'}
            </p>
          </div>
        ) : (
          <div className="text-center p-6 space-y-2 text-slate-500">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 text-slate-600 mx-auto flex items-center justify-center">
              <ImageIcon className="w-6 h-6" />
            </div>
            <p className="text-xs font-medium text-slate-400">
              {topicItem ? 'Ready to generate' : 'Select a topic row'}
            </p>
            <p className="text-[11px] text-slate-600">
              {topicItem ? 'Click Start or Play to generate image' : 'Image will appear here once generated'}
            </p>
          </div>
        )}
      </div>

      {/* Details & Metadata */}
      {topicItem ? (
        <div className="space-y-3 text-xs flex-1">
          {/* Topic title */}
          <div className="space-y-1">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Topic
            </div>
            <div className="text-sm font-bold text-white leading-tight">
              {topicItem.topic}
            </div>
          </div>

          {/* Filename */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Filename
              </span>
              {topicItem.filename && (
                <button
                  onClick={handleCopyFilename}
                  className="text-[11px] text-slate-400 hover:text-emerald-400 transition flex items-center gap-1 cursor-pointer"
                >
                  {copiedFilename ? (
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
              )}
            </div>
            <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-300 truncate">
              {topicItem.filename || <span className="text-slate-600">Not generated yet (safe Windows filename)</span>}
            </div>
          </div>

          {/* Applied Prompt */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <FileCode2 className="w-3 h-3 text-emerald-400" />
                Applied Prompt
              </span>
              <button
                onClick={handleCopyPrompt}
                className="text-[11px] text-slate-400 hover:text-emerald-400 transition flex items-center gap-1 cursor-pointer"
              >
                {copiedPrompt ? (
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
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-300 whitespace-pre-wrap max-h-24 overflow-y-auto leading-relaxed">
              {finalPrompt}
            </div>
          </div>

          {/* Metadata Footer info */}
          <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <Layers className="w-3 h-3 text-slate-500" />
              <span>Attempts: <strong className="text-white font-mono">{topicItem.attempts}/3</strong></span>
            </div>
            {topicItem.completedAt && (
              <div className="flex items-center gap-1.5 text-right justify-end">
                <Calendar className="w-3 h-3 text-slate-500" />
                <span className="font-mono text-[10px]">
                  {new Date(topicItem.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-xs text-slate-500 text-center py-6">
          Select any topic in the table to inspect details and preview prompt.
        </div>
      )}
    </div>
  );
};
