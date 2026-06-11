/**
 * File Walker Utility
 *
 * Recursive file discovery using Node.js built-in `fs.readdir` with
 * `recursive: true`. Supports brace expansion in glob patterns like
 * `src/{pages,components}/**\/*.{ts,tsx}` with no external dependencies.
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';

/**
 * Expand brace expressions in a pattern into a flat list of patterns.
 * Handles single-level brace groups like `{ts,tsx}` or `{pages,components}`.
 * Nested braces are expanded iteratively.
 *
 * Examples:
 *   expandBraces('src/{a,b}/**\/*.{ts,tsx}')
 *   → ['src/a/**\/*.ts', 'src/a/**\/*.tsx', 'src/b/**\/*.ts', 'src/b/**\/*.tsx']
 */
function expandBraces(pattern: string): string[] {
  const braceOpen = pattern.indexOf('{');
  if (braceOpen === -1) {
    return [pattern];
  }

  const braceClose = pattern.indexOf('}', braceOpen);
  if (braceClose === -1) {
    // Malformed pattern — treat as literal
    return [pattern];
  }

  const prefix = pattern.slice(0, braceOpen);
  const suffix = pattern.slice(braceClose + 1);
  const alternatives = pattern.slice(braceOpen + 1, braceClose).split(',');

  const results: string[] = [];
  for (const alt of alternatives) {
    // Recursively expand any remaining brace groups in the combined string
    const expanded = expandBraces(prefix + alt + suffix);
    results.push(...expanded);
  }

  return results;
}

/**
 * Convert a simple glob-style pattern segment to a RegExp.
 * Supports `**` (any path depth), `*` (any file/dir name), `?` (single char).
 *
 * The pattern is matched against the *full relative path* of each file,
 * using forward slashes regardless of the OS path separator.
 */
function globToRegExp(pattern: string): RegExp {
  // Normalise to forward slashes
  const normalised = pattern.replace(/\\/g, '/');

  let regexStr = '';
  let i = 0;
  while (i < normalised.length) {
    const char = normalised[i];
    if (char === '*' && normalised[i + 1] === '*') {
      // `**` matches any number of characters including `/`
      regexStr += '.*';
      i += 2;
      // Skip a following slash so `**/` doesn't leave an extra `/`
      if (normalised[i] === '/') {
        regexStr += '(?:.*/)?';
        i += 1;
      }
    } else if (char === '*') {
      // `*` matches anything except `/`
      regexStr += '[^/]*';
      i += 1;
    } else if (char === '?') {
      regexStr += '[^/]';
      i += 1;
    } else if ('.+^${}()|[]\\'.includes(char)) {
      // Escape regex meta-characters
      regexStr += '\\' + char;
      i += 1;
    } else {
      regexStr += char;
      i += 1;
    }
  }

  return new RegExp('^' + regexStr + '$');
}

/**
 * Recursively walk `rootDir` and return all file paths (absolute) that match
 * at least one of the supplied glob `patterns`.
 *
 * Patterns are resolved relative to `rootDir`, so a pattern of
 * `src/pages/**\/*.tsx` is matched against paths like `src/pages/Home.tsx`.
 *
 * @param rootDir  - Absolute or relative path to the directory to scan.
 * @param patterns - Array of glob patterns relative to `rootDir`.
 * @returns        - Array of absolute file paths matching any pattern.
 *                   Returns an empty array if `rootDir` does not exist.
 */
export async function walkFiles(
  rootDir: string,
  patterns: string[]
): Promise<string[]> {
  // Resolve rootDir to an absolute path so we can produce consistent results
  // regardless of how the caller passes it.
  const absoluteRoot = path.resolve(rootDir);

  // Check that the directory exists; return gracefully if not.
  try {
    const stat = await fs.stat(absoluteRoot);
    if (!stat.isDirectory()) {
      process.stderr.write(
        `[file-walker] WARNING: "${absoluteRoot}" is not a directory — skipping.\n`
      );
      return [];
    }
  } catch {
    process.stderr.write(
      `[file-walker] WARNING: Directory "${absoluteRoot}" does not exist — skipping.\n`
    );
    return [];
  }

  // Expand all brace expressions so we have a flat list of simple patterns,
  // then compile each to a RegExp.
  const regexps: RegExp[] = patterns
    .flatMap(expandBraces)
    .map(globToRegExp);

  // Use Node.js built-in recursive readdir (available since Node 18.17 / 20.x).
  // `withFileTypes: true` lets us skip directories without extra stat calls.
  let entries: fs.Dirent[];
  try {
    // The `recursive` option is available from Node 18.17+.
    // Cast needed because older @types/node stubs may not include it yet.
    entries = await (fs.readdir as (
      path: string,
      options: { withFileTypes: true; recursive: true }
    ) => Promise<fs.Dirent[]>)(absoluteRoot, {
      withFileTypes: true,
      recursive: true,
    });
  } catch (err) {
    process.stderr.write(
      `[file-walker] WARNING: Failed to read directory "${absoluteRoot}": ${(err as Error).message}\n`
    );
    return [];
  }

  const matched: string[] = [];

  for (const entry of entries) {
    if (!entry.isFile()) {
      continue;
    }

    // Build the relative path from rootDir, using forward slashes for pattern matching.
    // `entry.parentPath` is the directory containing the entry (Node 20.1+).
    // Fall back to `entry.path` for earlier Node 18 versions.
    const parentPath: string =
      (entry as fs.Dirent & { parentPath?: string }).parentPath ??
      (entry as fs.Dirent & { path?: string }).path ??
      absoluteRoot;

    const absFilePath = path.join(parentPath, entry.name);
    const relFilePath = path
      .relative(absoluteRoot, absFilePath)
      .replace(/\\/g, '/');

    // Test against all compiled regexps; include on first match.
    const matches = regexps.some((re) => re.test(relFilePath));
    if (matches) {
      matched.push(absFilePath);
    }
  }

  return matched;
}
