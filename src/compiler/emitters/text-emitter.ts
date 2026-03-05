import { IRTextNode } from '../../ir/schema';
import { tokenKeyToDartName } from '../../plugin/utils/color-utils';
import { formatDart } from '../dart-formatter';

export interface TextEmitterConfig {
  colorClassName: string;
  typographyClassName: string;
}

const DEFAULT_CONFIG: TextEmitterConfig = {
  colorClassName: 'AppColors',
  typographyClassName: 'AppTypography',
};

export function emitText(
  node: IRTextNode,
  config: TextEmitterConfig = DEFAULT_CONFIG,
): string {
  // Use RichText for multi-segment text (mixed styles)
  if (node.segments && node.segments.length > 1) {
    return emitRichText(node, config);
  }

  const typeName = tokenKeyToDartName(node.typographyRef);
  const colorName = tokenKeyToDartName(node.colorRef);
  const textAlign = mapTextAlign(node.textAlign);

  // Escape single quotes in text
  const escapedText = node.characters.replace(/'/g, "\\'");

  const parts: string[] = [];
  parts.push('Text(');
  parts.push(`  '${escapedText}',`);
  parts.push(`  style: ${config.typographyClassName}.${typeName}.copyWith(`);
  parts.push(`    color: ${config.colorClassName}.${colorName},`);
  parts.push(`  ),`);
  parts.push(`  textAlign: TextAlign.${textAlign},`);
  parts.push(')');

  return formatDart(parts.join('\n'));
}

function emitRichText(
  node: IRTextNode,
  config: TextEmitterConfig,
): string {
  const textAlign = mapTextAlign(node.textAlign);
  const defaultTypeName = tokenKeyToDartName(node.typographyRef);
  const defaultColorName = tokenKeyToDartName(node.colorRef);

  const spans = node.segments!.map(seg => {
    const escapedText = seg.characters.replace(/'/g, "\\'");
    const typeName = tokenKeyToDartName(seg.typographyRef);
    const colorName = tokenKeyToDartName(seg.colorRef);
    return [
      '      TextSpan(',
      `        text: '${escapedText}',`,
      `        style: ${config.typographyClassName}.${typeName}.copyWith(`,
      `          color: ${config.colorClassName}.${colorName},`,
      '        ),',
      '      ),',
    ].join('\n');
  });

  const parts: string[] = [];
  parts.push('RichText(');
  parts.push(`  textAlign: TextAlign.${textAlign},`);
  parts.push('  text: TextSpan(');
  parts.push(`    style: ${config.typographyClassName}.${defaultTypeName}.copyWith(`);
  parts.push(`      color: ${config.colorClassName}.${defaultColorName},`);
  parts.push('    ),');
  parts.push('    children: [');
  parts.push(spans.join('\n'));
  parts.push('    ],');
  parts.push('  ),');
  parts.push(')');

  return formatDart(parts.join('\n'));
}

function mapTextAlign(align: IRTextNode['textAlign']): string {
  switch (align) {
    case 'LEFT':
      return 'left';
    case 'CENTER':
      return 'center';
    case 'RIGHT':
      return 'right';
    case 'JUSTIFIED':
      return 'justify';
  }
}
