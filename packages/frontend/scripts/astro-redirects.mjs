import { mkdir, readFile, writeFile, readdir, stat } from "fs/promises";
import { dirname, join, relative, sep } from "path";
import { fileURLToPath } from "url";
import yaml from "js-yaml";

export const roots = ["src/content", "src/pages"];

/**
 * Get a list of content files (markdown and MDX) recursively from a directory.
 * @param {string} directory
 * @returns {Promise<string[]>}
 */
export async function getContentFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const path = `${directory}/${entry.name}`;
    if (entry.isDirectory()) {
      files.push(...(await getContentFiles(path)));
    } else if (/\.(?:md|mdx)$/.test(entry.name)) {
      files.push(path);
    }
  }

  return files;
}

/**
 * Get the canonical path for a given file relative to its root.
 * @param {string} file
 * @param {string} root
 * @returns {string}
 */
export function canonicalPath(file, root) {
  const value = relative(root, file)
    .replace(/\.(?:md|mdx)$/, "")
    .split(sep)
    .join("/");

  if (root === "src/pages") {
    return `/${value === "index" ? "" : value}/`;
  }

  const [collection, ...slug] = value.split("/");
  return `/${collection}/${slug.join("/")}/`;
}

/**
 * Parse the frontmatter from a markdown or MDX file.
 * @param {string} source
 * @returns {{ data: Record<string, unknown>, body: string, delimiter: string }}
 */
export function parseFrontmatter(source) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) return { data: {}, body: source };

  return {
    data: yaml.load(match[1]) ?? {},
    body: source.slice(match[0].length),
    delimiter: match[0].startsWith("---\r\n") ? "\r\n" : "\n",
  };
}

/**
 * Get a list of redirect sources from the frontmatter data.
 * @param {Record<string, unknown>} data
 * @returns {string[]}
 */
export function redirectList(data) {
  return Array.isArray(data.redirects) ? data.redirects.filter((value) => typeof value === "string") : [];
}

/**
 * Adds the redirect to the manifest.
 * @param {Map<string, string>} manifest
 * @param {string} source
 * @param {string} target
 */
export function addRedirect(manifest, source, target) {
  if (manifest.has(source) && manifest.get(source) !== target) {
    throw new Error(`Conflicting redirects for ${source}: ${manifest.get(source)} and ${target}`);
  }
  manifest.set(source, target);
}

async function outputPath(outDir, source) {
  const requested = source.endsWith(".html")
    ? join(outDir, source)
    : join(outDir, source, "index.html");

  if (!source.endsWith(".html")) return requested;

  try {
    if ((await stat(requested)).isDirectory()) return join(requested, "index.html");
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }

  return requested;
}

/**
 * Gets the map of redirects from the content files.
 * @returns {Promise<Map<string, string>>}
 */
export async function getRedirects() {
  const manifest = new Map();

  for (const root of roots) {
    for (const file of await getContentFiles(root)) {
      const { data } = parseFrontmatter(await readFile(file, "utf8"));
      const target = canonicalPath(file, root);
      for (const source of redirectList(data)) {
        addRedirect(manifest, source, target);
      }
    }
  }
  return manifest;
}

/**
 * Templates for redirect pages.
 * @param {string} source
 * @param {string} target
 * @returns {string}
 */
function template(source, target) {
  return `<!doctype html><title>Redirecting to: ${target}</title><meta content="0;url=${target}" http-equiv=refresh><meta content=noindex name=robots><link href="${target}" rel=canonical><body><a href="${target}">Redirecting from <code>${source}</code> to <code>${target}</code></a></body>`;
}


export default function astroRedirects() {
  return {
    name: "astro-redirects",
    hooks: {
      "astro:build:done": async ({ dir, logger }) => {
        const outDir = fileURLToPath(dir);
        const manifest = await getRedirects();
        for (const [source, target] of manifest) {
          const output = await outputPath(outDir, source);
          await mkdir(dirname(output), { recursive: true });
          await writeFile(output, template(source, target));
        }
        logger.info("astro-redirects", `Generated ${manifest.size} redirect pages`);
      },
    },
  };
}
