import { workbenchStore } from '~/lib/stores/workbench';

export type InlineTextEditResult =
  | { status: 'applied'; filePath: string }
  | { status: 'not-found' }
  | { status: 'ambiguous'; count: number };

const IGNORED_PATH_SEGMENTS = ['/node_modules/', '/dist/', '/build/', '/.git/', 'package-lock.json'];

/*
 * Replaces the exact text of an element selected in the preview directly in the
 * project source, without an LLM round-trip. Only applies when the text occurs
 * exactly once across the project, so the edit is unambiguous.
 */
export async function applyInlineTextEdit(oldText: string, newText: string): Promise<InlineTextEditResult> {
  const files = workbenchStore.files.get();
  const matches: Array<{ filePath: string; content: string; occurrences: number }> = [];

  for (const [filePath, dirent] of Object.entries(files)) {
    if (dirent?.type !== 'file' || dirent.isBinary) {
      continue;
    }

    if (IGNORED_PATH_SEGMENTS.some((segment) => filePath.includes(segment))) {
      continue;
    }

    const occurrences = dirent.content.split(oldText).length - 1;

    if (occurrences > 0) {
      matches.push({ filePath, content: dirent.content, occurrences });
    }
  }

  const total = matches.reduce((sum, match) => sum + match.occurrences, 0);

  if (total === 0) {
    return { status: 'not-found' };
  }

  if (total > 1) {
    return { status: 'ambiguous', count: total };
  }

  const { filePath, content } = matches[0];
  await workbenchStore.updateFileContent(filePath, content.replace(oldText, newText));

  return { status: 'applied', filePath };
}
