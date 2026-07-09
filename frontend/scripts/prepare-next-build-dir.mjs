import { accessSync, chmodSync, constants, existsSync, mkdirSync, renameSync, rmSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const distDir = join(root, ".next");

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
  accessSync(distDir, constants.W_OK);
}

try {
  ensureWritableDistDir();
} catch (error) {
  console.error("[build] Unable to prepare writable .next directory.");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
