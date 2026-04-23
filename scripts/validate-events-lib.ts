import { parseTree, createScanner, SyntaxKind } from "jsonc-parser";

export function findExtraRootValueOffset(raw: string): number | null {
  const tree = parseTree(raw, [], { allowTrailingComma: true });
  if (!tree) return null;
  const firstEnd = tree.offset + tree.length;
  const remainder = raw.substring(firstEnd);
  const scanner = createScanner(remainder, true);
  const kind = scanner.scan();
  if (kind === SyntaxKind.EOF) return null;
  return firstEnd + scanner.getTokenOffset();
}
