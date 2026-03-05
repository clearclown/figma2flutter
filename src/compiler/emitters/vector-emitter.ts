import { IRVectorNode } from '../../ir/schema';
import { formatDart } from '../dart-formatter';

/**
 * Emit Flutter code for VECTOR nodes.
 *
 * Rendering strategy (priority order):
 * 1. svgString present → SvgPicture.string()
 * 2. vectorPaths present → CustomPaint with path painter
 * 3. Neither → comment fallback
 */
export function emitVector(node: IRVectorNode): string {
  if (node.svgString) {
    return emitSvgPicture(node);
  }

  if (node.vectorPaths && node.vectorPaths.length > 0) {
    return emitCustomPaint(node);
  }

  return formatDart(`// Vector node: ${node.name} (no SVG data available)\n`);
}

function emitSvgPicture(node: IRVectorNode): string {
  const parts: string[] = [];
  parts.push('SvgPicture.string(');
  parts.push("  '''");
  // Indent each line of SVG
  const svgLines = node.svgString!.split('\n');
  for (const line of svgLines) {
    parts.push(`  ${line}`);
  }
  parts.push("  ''',");
  parts.push(`  width: ${node.size.width},`);
  parts.push(`  height: ${node.size.height},`);
  parts.push(')');
  return formatDart(parts.join('\n'));
}

function emitCustomPaint(node: IRVectorNode): string {
  const name = toPascalCase(node.name);
  const parts: string[] = [];
  parts.push('CustomPaint(');
  parts.push(`  size: Size(${node.size.width}, ${node.size.height}),`);
  parts.push(`  painter: _${name}Painter(),`);
  parts.push(')');
  return formatDart(parts.join('\n'));
}

function toPascalCase(name: string): string {
  return name
    .split(/[\s\-_\/\.]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}
