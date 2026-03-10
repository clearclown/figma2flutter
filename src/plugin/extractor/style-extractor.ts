import { IRBoxStyle, IRFill, IRStroke, IRBorderRadius } from '../../ir/schema';
import { TokenExtractor } from './token-extractor';

/** Minimal type for nodes from which we can extract box styles */
type StylableNode = {
  fills: readonly Paint[] | typeof figma.mixed;
  strokes: readonly Paint[];
  strokeWeight: number | typeof figma.mixed;
  strokeAlign: string;
  cornerRadius?: number | typeof figma.mixed;
  topLeftRadius?: number;
  topRightRadius?: number;
  bottomRightRadius?: number;
  bottomLeftRadius?: number;
};

/**
 * Extract visual style properties from a Figma node.
 * Supports fills, strokes, effects, and border radius.
 */
export function extractBoxStyle(
  node: StylableNode,
  tokens: TokenExtractor,
): IRBoxStyle {
  const fills = extractFills(node, tokens);
  const strokes = extractStrokes(node, tokens);
  const borderRadius = extractBorderRadius(node);

  return {
    fills,
    strokes,
    effects: [],
    borderRadius,
  };
}

function extractFills(
  node: StylableNode,
  tokens: TokenExtractor,
): IRFill[] {
  const fills: IRFill[] = [];

  if (!Array.isArray(node.fills)) return fills;

  for (const paint of node.fills) {
    if (paint.visible === false) continue;

    if (paint.type === 'SOLID') {
      const colorRef = tokens.registerColor(
        paint.color.r,
        paint.color.g,
        paint.color.b,
        paint.opacity ?? 1,
      );
      fills.push({
        type: 'SOLID',
        colorRef,
        opacity: paint.opacity ?? 1,
      });
    } else if (
      (paint.type === 'GRADIENT_LINEAR' || paint.type === 'GRADIENT_RADIAL') &&
      (paint as GradientPaint).gradientStops
    ) {
      const gPaint = paint as GradientPaint;
      const gradientStops = gPaint.gradientStops.map(
        (stop: ColorStop) => {
          const colorRef = tokens.registerColor(
            stop.color.r,
            stop.color.g,
            stop.color.b,
            stop.color.a,
          );
          return { colorRef, position: Math.round(stop.position * 1000) / 1000 };
        },
      );
      const irType = paint.type === 'GRADIENT_LINEAR' ? 'LINEAR_GRADIENT' : 'RADIAL_GRADIENT';
      const fill: IRFill = {
        type: irType,
        opacity: paint.opacity ?? 1,
        gradientStops,
      };
      if (gPaint.gradientTransform) {
        fill.gradientHandlePositions = gradientTransformToHandles(gPaint.gradientTransform);
      }
      fills.push(fill);
    }
  }

  return fills;
}

function extractStrokes(
  node: StylableNode,
  tokens: TokenExtractor,
): IRStroke[] {
  const strokes: IRStroke[] = [];

  if (!Array.isArray(node.strokes)) return strokes;

  for (const paint of node.strokes) {
    if (paint.type === 'SOLID' && paint.visible !== false) {
      const colorRef = tokens.registerColor(
        paint.color.r,
        paint.color.g,
        paint.color.b,
        paint.opacity ?? 1,
      );
      const weight = typeof node.strokeWeight === 'number' ? node.strokeWeight : 1;
      strokes.push({
        colorRef,
        weight,
        align: mapStrokeAlign(node.strokeAlign),
      });
    }
  }

  return strokes;
}

function mapStrokeAlign(align: string | undefined): 'INSIDE' | 'OUTSIDE' | 'CENTER' {
  switch (align) {
    case 'INSIDE':
      return 'INSIDE';
    case 'OUTSIDE':
      return 'OUTSIDE';
    default:
      return 'CENTER';
  }
}

/**
 * Convert Figma's 2x3 gradient transform matrix to start/end handle positions.
 * The transform maps from gradient space (0,0)-(1,0) to node space (0,0)-(1,1).
 */
function gradientTransformToHandles(
  transform: Transform,
): { x: number; y: number }[] {
  const [[a, c, e], [b, d, f]] = transform;
  // Start point: transform applied to (0, 0.5)
  const startX = c * 0.5 + e;
  const startY = d * 0.5 + f;
  // End point: transform applied to (1, 0.5)
  const endX = a + c * 0.5 + e;
  const endY = b + d * 0.5 + f;
  return [
    { x: Math.round(startX * 1000) / 1000, y: Math.round(startY * 1000) / 1000 },
    { x: Math.round(endX * 1000) / 1000, y: Math.round(endY * 1000) / 1000 },
  ];
}

function extractBorderRadius(node: StylableNode): IRBorderRadius {
  // Check for individual corner radii first
  if (
    node.topLeftRadius !== undefined &&
    node.topRightRadius !== undefined &&
    node.bottomRightRadius !== undefined &&
    node.bottomLeftRadius !== undefined
  ) {
    return {
      topLeft: node.topLeftRadius,
      topRight: node.topRightRadius,
      bottomRight: node.bottomRightRadius,
      bottomLeft: node.bottomLeftRadius,
    };
  }

  // Uniform corner radius
  const radius = typeof node.cornerRadius === 'number' ? node.cornerRadius : 0;
  return {
    topLeft: radius,
    topRight: radius,
    bottomRight: radius,
    bottomLeft: radius,
  };
}
