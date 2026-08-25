import { AppConfig, Stats, TopicItem } from '../types';

export async function fetchTopicsAndConfig(): Promise<{
  topics: TopicItem[];
  config: AppConfig;
  stats: Stats;
}> {
  const res = await fetch('/api/topics');
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'Failed to fetch topics' }));
    throw new Error(errorData.error || `HTTP error ${res.status}`);
  }
  const data = await res.json();
  return {
    topics: data.topics || [],
    config: data.config || {},
    stats: data.stats || { total: 0, pending: 0, processing: 0, done: 0, error: 0 },
  };
}

export async function addSingleTopic(topic: string): Promise<TopicItem[]> {
  const res = await fetch('/api/topics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to add topic' }));
    throw new Error(err.error || `HTTP error ${res.status}`);
  }
  const data = await res.json();
  return data.topics;
}

export async function addMultipleTopics(topics: string[]): Promise<TopicItem[]> {
  const res = await fetch('/api/topics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topics }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to add topics' }));
    throw new Error(err.error || `HTTP error ${res.status}`);
  }
  const data = await res.json();
  return data.topics;
}

export async function updateTopic(id: number, updates: Partial<TopicItem>): Promise<TopicItem[]> {
  const res = await fetch(`/api/topics/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to update topic' }));
    throw new Error(err.error || `HTTP error ${res.status}`);
  }
  const data = await res.json();
  return data.topics;
}

export async function deleteTopic(id: number): Promise<TopicItem[]> {
  const res = await fetch(`/api/topics/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to delete topic' }));
    throw new Error(err.error || `HTTP error ${res.status}`);
  }
  const data = await res.json();
  return data.topics;
}

export async function deleteMultipleTopics(ids: number[]): Promise<TopicItem[]> {
  const res = await fetch('/api/topics/delete-many', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to delete selected topics' }));
    throw new Error(err.error || `HTTP error ${res.status}`);
  }
  const data = await res.json();
  return data.topics;
}

export async function clearTopics(filter?: 'all' | 'done' | 'error'): Promise<TopicItem[]> {
  const res = await fetch('/api/topics/clear', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filter }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to clear topics' }));
    throw new Error(err.error || `HTTP error ${res.status}`);
  }
  const data = await res.json();
  return data.topics;
}

export async function retryFailedTopics(): Promise<TopicItem[]> {
  const res = await fetch('/api/topics/retry-failed', {
    method: 'POST',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to retry failed topics' }));
    throw new Error(err.error || `HTTP error ${res.status}`);
  }
  const data = await res.json();
  return data.topics;
}

export async function resetProcessingTopics(): Promise<TopicItem[]> {
  const res = await fetch('/api/topics/reset-processing', {
    method: 'POST',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to reset processing' }));
    throw new Error(err.error || `HTTP error ${res.status}`);
  }
  const data = await res.json();
  return data.topics;
}

export async function saveAppConfig(config: Partial<AppConfig>): Promise<AppConfig> {
  const res = await fetch('/api/config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to save settings' }));
    throw new Error(err.error || `HTTP error ${res.status}`);
  }
  const data = await res.json();
  return data.config;
}

export interface GenerateResponse {
  success: boolean;
  topic: TopicItem;
  filename?: string;
  imageUrl?: string;
  imageBase64?: string;
  allTopics: TopicItem[];
  stats: Stats;
  error?: string;
  skipped?: boolean;
}

export async function generateImageForTopic(
  id: number,
  topic: string,
  prompt: string
): Promise<GenerateResponse> {
  const res = await fetch('/api/generate-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, topic, prompt }),
  });

  const data = await res.json();
  if (!res.ok && !data.topic) {
    throw new Error(data.error || `Image generation failed (${res.status})`);
  }
  return data;
}
