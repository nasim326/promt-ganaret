import React from 'react';
import { 
  Layers, 
  Clock, 
  Loader2, 
  CheckCircle2, 
  AlertTriangle,
  Flame
} from 'lucide-react';
import { Stats, AutomationProgress } from '../types';

interface StatsBarProps {
  stats: Stats;
  selectedFilter: string;
  onSelectFilter: (filter: string) => void;
  progress: AutomationProgress;
}

export const StatsBar: React.FC<StatsBarProps> = ({
  stats,
  selectedFilter,
  onSelectFilter,
  progress,
}) => {
  const cards = [
    {
      id: 'all',
      label: 'Total Topics',
      count: stats.total,
      icon: Layers,
      color: 'border-slate-700/60 bg-slate-800/60 text-slate-200',
      activeColor: 'ring-2 ring-slate-400 bg-slate-800 text-white',
      badgeColor: 'bg-slate-700 text-slate-300',
      iconColor: 'text-slate-400',
    },
    {
      id: 'Pending',
      label: 'Pending',
      count: stats.pending,
      icon: Clock,
      color: 'border-amber-500/30 bg-amber-500/5 text-amber-200',
      activeColor: 'ring-2 ring-amber-400 bg-amber-500/15 text-amber-100',
      badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
      iconColor: 'text-amber-400',
    },
    {
      id: 'Processing',
      label: 'Processing',
      count: stats.processing,
      icon: Loader2,
      color: 'border-blue-500/30 bg-blue-500/5 text-blue-200',
      activeColor: 'ring-2 ring-blue-400 bg-blue-500/15 text-blue-100',
      badgeColor: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
      iconColor: 'text-blue-400 animate-spin',
    },
    {
      id: 'Done',
      label: 'Done',
      count: stats.done,
      icon: CheckCircle2,
      color: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-200',
      activeColor: 'ring-2 ring-emerald-400 bg-emerald-500/15 text-emerald-100',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
      iconColor: 'text-emerald-400',
    },
    {
      id: 'Error',
      label: 'Error',
      count: stats.error,
      icon: AlertTriangle,
      color: 'border-rose-500/30 bg-rose-500/5 text-rose-200',
      activeColor: 'ring-2 ring-rose-400 bg-rose-500/15 text-rose-100',
      badgeColor: 'bg-rose-500/20 text-rose-300 border border-rose-500/30',
      iconColor: 'text-rose-400',
    },
  ];

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {cards.map((c) => {
          const Icon = c.icon;
          const isSelected = selectedFilter === c.id;
          return (
            <button
              key={c.id}
              onClick={() => onSelectFilter(c.id)}
              className={`p-3 rounded-xl border transition-all text-left flex items-center justify-between cursor-pointer ${
                isSelected ? c.activeColor : `${c.color} hover:bg-slate-800/80`
              }`}
            >
              <div className="space-y-0.5">
                <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                  {c.label}
                </div>
                <div className="text-xl font-bold font-mono tracking-tight text-white">
                  {c.count}
                </div>
              </div>
              <div className={`p-2 rounded-lg ${c.badgeColor}`}>
                <Icon className={`w-4 h-4 ${c.iconColor}`} />
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Run Banner when automation is active or paused */}
      {progress.status !== 'idle' && (
        <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-800/90 border border-emerald-500/30 text-xs text-slate-300 shadow-sm animate-pulse">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold text-emerald-300 uppercase tracking-wide text-[10px]">
              {progress.status === 'running' ? 'Active Run' : progress.status === 'paused' ? 'Paused' : 'Run Stopped'}
            </span>
            <span className="text-slate-400">|</span>
            <span>
              Batch Progress: <strong className="text-white font-mono">{progress.runProcessedCount}</strong> of <strong className="text-white font-mono">{progress.runLimit}</strong> limit
            </span>
            {progress.currentTopicText && (
              <span className="text-slate-400 hidden md:inline">
                • Current: <span className="text-emerald-200 font-medium">"{progress.currentTopicText}"</span>
              </span>
            )}
          </div>
          <div className="text-slate-400 font-mono text-[11px]">
            Cost Protection Active (Max {progress.runLimit}/run)
          </div>
        </div>
      )}
    </div>
  );
};
