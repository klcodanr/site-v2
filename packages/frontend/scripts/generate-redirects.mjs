import { mkdir, writeFile } from "fs/promises";
import { dirname, join } from "path";
import redirects from "./redirects.mjs";

/**
 * @param {string} source
 * @param {string} target
 */
function template(source, target) {
  return `<!doctype html><title>Redirecting to: ${target}</title><meta content="0;url=${target}" http-equiv=refresh><meta content=noindex name=robots><link href=${target} rel=canonical><body><a href="${target}">Redirecting from <code>${source}</code> to <code>${target}</code></a></body>`;
}

/**
 * @param {string} source
 * @param {string} target
 */
async function generateRedirect(source, target) {
  console.log(`Generating redirect from ${source} to ${target}`);
  let redirectFile;
  if (source.endsWith(".html")) {
    await mkdir(join("dist", dirname(source)), { recursive: true });
    redirectFile = join("dist", source);
  } else {
    await mkdir(join("dist", source), { recursive: true });
    redirectFile = join("dist", source, "index.html");
  }
  console.log(`Writing file to ${redirectFile}`);
  await writeFile(redirectFile, template(source, target));
    
}

console.log(`Generating ${Object.keys(redirects).length} redirects`);
await Promise.all(
  Object.entries(redirects).map(async ([source, target]) => {
    await generateRedirect(source, target);
  })
);
console.log("Redirects generated");
