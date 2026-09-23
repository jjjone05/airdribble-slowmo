import fs from "node:fs";
import path from "node:path";

const root = process.argv[2];
if (!root) throw new Error("Usage: node scripts/patch-upstream.mjs <upstream-root>");

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}
function write(rel, data) {
  const p = path.join(root, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, data, "utf8");
  console.log("patched", rel);
}
function replaceOnce(text, before, after, label) {
  if (text.includes(after)) return text;
  const i = text.indexOf(before);
  if (i < 0) throw new Error("Patch anchor not found: " + label);
  return text.slice(0, i) + after + text.slice(i + before.length);
}

{
  let s = read("apps/web/src/lib/settings-store.ts");
  s = replaceOnce(s,
    "  masterVolume: number;\n  carBody:",
    "  masterVolume: number;\n  gameSpeed: number;\n  carBody:",
    "settings type");
  s = replaceOnce(s,
    "  masterVolume: 70,\n  carBody:",
    "  masterVolume: 70,\n  gameSpeed: 1.0,\n  carBody:",
    "settings default");
  s = replaceOnce(s,
    "    masterVolume: clampVolume(value.masterVolume ?? defaultSettings.masterVolume),\n    carBody:",
    "    masterVolume: clampVolume(value.masterVolume ?? defaultSettings.masterVolume),\n    gameSpeed: Math.min(1.5, Math.max(0.1, Number(value.gameSpeed ?? defaultSettings.gameSpeed))),\n    carBody:",
    "settings normalize");
  write("apps/web/src/lib/settings-store.ts", s);
}

{
  let s = read("src/Engine.ts");
  s = replaceOnce(s,
    "  applySettings(settings: any): void {\n    if (!settings) return;\n\n    // 1. Camera",
    "  applySettings(settings: any): void {\n    if (!settings) return;\n\n    if (Number.isFinite(settings.gameSpeed)) {\n      physics.world.gameSpeed = Math.min(1.5, Math.max(0.1, Number(settings.gameSpeed)));\n    }\n\n    // 1. Camera",
    "engine gameSpeed");
  write("src/Engine.ts", s);
}

{
  let s = read("apps/web/src/components/game-client.tsx");
  s = replaceOnce(s,
    'import { useAppSettings } from "@/lib/settings-store";',
    'import { updateSettings, useAppSettings } from "@/lib/settings-store";\nimport { Slider } from "@/components/ui/slider";',
    "game client imports");
  s = replaceOnce(s,
    '      <div className="h-full w-full" id="three-container" ref={containerRef} />\n    </div>',
    '      <div className="h-full w-full" id="three-container" ref={containerRef} />\n\n' +
    '      <div\n' +
    '        className="absolute bottom-4 right-4 z-30 w-64 rounded-xl border border-border/50 bg-background/80 p-3 shadow-lg backdrop-blur-md"\n' +
    '        onPointerDown={(event) => event.stopPropagation()}\n' +
    '        onClick={(event) => event.stopPropagation()}\n' +
    '      >\n' +
    '        <div className="mb-2 flex items-center justify-between gap-3">\n' +
    '          <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Game Speed</span>\n' +
    '          <span className="font-mono text-xs font-bold tabular-nums">{settings.gameSpeed.toFixed(2)}×</span>\n' +
    '        </div>\n' +
    '        <Slider\n' +
    '          value={[settings.gameSpeed]} min={0.1} max={1.5} step={0.05}\n' +
    '          onValueChange={(value) => updateSettings({ gameSpeed: value[0] })}\n' +
    '          aria-label="Game speed"\n' +
    '        />\n' +
    '      </div>\n' +
    '    </div>',
    "game client slider");
  write("apps/web/src/components/game-client.tsx", s);
}

// GitHub Pages has no same-origin Go backend. Freeplay and Tutorial are fully
// client-side, so do not block them on guest-account creation.
{
  let s = read("apps/web/src/app/app/game/[scenario]/page.tsx");
  s = replaceOnce(s,
    "      // Skip if already attempted or if we're not in a challenge\\n      if (initAttemptedRef.current) return;\\n      \\n      // Wait for basic user/challenge query states to settle",
    "      // Skip if already attempted\\n      if (initAttemptedRef.current) return;\\n\\n      // Freeplay and Tutorial are local-only on the static Pages build.\\n      // Do not require the guest-account/backend bootstrap for these modes.\\n      if (!isChallenge) {\\n        initAttemptedRef.current = true;\\n        setInitError(null);\\n        setIsInitializing(false);\\n        return;\\n      }\\n      \\n      // Wait for basic user/challenge query states to settle",
    "static freeplay/tutorial initialization");
  write("apps/web/src/app/app/game/[scenario]/page.tsx", s);
}

{
  const cfg = 'import type { NextConfig } from "next";\n' +
    'import path from "path";\n\n' +
    'const basePath = process.env.GITHUB_PAGES === "true" ? "/airdribble-slowmo" : "";\n\n' +
    'const nextConfig: NextConfig = {\n' +
    '  output: "export",\n' +
    '  basePath,\n' +
    '  assetPrefix: basePath || undefined,\n' +
    '  images: { unoptimized: true },\n' +
    '  trailingSlash: true,\n' +
    '  transpilePackages: ["../../src"],\n' +
    '  experimental: { externalDir: true },\n' +
    '  turbopack: { root: path.resolve(__dirname, "..", "..") },\n' +
    '};\n\n' +
    'export default nextConfig;\n';
  write("apps/web/next.config.ts", cfg);
}

write("apps/web/src/app/app/game/[scenario]/layout.tsx",
  'export const dynamicParams = false;\n\n' +
  'export function generateStaticParams() {\n' +
  '  return [\n' +
  '    { scenario: "tutorial" },\n' +
  '    { scenario: "freeplay" },\n' +
  '    { scenario: "one-shot" },\n' +
  '    { scenario: "ball-tracking" },\n' +
  '    { scenario: "direction-control" },\n' +
  '  ];\n' +
  '}\n\n' +
  'export default function ScenarioLayout({ children }: { children: React.ReactNode }) {\n' +
  '  return children;\n' +
  '}\n');

write("apps/web/src/app/app/profile/[username]/layout.tsx",
  'export const dynamicParams = false;\n\n' +
  'export function generateStaticParams() {\n' +
  '  return [{ username: "demo" }];\n' +
  '}\n\n' +
  'export default function PublicProfileLayout({ children }: { children: React.ReactNode }) {\n' +
  '  return children;\n' +
  '}\n');

console.log("Upstream patch complete.");