import { IRImageNode, IRBorderRadius } from '../../ir/schema';
import { formatDart, indent } from '../dart-formatter';

export function emitImage(node: IRImageNode): string {
  const imageCode = buildImageAsset(node);

  // Wrap in ClipRRect if has border radius
  const br = node.style.borderRadius;
  if (hasBorderRadius(br)) {
    const radiusStr = emitBorderRadius(br);
    const indentedImage = indent(imageCode, 1);
    return formatDart(
      `ClipRRect(\n  borderRadius: ${radiusStr},\n  child: ${indentedImage.trimStart()},\n)`,
    );
  }

  return formatDart(imageCode);
}

function buildImageAsset(node: IRImageNode): string {
  const fit = mapScaleMode(node.scaleMode);
  const parts: string[] = [];
  parts.push('Image.asset(');
  parts.push(`  'assets/images/${node.imageRef}.png',`);
  parts.push(`  width: ${node.size.width},`);
  parts.push(`  height: ${node.size.height},`);
  parts.push(`  fit: BoxFit.${fit},`);
  parts.push(')');
  return parts.join('\n');
}

function mapScaleMode(mode: IRImageNode['scaleMode']): string {
  switch (mode) {
    case 'FILL':
      return 'cover';
    case 'FIT':
      return 'contain';
    case 'CROP':
      return 'cover';
    case 'TILE':
      return 'none';
  }
}

function hasBorderRadius(br: IRBorderRadius): boolean {
  return br.topLeft > 0 || br.topRight > 0 || br.bottomRight > 0 || br.bottomLeft > 0;
}

function emitBorderRadius(br: IRBorderRadius): string {
  if (
    br.topLeft === br.topRight &&
    br.topRight === br.bottomRight &&
    br.bottomRight === br.bottomLeft
  ) {
    return `BorderRadius.all(Radius.circular(${br.topLeft}))`;
  }

  const parts: string[] = [];
  if (br.topLeft > 0) parts.push(`topLeft: Radius.circular(${br.topLeft})`);
  if (br.topRight > 0) parts.push(`topRight: Radius.circular(${br.topRight})`);
  if (br.bottomRight > 0) parts.push(`bottomRight: Radius.circular(${br.bottomRight})`);
  if (br.bottomLeft > 0) parts.push(`bottomLeft: Radius.circular(${br.bottomLeft})`);
  return `BorderRadius.only(${parts.join(', ')})`;
}
