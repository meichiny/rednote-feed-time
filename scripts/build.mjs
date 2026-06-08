import fs from 'fs/promises';
import path from 'path';
import { createWriteStream, existsSync } from 'fs';
import { ZipArchive } from 'archiver';

const TARGET = process.argv[2];

if (!TARGET || !['chrome', 'firefox'].includes(TARGET)) {
  console.error('Usage: node scripts/build.mjs [chrome|firefox]');
  process.exit(1);
}

const SRC = 'src';
const DIST = `dist/${TARGET}`;
const PACKAGES = 'dist/packages';

async function copyFile(src, dest) {
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.copyFile(src, dest);
}

async function build(target) {
  const manifestPath = path.join(SRC, `manifest.${target}.json`);

  const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf-8'));
  const { version } = manifest;

  await fs.rm(DIST, { recursive: true, force: true });
  await fs.mkdir(DIST, { recursive: true });
  await fs.mkdir(PACKAGES, { recursive: true });

  await copyFile(manifestPath, path.join(DIST, 'manifest.json'));
  await copyFile(path.join(SRC, 'content.js'), path.join(DIST, 'content.js'));
  await copyFile(path.join(SRC, 'popup.html'), path.join(DIST, 'popup.html'));
  await copyFile(path.join(SRC, 'popup.js'), path.join(DIST, 'popup.js'));
  await copyFile(path.join(SRC, 'icon.png'), path.join(DIST, 'icon.png'));
  await copyFile(path.join(SRC, 'icon16.png'), path.join(DIST, 'icon16.png'));
  await copyFile(path.join(SRC, 'icon48.png'), path.join(DIST, 'icon48.png'));
  if (existsSync('LICENSE')) {
    await copyFile('LICENSE', path.join(DIST, 'LICENSE'));
  }

  const zipName = target === 'chrome'
    ? `rednote-feed-time-chrome-v${version}.zip`
    : `rednote-feed-time-firefox-v${version}.xpi`;
  const zipPath = path.join(PACKAGES, zipName);

  const archive = new ZipArchive();
  const stream = createWriteStream(zipPath);
  archive.pipe(stream);
  archive.directory(DIST, false);
  await archive.finalize();

  console.log(`✓ Built ${target} extension v${version}`);
  console.log(`  Directory: ${DIST}/`);
  console.log(`  Package:   ${zipPath}`);
}

build(TARGET).catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});
