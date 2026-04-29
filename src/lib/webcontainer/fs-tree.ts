// Converters between flat path→content records and WebContainer's nested FileSystemTree shape.
//
// WebContainer expects:
//   { "package.json": { file: { contents: "..." } },
//     "src": { directory: { "App.tsx": { file: { contents: "..." } } } } }
//
// We store files flat ({ "src/App.tsx": "..." }) in the DB.

import type { FileSystemTree, DirectoryNode, FileNode } from "@webcontainer/api";

/**
 * Convert a flat {path: content} record to a nested WebContainer FileSystemTree.
 * Paths use forward slashes; no leading slash; no trailing slash.
 */
export function filesRecordToFsTree(files: Record<string, string>): FileSystemTree {
  const tree: FileSystemTree = {};
  for (const [path, content] of Object.entries(files)) {
    const segments = path.split("/").filter(Boolean);
    if (segments.length === 0) continue;
    let cursor: FileSystemTree = tree;
    for (let i = 0; i < segments.length - 1; i++) {
      const seg = segments[i];
      let node = cursor[seg] as DirectoryNode | undefined;
      if (!node || !("directory" in node)) {
        node = { directory: {} } as DirectoryNode;
        cursor[seg] = node;
      }
      cursor = node.directory as FileSystemTree;
    }
    const fileName = segments[segments.length - 1];
    const fileNode: FileNode = { file: { contents: content } };
    cursor[fileName] = fileNode;
  }
  return tree;
}
