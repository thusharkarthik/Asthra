import { accessSync, chmodSync, closeSync, constants, existsSync, mkdirSync, openSync, renameSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";

const root = process.cwd();
const distDir = join(root, ".next");
const writableDirs = [
  "cache",
  "cache/webpack",
  "cache/webpack/client-production",
  "cache/webpack/server-production",
  "server",
  "server/app",
  "static",
  "static/chunks",
  "static/css",
  "static/development",
  "static/webpack",
  "types",
];
const writableFiles = [
  "app-build-manifest.json",
  "build-manifest.json",
  "package.json",
  "prerender-manifest.json",
  "react-loadable-manifest.json",
  "routes-manifest.json",
  "server/app-paths-manifest.json",
  "server/interception-route-rewrite-manifest.js",
  "server/middleware-build-manifest.js",
  "server/middleware-manifest.json",
  "server/middleware-react-loadable-manifest.js",
  "server/next-font-manifest.js",
  "server/next-font-manifest.json",
  "server/pages-manifest.json",
  "server/server-reference-manifest.js",
  "server/server-reference-manifest.json",
  "types/cache-life.d.ts",
  "types/package.json",
  "types/routes.d.ts",
  "types/validator.ts",
];

function applyBuildAcl() {
  const user = process.env.USER;
  if (!user) return;
  try {
    execFileSync("setfacl", ["-Rm", `u:${user}:rwx,d:u:${user}:rwx,m:rwx,d:m:rwx`, distDir], { stdio: "ignore" });
  } catch {
    // setfacl is not available in every environment. chmod + umask still cover
    // normal local builds; ACLs are only needed when build workers write as
    // another user inside shared containers.
  }
}

function ensureWritableDistDir() {
  if (existsSync(distDir)) {
    try {
      rmSync(distDir, { recursive: true, force: true });
    } catch {
      const quarantined = join(root, `.next.permission-blocked-${Date.now()}`);
      renameSync(distDir, quarantined);
      console.warn(`[build] Moved non-writable .next aside: ${quarantined}`);
    }
  }

  mkdirSync(distDir, { recursive: true });
  chmodSync(distDir, 0o777);
  for (const dir of writableDirs) {
    const fullPath = join(distDir, dir);
    mkdirSync(fullPath, { recursive: true });
    chmodSync(fullPath, 0o777);
  }
  for (const file of writableFiles) {
    const fullPath = join(distDir, file);
    closeSync(openSync(fullPath, "a", 0o666));
    chmodSync(fullPath, 0o666);
  }
  applyBuildAcl();
  accessSync(distDir, constants.W_OK);
}

try {
  ensureWritableDistDir();
} catch (error) {
  console.error("[build] Unable to prepare writable .next directory.");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
