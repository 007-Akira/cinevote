import { mkdir, readdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const sourceDir = path.join(process.cwd(), "posters");
const outputDir = path.join(process.cwd(), "public", "intro-posters");
const dataFile = path.join(process.cwd(), "src", "data", "introPosters.ts");
const supportedExtensions = new Set([
  ".avif",
  ".jpeg",
  ".jpg",
  ".png",
  ".webp",
]);

async function collectImages(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        return collectImages(entryPath);
      }

      if (!entry.isFile()) {
        return [];
      }

      const extension = path.extname(entry.name).toLowerCase();

      return supportedExtensions.has(extension) ? [entryPath] : [];
    }),
  );

  return files.flat().sort((a, b) => a.localeCompare(b));
}

function formatPosterName(index) {
  return `poster-${String(index + 1).padStart(2, "0")}.webp`;
}

async function main() {
  await mkdir(outputDir, { recursive: true });

  const sourcePosters = await collectImages(sourceDir);

  if (!sourcePosters.length) {
    throw new Error(`No poster images found in ${sourceDir}`);
  }

  await rm(outputDir, { force: true, recursive: true });
  await mkdir(outputDir, { recursive: true });

  const results = [];

  for (const [index, source] of sourcePosters.entries()) {
    const output = path.join(outputDir, formatPosterName(index));

    await sharp(source)
      .rotate()
      .resize({
        width: 480,
        height: 720,
        fit: "cover",
        position: "attention",
        withoutEnlargement: true,
      })
      .webp({
        effort: 5,
        quality: 68,
        smartSubsample: true,
      })
      .toFile(output);

    const [{ size: sourceSize }, { size: outputSize }] = await Promise.all([
      stat(source),
      stat(output),
    ]);

    results.push({
      source: path.relative(process.cwd(), source),
      output: path.relative(process.cwd(), output),
      sourceSize,
      outputSize,
    });
  }

  const sourceTotal = results.reduce((total, item) => total + item.sourceSize, 0);
  const outputTotal = results.reduce((total, item) => total + item.outputSize, 0);
  const savedPercent = Math.round((1 - outputTotal / sourceTotal) * 100);
  const posterPaths = results.map(
    (_, index) => `/intro-posters/${formatPosterName(index)}`,
  );

  await writeFile(
    dataFile,
    `${[
      "export const introPosters = [",
      ...posterPaths.map((posterPath) => `  "${posterPath}",`),
      "] as const;",
      "",
      "export const introPosterCount = introPosters.length;",
      "",
    ].join("\n")}`,
  );

  console.log(`Prepared ${results.length} intro posters.`);
  console.log(`Original total: ${formatBytes(sourceTotal)}`);
  console.log(`Compressed total: ${formatBytes(outputTotal)}`);
  console.log(`Saved: ${savedPercent}%`);

  for (const item of results) {
    console.log(
      `${item.output} (${formatBytes(item.outputSize)}) <= ${item.source}`,
    );
  }
}

function formatBytes(bytes) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
