// Pushes supabase/templates/*.html to the hosted project's auth email templates.
// Only the signup-confirmation and magic-link/OTP templates and subjects are changed.
// Usage: SUPABASE_ACCESS_TOKEN=sbp_... node scripts/apply-auth-email-templates.mjs [--dry-run]
import { readFile } from 'node:fs/promises';

const PROJECT_REF = process.env.SUPABASE_PROJECT_REF || 'yctqpfqyctaxolulnims';
const token = process.env.SUPABASE_ACCESS_TOKEN;
const dryRun = process.argv.includes('--dry-run');

const read = name => readFile(new URL(`../supabase/templates/${name}`, import.meta.url), 'utf8');
const body = {
  mailer_subjects_confirmation: 'Your Text Wingman code',
  mailer_templates_confirmation_content: await read('confirm-signup.html'),
  mailer_subjects_magic_link: 'Your Text Wingman code',
  mailer_templates_magic_link_content: await read('magic-link.html'),
};

for (const [key, value] of Object.entries(body)) {
  if (key.includes('templates') && !value.includes('{{ .Token }}')) throw new Error(`${key} is missing {{ .Token }}`);
}

if (dryRun) {
  console.log(JSON.stringify(body, null, 2));
  process.exit(0);
}
if (!token) throw new Error('Set SUPABASE_ACCESS_TOKEN (create one at https://supabase.com/dashboard/account/tokens).');

const url = `https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`;
const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

const update = await fetch(url, { method: 'PATCH', headers, body: JSON.stringify(body) });
if (!update.ok) throw new Error(`Update failed: HTTP ${update.status} ${await update.text()}`);

const current = await (await fetch(url, { headers })).json();
for (const key of Object.keys(body)) {
  console.log(`${current[key] === body[key] ? 'OK  ' : 'DIFF'} ${key}`);
}
console.log(`OTP length: ${current.mailer_otp_length ?? 'unknown'}, OTP expiry: ${current.mailer_otp_exp ?? 'unknown'}s, custom SMTP: ${current.smtp_host ? 'yes' : 'no (built-in sender, low hourly limit)'}`);
