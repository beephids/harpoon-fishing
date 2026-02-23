import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const distDir = path.join(rootDir, 'dist');
const publicDir = path.join(rootDir, 'assets');

function fail(message) {
    console.error(`\n[verify-pages] ${message}`);
    process.exit(1);
}

function walkFiles(dir, relativeBase = '') {
    if (!fs.existsSync(dir)) {
        return [];
    }

    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const files = [];

    for (const entry of entries) {
        const relativePath = relativeBase
            ? path.posix.join(relativeBase, entry.name)
            : entry.name;
        const absolutePath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            files.push(...walkFiles(absolutePath, relativePath));
            continue;
        }

        if (entry.isFile()) {
            files.push(relativePath);
        }
    }

    return files;
}

if (!fs.existsSync(distDir)) {
    fail('`dist` directory is missing. Run `npm run build` before verification.');
}

const indexPath = path.join(distDir, 'index.html');
if (!fs.existsSync(indexPath)) {
    fail('`dist/index.html` is missing.');
}

const indexHtml = fs.readFileSync(indexPath, 'utf8');
const htmlUrls = [...indexHtml.matchAll(/\b(?:src|href)=["']([^"']+)["']/g)]
    .map((match) => match[1])
    .filter((url) => !url.startsWith('http://')
        && !url.startsWith('https://')
        && !url.startsWith('data:')
        && !url.startsWith('#'));

const rootAbsoluteUrls = htmlUrls.filter((url) => url.startsWith('/'));
if (rootAbsoluteUrls.length > 0) {
    fail(
        `Found root-absolute URLs in dist/index.html: ${rootAbsoluteUrls.join(', ')}. `
        + 'This usually breaks repository-based GitHub Pages deployments.',
    );
}

const missingHtmlReferences = [];
for (const url of htmlUrls) {
    const cleanUrl = url.split('#')[0].split('?')[0];
    const relativePath = cleanUrl.replace(/^\.\//, '');

    if (!relativePath || relativePath.endsWith('/')) {
        continue;
    }

    const targetPath = path.join(distDir, relativePath.split('/').join(path.sep));
    if (!fs.existsSync(targetPath)) {
        missingHtmlReferences.push(url);
    }
}

if (missingHtmlReferences.length > 0) {
    fail(`dist/index.html points to files missing from dist: ${missingHtmlReferences.join(', ')}`);
}

if (fs.existsSync(publicDir)) {
    const publicFiles = walkFiles(publicDir);
    const missingPublicFiles = publicFiles.filter(
        (relativePath) => !fs.existsSync(path.join(distDir, relativePath.split('/').join(path.sep))),
    );

    if (missingPublicFiles.length > 0) {
        fail(`Public assets were not copied to dist: ${missingPublicFiles.join(', ')}`);
    }
}

console.log('[verify-pages] Build output passed GitHub Pages checks.');
