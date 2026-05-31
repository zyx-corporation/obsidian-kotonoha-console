/** Target note resolution for apply — testable without Obsidian (#40). */
export function resolveTargetFilePath(
  activePath: string | null,
  storedTargetPath: string | null,
  vaultHasPath: (path: string) => boolean,
): string | null {
  if (activePath && (!storedTargetPath || activePath === storedTargetPath)) {
    return activePath;
  }
  if (storedTargetPath && vaultHasPath(storedTargetPath)) {
    return storedTargetPath;
  }
  return activePath;
}

export function sourceHashMismatch(
  hashAtGeneration: string | null | undefined,
  currentHash: string | null | undefined,
): boolean {
  if (!hashAtGeneration || !currentHash) return false;
  return hashAtGeneration !== currentHash;
}
