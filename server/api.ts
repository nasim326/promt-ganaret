import express, { Request, Response, Router } from 'express';
import path from 'path';
import { db, TopicItem } from './db.js';
import { generateGeminiImage } from './gemini.js';
import { doesImageExist, getImageFilePath, getUniqueFilename, saveImageToDisk } from './imageStorage.js';
import { DEFAULT_CONFIG } from './config.js';

export const apiRouter = Router();

// Middleware to parse JSON
apiRouter.use(express.json());

// Helper to calculate stats
function calculateStats(topics: TopicItem[]) {
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
}

// 1. Get all topics & stats
apiRouter.get('/topics', (req: Request, res: Response) => {
  try {
    const topics = db.getTopics();
    const config = db.getConfig();
    const stats = calculateStats(topics);
    res.json({ success: true, topics, config, stats });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Add single or multiple topics
apiRouter.post('/topics', (req: Request, res: Response) => {
  try {
    const { topic, topics } = req.body;
    if (Array.isArray(topics)) {
      const added = db.addMultipleTopics(topics);
      const allTopics = db.getTopics();
      res.json({ success: true, added, topics: allTopics, stats: calculateStats(allTopics) });
    } else if (topic && typeof topic === 'string') {
      const added = db.addTopic(topic);
      const allTopics = db.getTopics();
      res.json({ success: true, added, topics: allTopics, stats: calculateStats(allTopics) });
    } else {
      res.status(400).json({ success: false, error: 'Topic text or topics array is required' });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Update single topic
apiRouter.put('/topics/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const updates = req.body;
    const updated = db.updateTopic(id, updates);
    if (!updated) {
      return res.status(404).json({ success: false, error: `Topic with id ${id} not found` });
    }
    const allTopics = db.getTopics();
    res.json({ success: true, topic: updated, topics: allTopics, stats: calculateStats(allTopics) });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Delete single topic
apiRouter.delete('/topics/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const deleted = db.deleteTopic(id);
    const allTopics = db.getTopics();
    res.json({ success: deleted, topics: allTopics, stats: calculateStats(allTopics) });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Bulk delete topics
apiRouter.post('/topics/delete-many', (req: Request, res: Response) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids)) {
      return res.status(400).json({ success: false, error: 'ids array is required' });
    }
    const count = db.deleteMultipleTopics(ids);
    const allTopics = db.getTopics();
    res.json({ success: true, count, topics: allTopics, stats: calculateStats(allTopics) });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Clear topics (all, done, or error)
apiRouter.post('/topics/clear', (req: Request, res: Response) => {
  try {
    const { filter } = req.body;
    const count = db.clearTopics(filter);
    const allTopics = db.getTopics();
    res.json({ success: true, count, topics: allTopics, stats: calculateStats(allTopics) });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. Retry all failed topics
apiRouter.post('/topics/retry-failed', (req: Request, res: Response) => {
  try {
    const count = db.retryFailed();
    const allTopics = db.getTopics();
    res.json({ success: true, count, topics: allTopics, stats: calculateStats(allTopics) });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8. Reset stuck Processing rows to Pending
apiRouter.post('/topics/reset-processing', (req: Request, res: Response) => {
  try {
    const count = db.resetProcessingToPending();
    const allTopics = db.getTopics();
    res.json({ success: true, count, topics: allTopics, stats: calculateStats(allTopics) });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 9. Get & Update Config
apiRouter.get('/config', (req: Request, res: Response) => {
  try {
    res.json({ success: true, config: db.getConfig() });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.post('/config', (req: Request, res: Response) => {
  try {
    const updated = db.updateConfig(req.body);
    res.json({ success: true, config: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 10. Generate Image for a topic
apiRouter.post('/generate-image', async (req: Request, res: Response) => {
  const { id, topic, prompt } = req.body;

  if (!id || !topic) {
    return res.status(400).json({ success: false, error: 'Topic ID and Topic string are required' });
  }

  const existing = db.getTopicById(Number(id));
  if (!existing) {
    return res.status(404).json({ success: false, error: `Topic with id ${id} not found` });
  }

  // Duplicate Protection: If a row already has an image filename and the image exists on disk
  if (existing.filename && doesImageExist(existing.filename)) {
    const updated = db.updateTopic(existing.id, {
      status: 'Done',
      imageUrl: `/api/images/${existing.filename}`,
      error: null,
    });
    return res.json({
      success: true,
      skipped: true,
      message: 'Image already exists on disk. Marked as Done.',
      topic: updated,
      filename: existing.filename,
      imageUrl: `/api/images/${existing.filename}`,
    });
  }

  // Mark as Processing
  db.updateTopic(existing.id, {
    status: 'Processing',
    prompt: prompt || topic,
    error: null,
  });

  const config = db.getConfig();
  const currentAttempts = (existing.attempts || 0) + 1;

  try {
    const finalPrompt = prompt || topic;
    const modelToUse = config.geminiModel || DEFAULT_CONFIG.geminiModel;
    const aspectRatioToUse = (config.aspectRatio as any) || '1:1';

    // Call Gemini image generation API server-side
    const genResult = await generateGeminiImage(finalPrompt, modelToUse, aspectRatioToUse);

    // Generate safe Windows/Linux filename
    const filename = getUniqueFilename(topic);

    // Save image to disk
    await saveImageToDisk(genResult.imageBase64, filename);

    // Update topic row in DB to Done
    const updated = db.updateTopic(existing.id, {
      status: 'Done',
      filename,
      imageUrl: `/api/images/${filename}`,
      attempts: currentAttempts,
      error: null,
      completedAt: Date.now(),
      prompt: finalPrompt,
    });

    const allTopics = db.getTopics();

    return res.json({
      success: true,
      topic: updated,
      filename,
      imageUrl: `/api/images/${filename}`,
      imageBase64: `data:${genResult.mimeType};base64,${genResult.imageBase64}`,
      allTopics,
      stats: calculateStats(allTopics),
    });
  } catch (err: any) {
    const errorMessage = err.message || 'Unknown error occurred during Gemini image generation';
    console.error(`Gemini Generation Error for Topic ID ${id} ("${topic}"):`, errorMessage);

    // Update topic row with Error and increment attempts
    const updated = db.updateTopic(existing.id, {
      status: 'Error',
      attempts: currentAttempts,
      error: errorMessage,
    });

    const allTopics = db.getTopics();

    return res.status(500).json({
      success: false,
      error: errorMessage,
      topic: updated,
      allTopics,
      stats: calculateStats(allTopics),
    });
  }
});

// 11. Serve saved images
apiRouter.get('/images/:filename', (req: Request, res: Response) => {
  try {
    const filename = req.params.filename;
    const filePath = getImageFilePath(filename);
    if (!filePath) {
      return res.status(404).send('Image file not found');
    }
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.sendFile(filePath);
  } catch (err: any) {
    res.status(500).send(err.message);
  }
});

export const apiApp = express();
apiApp.use(express.json({ limit: '50mb' }));
apiApp.use(express.urlencoded({ extended: true, limit: '50mb' }));
apiApp.use('/api', apiRouter);
