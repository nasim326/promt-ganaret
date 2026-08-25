/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Header } from './components/Header';
import { StatsBar } from './components/StatsBar';
import { ControlsBar } from './components/ControlsBar';
import { MasterPromptEditor } from './components/MasterPromptEditor';
import { TopicsTable } from './components/TopicsTable';
import { ImagePreviewPanel } from './components/ImagePreviewPanel';
import { AddTopicModal } from './components/AddTopicModal';
import { SettingsModal } from './components/SettingsModal';
import { LightboxModal } from './components/LightboxModal';
import { ExportModal } from './components/ExportModal';
import { useAutomation } from './hooks/useAutomation';
import { 
  fetchTopicsAndConfig, 
  addSingleTopic, 
  addMultipleTopics, 
  updateTopic, 
  deleteTopic, 
  deleteMultipleTopics, 
  clearTopics, 
  retryFailedTopics, 
  saveAppConfig 
} from './lib/api';
import { DEFAULT_MASTER_PROMPT } from './lib/promptUtils';
import { AppConfig, Stats, TopicItem } from './types';

const INITIAL_CONFIG: AppConfig = {
  geminiModel: 'gemini-3.1-flash-lite-image',
  aspectRatio: '1:1',
  maxAttempts: 3,
  maxImagesPerRun: 5,
  requestDelayMs: 1200,
  masterPrompt: DEFAULT_MASTER_PROMPT,
  windowsImageDir: 'C:\\GeminiImageBot\\images\\',
};

