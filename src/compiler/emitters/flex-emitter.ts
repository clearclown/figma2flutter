import { IRFrameNode, IRLayout, IRNode } from '../../ir/schema';
import { tokenKeyToDartName } from '../../plugin/utils/color-utils';
import { formatDart, indent } from '../dart-formatter';
import { emitBoxShadows, emitGradient } from './container-emitter';

export interface FlexEmitterConfig {
  colorClassName: string;
  typographyClassName: string;
  compileNode: (node: IRNode) => string;
}

export function emitFlex(node: IRFrameNode, config: FlexEmitterConfig): string {
  const layout = node.layout;
  const hasStyle = hasVisualStyle(node);
  const isVertical = layout.mode === 'VERTICAL';

  // Build children with spacers
  const childCodes = buildChildren(node, layout, config);

  // Use Wrap widget when layout.wrap is true
  const flexCode = layout.wrap
    ? buildWrapWidget(layout, childCodes, isVertical)
    : buildFlexWidget(isVertical ? 'Column' : 'Row', layout, childCodes);

  // Wrap in Container if has visual styling
  if (hasStyle) {
    return formatDart(wrapInContainer(node, layout, flexCode, config.colorClassName));
  }

  // Wrap in Padding if has padding but no visual style
  const hasPadding = layout.padding.top > 0 || layout.padding.right > 0 ||
    layout.padding.bottom > 0 || layout.padding.left > 0;
  if (hasPadding) {
    return formatDart(wrapInPadding(layout, flexCode));
  }

  return formatDart(flexCode);
}

function buildChildren(
  node: IRFrameNode,
  layout: IRLayout,
  config: FlexEmitterConfig,
): string[] {
  const children: string[] = [];
  const isVertical = layout.mode === 'VERTICAL';
  const needsSpacers = layout.itemSpacing > 0 &&
    layout.primaryAxisAlign !== 'SPACE_BETWEEN' &&
    !layout.wrap;

  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i];
    let childCode = config.compileNode(child).trimEnd();

    // Skip invisible/empty children
    if (childCode.length === 0) continue;

    // Remove trailing newline from child code for nesting
    if (childCode.endsWith('\n')) {
      childCode = childCode.slice(0, -1);
    }

    // Wrap in Expanded if layoutGrow == 1
    const override = layout.childOverrides?.[child.id];
    if (override?.layoutGrow === 1) {
      childCode = `Expanded(\n  child: ${childCode},\n)`;
    }

    // Add spacer before this child (not before first)
    if (needsSpacers && children.length > 0) {
      const spacer = isVertical
        ? `SizedBox(height: ${layout.itemSpacing})`
        : `SizedBox(width: ${layout.itemSpacing})`;
      children.push(spacer);
    }

    children.push(childCode);
  }

  return children;
}

function buildFlexWidget(
  widget: string,
  layout: IRLayout,
  childCodes: string[],
): string {
  const props: string[] = [];

  // mainAxisSize
  if (layout.primaryAxisSizing === 'HUG') {
    props.push('  mainAxisSize: MainAxisSize.min,');
  }

  // mainAxisAlignment
  const mainAxis = mapMainAxisAlign(layout.primaryAxisAlign);
  if (mainAxis !== 'start') {
    props.push(`  mainAxisAlignment: MainAxisAlignment.${mainAxis},`);
  }

  // crossAxisAlignment
  const crossAxis = mapCrossAxisAlign(layout.counterAxisAlign);
  if (crossAxis !== 'start') {
    props.push(`  crossAxisAlignment: CrossAxisAlignment.${crossAxis},`);
  }

  // children
  const indentedChildren = childCodes.map(c => indent(c, 2) + ',').join('\n');
  props.push(`  children: [\n${indentedChildren}\n  ],`);

  return `${widget}(\n${props.join('\n')}\n)`;
}

function buildWrapWidget(
  layout: IRLayout,
  childCodes: string[],
  isVertical: boolean,
): string {
  const props: string[] = [];

  // direction — Wrap defaults to horizontal, so only specify for vertical
  if (isVertical) {
    props.push('  direction: Axis.vertical,');
  }

  // alignment (maps to Wrap's alignment property)
  const mainAxis = mapWrapAlignment(layout.primaryAxisAlign);
  if (mainAxis !== 'start') {
    props.push(`  alignment: WrapAlignment.${mainAxis},`);
  }

  // crossAxisAlignment
  const crossAxis = mapWrapCrossAlignment(layout.counterAxisAlign);
  if (crossAxis !== 'start') {
    props.push(`  crossAxisAlignment: WrapCrossAlignment.${crossAxis},`);
  }

  // spacing
  if (layout.itemSpacing > 0) {
    props.push(`  spacing: ${layout.itemSpacing},`);
    props.push(`  runSpacing: ${layout.itemSpacing},`);
  }

  // children
  const indentedChildren = childCodes.map(c => indent(c, 2) + ',').join('\n');
  props.push(`  children: [\n${indentedChildren}\n  ],`);

  return `Wrap(\n${props.join('\n')}\n)`;
}

function mapWrapAlignment(align: IRLayout['primaryAxisAlign']): string {
  switch (align) {
    case 'START': return 'start';
    case 'CENTER': return 'center';
    case 'END': return 'end';
    case 'SPACE_BETWEEN': return 'spaceBetween';
  }
}

