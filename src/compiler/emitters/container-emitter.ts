import { IRRectangleNode, IRBoxStyle, IRBorderRadius, IRFill, IREffect } from '../../ir/schema';
import { tokenKeyToDartName } from '../../plugin/utils/color-utils';
import { formatDart, indent } from '../dart-formatter';

export interface ContainerEmitterConfig {
  colorClassName: string;
}

const DEFAULT_EMITTER_CONFIG: ContainerEmitterConfig = {
  colorClassName: 'AppColors',
};

export function emitContainer(
  node: IRRectangleNode,
  config: ContainerEmitterConfig = DEFAULT_EMITTER_CONFIG,
): string {
  const parts: string[] = [];

  parts.push('Container(');

  // Size
  parts.push(`  width: ${node.size.width},`);
  parts.push(`  height: ${node.size.height},`);

  // Decoration
  const decoration = emitBoxDecoration(node.style, config);
  if (decoration) {
    parts.push(`  decoration: ${decoration},`);
  }

  parts.push(')');

  return formatDart(parts.join('\n'));
}

function emitBoxDecoration(
  style: IRBoxStyle,
  config: ContainerEmitterConfig,
): string | null {
  const props: string[] = [];

  // Gradient fill takes precedence over solid fill
  const gradientFill = style.fills.find(
    (f): f is IRFill & { gradientStops: NonNullable<IRFill['gradientStops']> } =>
      (f.type === 'LINEAR_GRADIENT' || f.type === 'RADIAL_GRADIENT') &&
      f.gradientStops !== undefined && f.gradientStops.length > 0,
  );
  if (gradientFill) {
    const gradientCode = emitGradient(gradientFill, config);
    props.push(`    gradient: ${gradientCode},`);
  } else {
    // Color from first solid fill
    const solidFill = style.fills.find(
      (f): f is IRFill & { colorRef: string } =>
        f.type === 'SOLID' && f.colorRef !== undefined,
    );
    if (solidFill) {
      const colorName = tokenKeyToDartName(solidFill.colorRef);
      props.push(`    color: ${config.colorClassName}.${colorName},`);
    }
  }

  // Border radius
  const br = style.borderRadius;
  const radiusStr = emitBorderRadius(br);
  if (radiusStr) {
    props.push(`    borderRadius: ${radiusStr},`);
  }

  // Strokes
  if (style.strokes.length > 0) {
    const stroke = style.strokes[0];
    const colorName = tokenKeyToDartName(stroke.colorRef);
    props.push(`    border: Border.all(`);
    props.push(`      color: ${config.colorClassName}.${colorName},`);
    props.push(`      width: ${stroke.weight},`);
    props.push(`    ),`);
  }

  // Effects (shadows)
  const shadowCode = emitBoxShadows(style.effects, config);
  if (shadowCode) {
    props.push(`    boxShadow: ${shadowCode},`);
  }

  if (props.length === 0) return null;

  return `BoxDecoration(\n${props.join('\n')}\n  )`;
}

export function emitBoxShadows(
  effects: IREffect[],
  config: ContainerEmitterConfig,
): string | null {
  const shadows = effects.filter(e => e.type === 'DROP_SHADOW' && e.shadowRef);
  if (shadows.length === 0) return null;

  const shadowCodes = shadows.map(shadow => {
    const parts: string[] = [];
    if (shadow.shadowRef) {
      const colorName = tokenKeyToDartName(shadow.shadowRef);
      parts.push(`        color: ${config.colorClassName}.${colorName}`);
    }
    if (shadow.blurRadius && shadow.blurRadius > 0) {
      parts.push(`        blurRadius: ${shadow.blurRadius}`);
    }
    return `      BoxShadow(\n${parts.join(',\n')},\n      )`;
  });

  return `[\n${shadowCodes.join(',\n')},\n    ]`;
}

export function emitGradient(fill: IRFill, config: ContainerEmitterConfig): string {
  const stops = fill.gradientStops!;
  const colorsList = stops
    .map(s => `${config.colorClassName}.${tokenKeyToDartName(s.colorRef)}`)
    .join(', ');
  const stopsList = stops.map(s => s.position).join(', ');

  if (fill.type === 'LINEAR_GRADIENT') {
    const { begin, end } = computeLinearAlignment(fill.gradientHandlePositions);
    const parts: string[] = [];
    parts.push(`LinearGradient(`);
    parts.push(`      begin: ${begin},`);
    parts.push(`      end: ${end},`);
    parts.push(`      colors: [${colorsList}],`);
    parts.push(`      stops: [${stopsList}],`);
    parts.push(`    )`);
    return parts.join('\n');
  }

  // RADIAL_GRADIENT
  const parts: string[] = [];
  parts.push(`RadialGradient(`);
  parts.push(`      colors: [${colorsList}],`);
  parts.push(`      stops: [${stopsList}],`);
  parts.push(`    )`);
  return parts.join('\n');
}

function computeLinearAlignment(
  handles?: { x: number; y: number }[],
): { begin: string; end: string } {
  if (!handles || handles.length < 2) {
    return { begin: 'Alignment.topCenter', end: 'Alignment.bottomCenter' };
  }
  const toAlignment = (p: { x: number; y: number }): string => {
    // Figma handle positions are 0-1 normalized; Flutter Alignment is -1 to 1
    const ax = +(p.x * 2 - 1).toFixed(2);
    const ay = +(p.y * 2 - 1).toFixed(2);
    // Use named constants for common values
    const named = namedAlignment(ax, ay);
    if (named) return named;
    return `Alignment(${ax}, ${ay})`;
  };
  return { begin: toAlignment(handles[0]), end: toAlignment(handles[1]) };
}

function namedAlignment(x: number, y: number): string | null {
  const map: Record<string, [number, number]> = {
    'Alignment.topLeft': [-1, -1],
    'Alignment.topCenter': [0, -1],
    'Alignment.topRight': [1, -1],
    'Alignment.centerLeft': [-1, 0],
    'Alignment.center': [0, 0],
    'Alignment.centerRight': [1, 0],
    'Alignment.bottomLeft': [-1, 1],
    'Alignment.bottomCenter': [0, 1],
    'Alignment.bottomRight': [1, 1],
  };
  for (const [name, [mx, my]] of Object.entries(map)) {
    if (x === mx && y === my) return name;
  }
  return null;
}

function emitBorderRadius(br: IRBorderRadius): string | null {
  if (br.topLeft === 0 && br.topRight === 0 && br.bottomRight === 0 && br.bottomLeft === 0) {
    return null;
  }

  // All corners equal
  if (
    br.topLeft === br.topRight &&
    br.topRight === br.bottomRight &&
    br.bottomRight === br.bottomLeft
  ) {
    return `BorderRadius.all(Radius.circular(${br.topLeft}))`;
  }

  // Mixed corners
  const parts: string[] = [];
  if (br.topLeft > 0) parts.push(`topLeft: Radius.circular(${br.topLeft})`);
  if (br.topRight > 0) parts.push(`topRight: Radius.circular(${br.topRight})`);
  if (br.bottomRight > 0) parts.push(`bottomRight: Radius.circular(${br.bottomRight})`);
  if (br.bottomLeft > 0) parts.push(`bottomLeft: Radius.circular(${br.bottomLeft})`);

  return `BorderRadius.only(${parts.join(', ')})`;
}