export default function App() {
  const [topics, setTopics] = useState<TopicItem[]>([]);
  const [config, setConfig] = useState<AppConfig>(INITIAL_CONFIG);
  const [masterPrompt, setMasterPrompt] = useState<string>(DEFAULT_MASTER_PROMPT);
  const [batchLimit, setBatchLimit] = useState<number>(5);
  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [lightboxData, setLightboxData] = useState<{ url: string; topic: string } | null>(null);

  // Load initial data
  const loadData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const data = await fetchTopicsAndConfig();
      setTopics(data.topics);
      if (data.config) {
        setConfig((prev) => ({ ...prev, ...data.config }));
        if (data.config.masterPrompt) {
          setMasterPrompt(data.config.masterPrompt);
        }
        if (data.config.maxImagesPerRun) {
          setBatchLimit(data.config.maxImagesPerRun);
        }
      }
      // If no selected topic, select first one
      if (data.topics.length > 0 && !selectedTopicId) {
        setSelectedTopicId(data.topics[0].id);
      }
    } catch (err) {
      console.error('Failed to load initial data:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [selectedTopicId]);

  useEffect(() => {
    loadData();
  }, []);

  // Sync master prompt changes to backend debounced
  const handleMasterPromptChange = (newPrompt: string) => {
    setMasterPrompt(newPrompt);
    saveAppConfig({ masterPrompt: newPrompt }).catch(console.error);
  };

  // Automation Engine
  const {
    status: automationStatus,
    progress,
    startAutomation,
    pauseAutomation,
    stopAutomation,
    generateSingleTopic,
    isRunning,
  } = useAutomation({
    topics,
    setTopics,
    masterPrompt,
    config,
    batchLimit,
    onRefresh: loadData,
    setSelectedTopicId,
  });

  // Calculate live statistics
  const stats: Stats = useMemo(() => {
    const total = topics.length;
    let pending = 0;
    let processing = 0;
    let done = 0;
    let error = 0;

    for (const t of topics) {
      if (t.status === 'Pending') pending++;
      else if (t.status === 'Processing') processing++;
      else if (t.status === 'Done') done++;
      else if (t.status === 'Error') error++;
    }

    return { total, pending, processing, done, error };
  }, [topics]);

  // Filtered topics for the table
  const filteredTopics = useMemo(() => {
    return topics.filter((t) => {
      // Status filter
      if (statusFilter !== 'all' && t.status !== statusFilter) {
        return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          t.topic.toLowerCase().includes(q) ||
          (t.filename && t.filename.toLowerCase().includes(q)) ||
          t.id.toString().includes(q)
        );
      }
      return true;
    });
  }, [topics, statusFilter, searchQuery]);

  // Selection handlers
  const handleToggleSelectAll = () => {
    if (selectedIds.length === filteredTopics.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredTopics.map((t) => t.id));
    }
  };

  const handleToggleSelectRow = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Topic CRUD Operations
  const handleAddSingle = async (topicText: string) => {
    const updated = await addSingleTopic(topicText);
    setTopics(updated);
    if (updated.length > 0) {
      setSelectedTopicId(updated[updated.length - 1].id);
    }
  };

  const handleAddMultiple = async (topicsList: string[]) => {
    const updated = await addMultipleTopics(topicsList);
    setTopics(updated);
    if (updated.length > 0) {
      setSelectedTopicId(updated[updated.length - 1].id);
    }
  };

  const handleUpdateTopicText = async (id: number, newTopic: string) => {
    const updated = await updateTopic(id, { topic: newTopic });
    setTopics(updated);
  };

  const handleDeleteTopic = async (id: number) => {
    const updated = await deleteTopic(id);
    setTopics(updated);
    setSelectedIds((prev) => prev.filter((i) => i !== id));
    if (selectedTopicId === id) {
      setSelectedTopicId(updated.length > 0 ? updated[0].id : null);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    const updated = await deleteMultipleTopics(selectedIds);
    setTopics(updated);
    setSelectedIds([]);
    if (selectedIds.includes(selectedTopicId || -1)) {
      setSelectedTopicId(updated.length > 0 ? updated[0].id : null);
    }
  };

  const handleClearTopics = async (type: 'all' | 'done' | 'error') => {
    const updated = await clearTopics(type);
    setTopics(updated);
    setSelectedIds([]);
    setSelectedTopicId(updated.length > 0 ? updated[0].id : null);
  };

  const handleRetryFailed = async () => {
    const updated = await retryFailedTopics();
    setTopics(updated);
  };

  const handleSaveConfig = async (newConfig: Partial<AppConfig>) => {
    const updated = await saveAppConfig(newConfig);
    setConfig((prev) => ({ ...prev, ...updated }));
    if (updated.maxImagesPerRun) {
      setBatchLimit(updated.maxImagesPerRun);
    }
  };

  const handleBatchLimitChange = (limit: number) => {
    setBatchLimit(limit);
    saveAppConfig({ maxImagesPerRun: limit }).catch(console.error);
  };

  // Sample data loader
  const handleLoadSampleData = async () => {
    const samples = [
      'Luxury modern bedroom with marble floor and panoramic sunset view',
      'Futuristic neon-lit cyberpunk city street under heavy rain',
      'Peaceful Japanese zen garden with koi pond and cherry blossoms',
      'Cozy wooden log cabin in snow-covered pine mountains',
      'Astronaut floating above Earth reflecting colorful cosmic nebula',
    ];
    await handleAddMultiple(samples);
  };

  // Selected topic object
  const selectedTopic = useMemo(() => {
    return topics.find((t) => t.id === selectedTopicId) || (topics.length > 0 ? topics[0] : null);
  }, [topics, selectedTopicId]);

  // Active processing topic object (if any)
  const activeProcessingTopic = useMemo(() => {
    if (progress.currentTopicId) {
      return topics.find((t) => t.id === progress.currentTopicId) || null;
    }
    return topics.find((t) => t.status === 'Processing') || null;
  }, [topics, progress.currentTopicId]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* App Header */}
      <Header
        config={config}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenExportModal={() => setIsExportOpen(true)}
        onRefresh={loadData}
        isRefreshing={isRefreshing}
      />

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-4">
        {/* Statistics KPI bar */}
        <StatsBar
          stats={stats}
          selectedFilter={statusFilter}
          onSelectFilter={setStatusFilter}
          progress={progress}
        />

        {/* Excel-like Controls Toolbar */}
        <ControlsBar
          automationStatus={automationStatus}
          onStart={startAutomation}
          onPause={pauseAutomation}
          onStop={stopAutomation}
          onRetryFailed={handleRetryFailed}
          onOpenAddModal={() => setIsAddModalOpen(true)}
          onDeleteSelected={handleDeleteSelected}
          onClearTopics={handleClearTopics}
          selectedCount={selectedIds.length}
          totalTopics={topics.length}
          pendingCount={stats.pending}
          errorCount={stats.error}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          batchLimit={batchLimit}
          onBatchLimitChange={handleBatchLimitChange}
        />

        {/* Master Prompt Editor & Local Prompt Preview */}
        <MasterPromptEditor
          masterPrompt={masterPrompt}
          onChangeMasterPrompt={handleMasterPromptChange}
          selectedTopic={selectedTopic}
          activeProcessingTopic={activeProcessingTopic}
        />

        {/* Main Content Grid: Spreadsheet Table (Left/Center) + Image Preview Panel (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
          {/* Table Container (2 columns on large screens) */}
          <div className="lg:col-span-2 space-y-3">
            <TopicsTable
              topics={filteredTopics}
              selectedTopicId={selectedTopicId}
              onSelectTopic={(t) => setSelectedTopicId(t.id)}
              selectedIds={selectedIds}
              onToggleSelectAll={handleToggleSelectAll}
              onToggleSelectRow={handleToggleSelectRow}
              onUpdateTopicText={handleUpdateTopicText}
              onDeleteTopic={handleDeleteTopic}
              onGenerateSingle={generateSingleTopic}
              onRetryTopic={async (id) => {
                await updateTopic(id, { status: 'Pending', error: null });
                await loadData();
              }}
              onOpenLightbox={(url, topic) => setLightboxData({ url, topic })}
              isAutomationRunning={isRunning}
              onLoadSampleData={handleLoadSampleData}
            />
          </div>

          {/* Right Side Panel: Image Preview Area */}
          <div className="lg:col-span-1 lg:sticky lg:top-20">
            <ImagePreviewPanel
              selectedTopic={selectedTopic}
              activeProcessingTopic={activeProcessingTopic}
              masterPrompt={masterPrompt}
              onOpenLightbox={(url, topic) => setLightboxData({ url, topic })}
            />
          </div>
        </div>
      </main>

      {/* Modals */}
      <AddTopicModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddSingle={handleAddSingle}
        onAddMultiple={handleAddMultiple}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={config}
        onSaveConfig={handleSaveConfig}
      />

      <LightboxModal
        isOpen={Boolean(lightboxData)}
        onClose={() => setLightboxData(null)}
        imageUrl={lightboxData?.url || null}
        topicTitle={lightboxData?.topic || null}
      />

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        topics={topics}
      />
    </div>
  );
}
