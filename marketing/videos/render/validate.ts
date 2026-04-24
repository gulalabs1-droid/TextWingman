import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import type { VideoScript } from "../remotion/types";

const root = process.cwd();
const scripts = JSON.parse(
  readFileSync(path.join(root, "marketing/videos/scripts.json"), "utf8")
) as VideoScript[];

const validTemplates = new Set(["wrong-right", "group-chat", "screenshot-analyzer"]);
const errors: string[] = [];
const warnings: string[] = [];

for (const script of scripts) {
  const prefix = script.id || "missing-id";

  for (const key of [
    "id",
    "scenario",
    "audience",
    "template",
    "durationSeconds",
    "hook",
    "incoming",
    "badReply",
    "goodReply",
    "why",
    "cta",
    "campaign",
    "contentSlug",
  ] as const) {
    if (script[key] === undefined || script[key] === "") {
      errors.push(`${prefix}: missing ${key}`);
    }
  }

  if (!validTemplates.has(script.template)) {
    errors.push(`${prefix}: invalid template ${script.template}`);
  }

  if (script.durationSeconds < 10 || script.durationSeconds > 20) {
    errors.push(`${prefix}: duration should be between 10 and 20 seconds`);
  }

  if (script.hook.length > 78) warnings.push(`${prefix}: hook is long`);
  if (script.goodReply.length > 74) warnings.push(`${prefix}: good reply is long`);
  if (script.badReply.length > 74) warnings.push(`${prefix}: bad reply is long`);
  if (script.why.length > 78) warnings.push(`${prefix}: why line is long`);
}

const duplicateIds = scripts
  .map((script) => script.id)
  .filter((id, index, all) => all.indexOf(id) !== index);

for (const id of duplicateIds) {
  errors.push(`${id}: duplicate script id`);
}

console.log(`Validated ${scripts.length} video scripts.`);

if (warnings.length) {
  console.log("\nWarnings:");
  for (const warning of warnings) console.log(`- ${warning}`);
}

if (errors.length) {
  console.log("\nErrors:");
  for (const error of errors) console.log(`- ${error}`);
  process.exit(1);
}

const outputDir = path.join(root, "marketing/videos/output");
const rendered = scripts
  .map((script) => {
    const file = path.join(outputDir, `${script.id}-${script.contentSlug}.mp4`);
    if (!existsSync(file)) return null;
    const sizeMb = statSync(file).size / 1024 / 1024;
    return `${script.id}: ${sizeMb.toFixed(1)} MB`;
  })
  .filter(Boolean);

if (rendered.length) {
  console.log("\nRendered outputs:");
  for (const line of rendered) console.log(`- ${line}`);
} else {
  console.log("\nNo rendered MP4s found yet. Run npm run videos:render -- --limit=1 first.");
}

console.log("\nValidation passed.");
