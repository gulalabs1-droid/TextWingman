import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import type { VideoScript } from "../remotion/types";

const root = process.cwd();
const entry = path.join(root, "marketing/videos/remotion/Root.tsx");
const outputDir = path.join(root, "marketing/videos/output");
const remotionBin = path.join(root, "node_modules/.bin/remotion");

const args = process.argv.slice(2);
const getFlag = (name: string) => {
  const direct = args.find((arg) => arg.startsWith(`--${name}=`));
  if (direct) return direct.split("=").slice(1).join("=");
  const index = args.indexOf(`--${name}`);
  return index >= 0 ? args[index + 1] : undefined;
};

const id = getFlag("id");
const frame = Number(getFlag("frame") || "310");
const out = getFlag("out");

if (!id) {
  throw new Error("Pass a script id, for example: npm run videos:still -- --id=tw-001");
}

if (!Number.isFinite(frame) || frame < 0) {
  throw new Error("Frame must be a positive number.");
}

const scripts = JSON.parse(
  readFileSync(path.join(root, "marketing/videos/scripts.json"), "utf8")
) as VideoScript[];
const script = scripts.find((item) => item.id === id);

if (!script) {
  throw new Error(`No video script found for id ${id}.`);
}

mkdirSync(outputDir, { recursive: true });

const outPath = out
  ? path.resolve(root, out)
  : path.join(outputDir, `${script.id}-${script.contentSlug}-preview.png`);
const props = JSON.stringify({ script });
const command = [
  "still",
  entry,
  "TextWingmanAd",
  outPath,
  "--frame",
  String(frame),
  "--props",
  props,
  "--overwrite",
  "--log",
  "warn",
];

console.log(`Rendering preview still for ${script.id} at frame ${frame}...`);

const result = spawnSync(remotionBin, command, {
  cwd: root,
  stdio: "inherit",
  env: process.env,
});

if (result.status !== 0) {
  throw new Error(`Preview still failed for ${script.id}`);
}

console.log(`Preview still saved to ${outPath}`);
