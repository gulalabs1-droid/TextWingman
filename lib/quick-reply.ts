export const MAX_MESSAGE_LENGTH = 6000;
// Base64 adds one third to the body; leave room below the hosting request limit.
export const MAX_SCREENSHOT_BYTES = 3 * 1024 * 1024;
const IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);
const TONES = ['shorter', 'spicier', 'softer'] as const;

export function validateMessage(input: unknown): { message: string; error: string | null } {
  if (typeof input !== 'string' || !input.trim()) {
    return { message: '', error: 'Paste a message or choose an example to get started.' };
  }
  const message = input.trim();
  if (message.length > MAX_MESSAGE_LENGTH) {
    return { message, error: 'Keep the conversation under 6,000 characters. Start with the latest messages.' };
  }
  return { message, error: null };
}

export function validateScreenshot(file: { type: string; size: number }): string | null {
  if (!IMAGE_TYPES.has(file.type)) return 'Choose a PNG, JPG or WebP image, or paste the message instead.';
  if (!file.size) return 'That image is empty. Choose another screenshot or paste the message.';
  if (file.size > MAX_SCREENSHOT_BYTES) return 'Choose an image under 3 MB. Crop out names and extra space, or paste the message.';
  return null;
}

export function validateQuickReplies(value: unknown): Array<{ tone: (typeof TONES)[number]; text: string }> {
  if (!Array.isArray(value)) throw new Error('No replies came back. Your text is still here; try again.');
  return TONES.map(tone => {
    const reply = value.find(item => item && typeof item === 'object' && item.tone === tone);
    if (typeof reply?.text !== 'string' || !reply.text.trim()) {
      throw new Error('The reply set was incomplete. Your text is still here; try again.');
    }
    return { tone, text: reply.text.trim() };
  });
}
