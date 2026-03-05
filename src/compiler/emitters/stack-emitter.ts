import { IRNode } from '../../ir/schema';
import { formatDart, indent } from '../dart-formatter';

export interface StackEmitterConfig {
  compileNode: (node: IRNode) => string;
}

/** Nodes that can be rendered as a Stack (GROUP, FRAME with mode=NONE) */
export interface StackableNode {
  size: { width: number; height: number };
  children: IRNode[];
}

export function emitStack(node: StackableNode, config: StackEmitterConfig): string {
  // Build positioned children
  const childCodes: string[] = [];
  for (const child of node.children) {
    const childCode = config.compileNode(child).trimEnd();
    const pos = child.position;

    if (pos) {
      childCodes.push(wrapInPositioned(pos, childCode));
    } else {
      childCodes.push(childCode);
    }
  }

  // Build Stack widget
  const indentedChildren = childCodes.map(c => indent(c, 2) + ',').join('\n');
  const stackCode = `Stack(\n  children: [\n${indentedChildren}\n  ],\n)`;

  // Wrap in SizedBox for explicit dimensions
  const indentedStack = indent(stackCode, 1);
  const result = `SizedBox(\n  width: ${node.size.width},\n  height: ${node.size.height},\n  child: ${indentedStack.trimStart()},\n)`;

  return formatDart(result);
}

function wrapInPositioned(
  pos: { x: number; y: number },
  childCode: string,
): string {
  const indentedChild = indent(childCode, 1);
  return `Positioned(\n  left: ${pos.x},\n  top: ${pos.y},\n  child: ${indentedChild.trimStart()},\n)`;
}
