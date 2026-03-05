import { IRTextNode, IRNodeBase, IRTypographyToken } from '../../ir/schema';
import { TokenExtractor } from './token-extractor';

/**
 * Extract text properties from a Figma TextNode into an IRTextNode.
 */
export function extractText(
  node: TextNode,
  base: IRNodeBase,
  tokens: TokenExtractor,
): IRTextNode {
  // Register typography token
  const typographyRef = tokens.registerTypography(
    getFontFamily(node),
    getFontWeight(node),
    getFontSize(node),
    getLineHeight(node),
    getLetterSpacing(node),
  );

  // Register text color
  const colorRef = extractTextColor(node, tokens);

  return {
    ...base,
    type: 'TEXT',
    characters: node.characters,
    typographyRef,
    colorRef,
    textAlign: mapTextAlign(node.textAlignHorizontal),
    verticalAlign: mapVerticalAlign(node.textAlignVertical),
  };
}

function extractTextColor(node: TextNode, tokens: TokenExtractor): string {
  // Get the first solid fill color
  if (Array.isArray(node.fills)) {
    for (const paint of node.fills as Paint[]) {
      if (paint.type === 'SOLID' && paint.visible !== false) {
        return tokens.registerColor(
          paint.color.r,
          paint.color.g,
          paint.color.b,
          paint.opacity ?? 1,
        );
      }
    }
  }
  // Default to black if no fill found
  return tokens.registerColor(0, 0, 0, 1);
}

function getFontFamily(node: TextNode): string {
  const fontName = node.fontName;
  if (fontName === figma.mixed) return 'Inter';
  return fontName.family;
}

function getFontWeight(node: TextNode): number {
  const fontName = node.fontName;
  if (fontName === figma.mixed) return 400;
  return mapFontStyleToWeight(fontName.style);
}

function getFontSize(node: TextNode): number {
  const size = node.fontSize;
  if (size === figma.mixed) return 14;
  return size;
}

function getLineHeight(node: TextNode): IRTypographyToken['lineHeight'] {
  const lh = node.lineHeight;
  if (lh === figma.mixed) return { unit: 'AUTO', value: 0 };

  if (lh.unit === 'AUTO') {
    return { unit: 'AUTO', value: 0 };
  }
  if (lh.unit === 'PIXELS') {
    return { unit: 'PIXELS', value: lh.value };
  }
  // PERCENT
  return { unit: 'PERCENT', value: lh.value };
}

function getLetterSpacing(node: TextNode): IRTypographyToken['letterSpacing'] {
  const ls = node.letterSpacing;
  if (ls === figma.mixed) return { unit: 'PIXELS', value: 0 };

  if (ls.unit === 'PIXELS') {
    return { unit: 'PIXELS', value: ls.value };
  }
  return { unit: 'PERCENT', value: ls.value };
}

function mapTextAlign(
  align: string,
): 'LEFT' | 'CENTER' | 'RIGHT' | 'JUSTIFIED' {
  switch (align) {
    case 'CENTER':
      return 'CENTER';
    case 'RIGHT':
      return 'RIGHT';
    case 'JUSTIFIED':
      return 'JUSTIFIED';
    default:
      return 'LEFT';
  }
}

function mapVerticalAlign(
  align: string,
): 'TOP' | 'CENTER' | 'BOTTOM' {
  switch (align) {
    case 'CENTER':
      return 'CENTER';
    case 'BOTTOM':
      return 'BOTTOM';
    default:
      return 'TOP';
  }
}

/** Map a Figma font style string (e.g. "Bold", "SemiBold") to a numeric weight */
function mapFontStyleToWeight(style: string): number {
  const lower = style.toLowerCase();
  if (lower.includes('thin') || lower.includes('hairline')) return 100;
  if (lower.includes('extralight') || lower.includes('ultralight')) return 200;
  if (lower.includes('light')) return 300;
  if (lower.includes('medium')) return 500;
  if (lower.includes('semibold') || lower.includes('demibold')) return 600;
  if (lower.includes('extrabold') || lower.includes('ultrabold')) return 800;
  if (lower.includes('bold')) return 700; // must come after extrabold/semibold
  if (lower.includes('black') || lower.includes('heavy')) return 900;
  return 400; // Regular/Normal
}