function mapWrapCrossAlignment(align: IRLayout['counterAxisAlign']): string {
  switch (align) {
    case 'START': return 'start';
    case 'CENTER': return 'center';
    case 'END': return 'end';
    case 'STRETCH': return 'start'; // Wrap doesn't have STRETCH — fallback to start
  }
}

function wrapInContainer(
  node: IRFrameNode,
  layout: IRLayout,
  innerCode: string,
  colorClassName: string,
): string {
  const parts: string[] = [];
  parts.push('Container(');

  // Size — only emit width for fixed counter axis in vertical, or explicit fixed sizes
  if (layout.counterAxisSizing === 'FIXED') {
    if (layout.mode === 'VERTICAL') {
      parts.push(`  width: ${node.size.width},`);
    } else {
      parts.push(`  height: ${node.size.height},`);
    }
  }

  // Decoration
  const decorProps: string[] = [];
  const gradientFill = node.style.fills.find(
    f => (f.type === 'LINEAR_GRADIENT' || f.type === 'RADIAL_GRADIENT') &&
      f.gradientStops && f.gradientStops.length > 0,
  );
  if (gradientFill) {
    const gradientCode = emitGradient(gradientFill, { colorClassName });
    decorProps.push(`    gradient: ${gradientCode},`);
  } else {
    const solidFill = node.style.fills.find(f => f.type === 'SOLID' && f.colorRef);
    if (solidFill?.colorRef) {
      const colorName = tokenKeyToDartName(solidFill.colorRef);
      decorProps.push(`    color: ${colorClassName}.${colorName},`);
    }
  }

  const br = node.style.borderRadius;
  if (br.topLeft > 0 || br.topRight > 0 || br.bottomRight > 0 || br.bottomLeft > 0) {
    if (br.topLeft === br.topRight && br.topRight === br.bottomRight && br.bottomRight === br.bottomLeft) {
      decorProps.push(`    borderRadius: BorderRadius.all(Radius.circular(${br.topLeft})),`);
    } else {
      const corners: string[] = [];
      if (br.topLeft > 0) corners.push(`topLeft: Radius.circular(${br.topLeft})`);
      if (br.topRight > 0) corners.push(`topRight: Radius.circular(${br.topRight})`);
      if (br.bottomRight > 0) corners.push(`bottomRight: Radius.circular(${br.bottomRight})`);
      if (br.bottomLeft > 0) corners.push(`bottomLeft: Radius.circular(${br.bottomLeft})`);
      decorProps.push(`    borderRadius: BorderRadius.only(${corners.join(', ')}),`);
    }
  }

  // Shadows
  const shadowCode = emitBoxShadows(node.style.effects, { colorClassName });
  if (shadowCode) {
    decorProps.push(`    boxShadow: ${shadowCode},`);
  }

  if (decorProps.length > 0) {
    parts.push(`  decoration: BoxDecoration(\n${decorProps.join('\n')}\n  ),`);
  }

  // Padding
  const padStr = emitEdgeInsets(layout.padding);
  if (padStr) {
    parts.push(`  padding: ${padStr},`);
  }

  // Child — indent the inner code properly when it's multiline
  const indentedInner = indent(innerCode, 1);
  parts.push(`  child: ${indentedInner.trimStart()},`);
  parts.push(')');

  return parts.join('\n');
}

function wrapInPadding(layout: IRLayout, innerCode: string): string {
  const padStr = emitEdgeInsets(layout.padding);
  if (!padStr) return innerCode;
  const indentedInner = indent(innerCode, 1);
  return `Padding(\n  padding: ${padStr},\n  child: ${indentedInner.trimStart()},\n)`;
}

export function emitEdgeInsets(p: IRLayout['padding']): string | null {
  if (p.top === 0 && p.right === 0 && p.bottom === 0 && p.left === 0) {
    return null;
  }
  if (p.top === p.right && p.right === p.bottom && p.bottom === p.left) {
    return `EdgeInsets.all(${p.top})`;
  }
  if (p.top === p.bottom && p.left === p.right) {
    if (p.left === 0) return `EdgeInsets.symmetric(vertical: ${p.top})`;
    if (p.top === 0) return `EdgeInsets.symmetric(horizontal: ${p.left})`;
    return `EdgeInsets.symmetric(horizontal: ${p.left}, vertical: ${p.top})`;
  }
  const parts: string[] = [];
  if (p.top > 0) parts.push(`top: ${p.top}`);
  if (p.right > 0) parts.push(`right: ${p.right}`);
  if (p.bottom > 0) parts.push(`bottom: ${p.bottom}`);
  if (p.left > 0) parts.push(`left: ${p.left}`);
  return `EdgeInsets.only(${parts.join(', ')})`;
}

function hasVisualStyle(node: IRFrameNode): boolean {
  const style = node.style;
  return style.fills.length > 0 || style.strokes.length > 0 || style.effects.length > 0 ||
    style.borderRadius.topLeft > 0 || style.borderRadius.topRight > 0 ||
    style.borderRadius.bottomRight > 0 || style.borderRadius.bottomLeft > 0;
}

function mapMainAxisAlign(align: IRLayout['primaryAxisAlign']): string {
  switch (align) {
    case 'START': return 'start';
    case 'CENTER': return 'center';
    case 'END': return 'end';
    case 'SPACE_BETWEEN': return 'spaceBetween';
  }
}

function mapCrossAxisAlign(align: IRLayout['counterAxisAlign']): string {
  switch (align) {
    case 'START': return 'start';
    case 'CENTER': return 'center';
    case 'END': return 'end';
    case 'STRETCH': return 'stretch';
  }
}
