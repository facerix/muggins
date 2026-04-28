import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { cwd } from 'node:process';

/**
 * Lets glue modules use `/src/...` and `/components/...` (browser-style) while running under Node.
 */
export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('/src/') || specifier.startsWith('/components/')) {
    const abs = path.join(cwd(), specifier.slice(1));
    return { url: pathToFileURL(abs).href, shortCircuit: true };
  }
  return nextResolve(specifier, context);
}
