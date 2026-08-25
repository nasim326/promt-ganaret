import React, { useState, useRef, useCallback, useEffect } from 'react';
import { TopicItem, AutomationProgress, AutomationStatus, AppConfig } from '../types';
import { generateFinalPrompt } from '../lib/promptUtils';
import { generateImageForTopic } from '../lib/api';

interface UseAutomationProps {
  topics: TopicItem[];
  setTopics: React.Dispatch<React.SetStateAction<TopicItem[]>>;
  masterPrompt: string;
  config: AppConfig;
  batchLimit: number;
  onRefresh: () => Promise<void>;
  setSelectedTopicId: (id: number) => void;
}

export function useAutomation({
  topics,
  setTopics,
  masterPrompt,
  config,
  batchLimit,
  onRefresh,
  setSelectedTopicId,
}: UseAutomationProps) {
  const [status, setStatus] = useState<AutomationStatus>('idle');
  const [currentTopicId, setCurrentTopicId] = useState<number | null>(null);
  const [currentTopicText, setCurrentTopicText] = useState<string | null>(null);
  const [currentPrompt, setCurrentPrompt] = useState<string | null>(null);
  const [runProcessedCount, setRunProcessedCount] = useState(0);
  const [lastError, setLastError] = useState<string | null>(null);

  // References to handle async loops without stale state closures
  const isRunningRef = useRef(false);
  const isPausedRef = useRef(false);
  const topicsRef = useRef(topics);
  topicsRef.current = topics;
  const masterPromptRef = useRef(masterPrompt);
  masterPromptRef.current = masterPrompt;
  const batchLimitRef = useRef(batchLimit);
  batchLimitRef.current = batchLimit;
  const configRef = useRef(config);
  configRef.current = config;

  const stopAutomation = useCallback(() => {
    isRunningRef.current = false;
    isPausedRef.current = false;
    setStatus('stopped');
    setCurrentTopicId(null);
    setCurrentTopicText(null);
    setCurrentPrompt(null);
  }, []);

  const pauseAutomation = useCallback(() => {
    isPausedRef.current = true;
    isRunningRef.current = false;
    setStatus('paused');
  }, []);

  const runQueueLoop = useCallback(async () => {
    isRunningRef.current = true;
    isPausedRef.current = false;
    setStatus('running');
    setLastError(null);

    let processedInThisRun = 0;
    const limit = batchLimitRef.current || 5;

    while (isRunningRef.current && !isPausedRef.current && processedInThisRun < limit) {
      // Find first Pending topic (never pick Done rows)
      const currentList = topicsRef.current;
      const pendingTopic = currentList.find((t) => t.status === 'Pending');

      if (!pendingTopic) {
        // No more pending topics
        break;
      }

      // Prepare topic & final prompt locally
      const topicId = pendingTopic.id;
      const topicText = pendingTopic.topic;
      const promptToUse = generateFinalPrompt(masterPromptRef.current, topicText);

      setCurrentTopicId(topicId);
      setCurrentTopicText(topicText);
      setCurrentPrompt(promptToUse);
      setSelectedTopicId(topicId);

      // Optimistically update status to Processing in state
      setTopics((prev) =>
        prev.map((t) =>
          t.id === topicId
            ? { ...t, status: 'Processing' as const, prompt: promptToUse, error: null }
            : t
        )
      );

      try {
        // Call Gemini image generation server endpoint
        const response = await generateImageForTopic(topicId, topicText, promptToUse);

        if (response.success && response.topic) {
          // Update row to Done with image details
          setTopics((prev) =>
            prev.map((t) => (t.id === topicId ? response.topic : t))
          );
        } else if (response.topic) {
          // Error updated by server
          setTopics((prev) =>
            prev.map((t) => (t.id === topicId ? response.topic : t))
          );
          setLastError(response.error || 'Generation failed');
        }
      } catch (err: any) {
        console.error('Error processing topic:', topicId, err);
        const errMsg = err.message || 'Image generation failed';
        setLastError(errMsg);
        // Mark Error locally if server didn't respond
        setTopics((prev) =>
          prev.map((t) =>
            t.id === topicId
              ? {
                  ...t,
                  status: 'Error' as const,
                  error: errMsg,
                  attempts: (t.attempts || 0) + 1,
                }
              : t
          )
        );
      }

      processedInThisRun++;
      setRunProcessedCount(processedInThisRun);

      // If user paused or stopped during request, break out
      if (!isRunningRef.current || isPausedRef.current) {
        break;
      }

      // Check if we hit the batch limit
      if (processedInThisRun >= limit) {
        break;
      }

      // Safety delay between consecutive requests
      const delay = configRef.current.requestDelayMs || 1200;
      await new Promise((r) => setTimeout(r, delay));
    }

    // Refresh topics from server database
    await onRefresh();

    if (isPausedRef.current) {
      setStatus('paused');
    } else {
      setStatus('idle');
      isRunningRef.current = false;
    }

    setCurrentTopicId(null);
    setCurrentTopicText(null);
    setCurrentPrompt(null);
  }, [onRefresh, setTopics, setSelectedTopicId]);

  const startAutomation = useCallback(() => {
    setRunProcessedCount(0);
    runQueueLoop();
  }, [runQueueLoop]);

  // Single topic runner
  const generateSingleTopic = useCallback(
    async (topicItem: TopicItem) => {
      if (status === 'running') return;
      const promptToUse = generateFinalPrompt(masterPromptRef.current, topicItem.topic);

      setCurrentTopicId(topicItem.id);
      setCurrentTopicText(topicItem.topic);
      setCurrentPrompt(promptToUse);
      setSelectedTopicId(topicItem.id);

      setTopics((prev) =>
        prev.map((t) =>
          t.id === topicItem.id
            ? { ...t, status: 'Processing' as const, prompt: promptToUse, error: null }
            : t
        )
      );

      try {
        const response = await generateImageForTopic(topicItem.id, topicItem.topic, promptToUse);
        if (response.topic) {
          setTopics((prev) =>
            prev.map((t) => (t.id === topicItem.id ? response.topic : t))
          );
        }
      } catch (err: any) {
        const errMsg = err.message || 'Generation failed';
        setTopics((prev) =>
          prev.map((t) =>
            t.id === topicItem.id
              ? {
                  ...t,
                  status: 'Error' as const,
                  error: errMsg,
                  attempts: (t.attempts || 0) + 1,
                }
              : t
          )
        );
      } finally {
        setCurrentTopicId(null);
        setCurrentTopicText(null);
        setCurrentPrompt(null);
        await onRefresh();
      }
    },
    [status, onRefresh, setTopics, setSelectedTopicId]
  );

  const progress: AutomationProgress = {
    status,
    currentTopicId,
    currentTopicText,
    currentPrompt,
    runProcessedCount,
    runLimit: batchLimit,
    lastError,
  };

  return {
    status,
    progress,
    startAutomation,
    pauseAutomation,
    stopAutomation,
    generateSingleTopic,
    isRunning: status === 'running',
  };
}
