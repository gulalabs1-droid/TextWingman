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

const dryRun = args.includes("--dry-run");
const id = getFlag("id");
const ids = getFlag("ids");
const template = getFlag("template");
const limit = Number(getFlag("limit") || "0");

function loadScripts() {
  const raw = readFileSync(path.join(root, "marketing/videos/scripts.json"), "utf8");
  return JSON.parse(raw) as VideoScript[];
}

let selected = loadScripts();
if (id) selected = selected.filter((script) => script.id === id);
if (ids) {
  const idSet = new Set(
    ids
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean)
  );
  selected = selected.filter((script) => idSet.has(script.id));
}
if (template) selected = selected.filter((script) => script.template === template);
if (limit > 0) selected = selected.slice(0, limit);

if (selected.length === 0) {
  throw new Error("No video scripts matched the provided filters.");
}

mkdirSync(outputDir, { recursive: true });

console.log(`Rendering ${selected.length} Text Wingman video${selected.length === 1 ? "" : "s"}...`);

for (const script of selected) {
  const fileName = `${script.id}-${script.contentSlug}.mp4`;
  const outPath = path.join(outputDir, fileName);
  const props = JSON.stringify({ script });
  const command = [
    "render",
    entry,
    "TextWingmanAd",
    outPath,
    "--props",
    props,
    "--overwrite",
    "--log",
    "warn",
  ];

  console.log(`${dryRun ? "Would render" : "Rendering"} ${fileName}`);

  if (dryRun) {
    console.log(`${remotionBin} ${command.join(" ")}`);
    continue;
  }

  const result = spawnSync(remotionBin, command, {
    cwd: root,
    stdio: "inherit",
    env: process.env,
  });

  if (result.status !== 0) {
    throw new Error(`Render failed for ${script.id}`);
  }
}

console.log("Video render complete.");
