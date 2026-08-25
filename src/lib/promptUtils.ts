export const DEFAULT_MASTER_PROMPT = `Create a professional cinematic image about:

{{TOPIC}}`;

/**
 * Generate final prompt locally by replacing {{TOPIC}} (case-insensitive or exact)
 * with the provided topic string.
 * Does NOT call any API or rewrite the prompt.
 */
export function generateFinalPrompt(masterPrompt: string, topic: string): string {
  if (!masterPrompt) {
    return topic;
  }
  const cleanTopic = topic ? topic.trim() : '';
  if (!masterPrompt.includes('{{TOPIC}}') && !masterPrompt.includes('{{topic}}')) {
    // If placeholder is missing, append the topic cleanly
    return `${masterPrompt.trim()}\n\n${cleanTopic}`.trim();
  }
  return masterPrompt
    .replace(/\{\{TOPIC\}\}/g, cleanTopic)
    .replace(/\{\{topic\}\}/g, cleanTopic);
}
