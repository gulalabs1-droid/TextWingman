export function replySafetyInstructions(message: string): string {
  const incoming = message.split(/\r?\n/).filter(line => /^\s*them:/i.test(line));
  const latest = incoming.length ? incoming[incoming.length - 1].replace(/^\s*them:\s*/i, '') : message;
  if (/\b(stop (?:texting|messaging|contacting)|(?:do not|don't|dont) (?:text|message|contact)|not interested|leave me alone|need (?:some )?space)\b/i.test(latest)) {
    return 'BOUNDARY OVERRIDE: They have expressed a boundary or refusal. All three options must respect it without persuasion, teasing, questions, guilt, or another invitation. Briefly acknowledge and step back. Never imply that they secretly want pursuit.';
  }
  if (/\b(we need to talk|can we talk|i(?:\x27m| am) (?:hurt|upset|scared)|that hurt|sorry for your loss|passed away)\b/i.test(latest)) {
    return 'SERIOUS MESSAGE OVERRIDE: This message calls for a calm conversation. All three replies must be neutral, respectful, and direct. No jokes, banter, flirting, excitement, intrigue, mystery, or "spill the tea". For spicier, supply a direct practical alternative such as asking when they can talk. Do not assume blame or that something bad has happened.';
  }
  return '';
}
