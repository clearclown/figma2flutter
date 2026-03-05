import {
  IRLayout,
  IREdgeInsets,
  IRChildOverride,
} from '../../ir/schema';

/**
 * Extract auto-layout properties from a Figma frame/component node.
 * Maps Figma layout terminology to IR layout model.
 */
export function extractLayout(node: BaseFrameMixin): IRLayout {
  const mode = mapLayoutMode(node.layoutMode);

  // If no auto-layout, return NONE defaults
  if (mode === 'NONE') {
    return {
      mode: 'NONE',
      primaryAxisAlign: 'START',
      counterAxisAlign: 'START',
      primaryAxisSizing: 'FIXED',
      counterAxisSizing: 'FIXED',
      padding: { top: 0, right: 0, bottom: 0, left: 0 },
      itemSpacing: 0,
      wrap: false,
    };
  }

  const padding = extractPadding(node);
  const childOverrides = extractChildOverrides(node);

  return {
    mode,
    primaryAxisAlign: mapPrimaryAxisAlign(node.primaryAxisAlignItems),
    counterAxisAlign: mapCounterAxisAlign(node.counterAxisAlignItems),
    primaryAxisSizing: mapSizing(node.primaryAxisSizingMode),
    counterAxisSizing: mapSizing(node.counterAxisSizingMode),
    padding,
    itemSpacing: node.itemSpacing ?? 0,
    wrap: (node as FrameNode).layoutWrap === 'WRAP',
    ...(Object.keys(childOverrides).length > 0 ? { childOverrides } : {}),
  };
}

function extractPadding(node: BaseFrameMixin): IREdgeInsets {
  return {
    top: node.paddingTop ?? 0,
    right: node.paddingRight ?? 0,
    bottom: node.paddingBottom ?? 0,
    left: node.paddingLeft ?? 0,
  };
}

function extractChildOverrides(node: BaseFrameMixin): Record<string, IRChildOverride> {
  const overrides: Record<string, IRChildOverride> = {};

  if (!('children' in node)) return overrides;
  const children = (node as FrameNode).children;

  for (const child of children) {
    if (!('layoutAlign' in child)) continue;
    const c = child as SceneNode & { layoutAlign?: string; layoutGrow?: number };

    const layoutAlign = c.layoutAlign === 'STRETCH' ? 'STRETCH' : 'INHERIT';
    const layoutGrow = (c as { layoutGrow?: number }).layoutGrow ?? 0;

    // Only record if non-default
    if (layoutAlign !== 'INHERIT' || layoutGrow !== 0) {
      overrides[child.id] = {
        layoutAlign: layoutAlign as 'INHERIT' | 'STRETCH',
        layoutGrow,
      };
    }
  }

  return overrides;
}

function mapLayoutMode(mode: string | undefined): 'NONE' | 'HORIZONTAL' | 'VERTICAL' {
  switch (mode) {
    case 'HORIZONTAL':
      return 'HORIZONTAL';
    case 'VERTICAL':
      return 'VERTICAL';
    default:
      return 'NONE';
  }
}

function mapPrimaryAxisAlign(
  align: string | undefined,
): 'START' | 'CENTER' | 'END' | 'SPACE_BETWEEN' {
  switch (align) {
    case 'CENTER':
      return 'CENTER';
    case 'MAX':
      return 'END';
    case 'SPACE_BETWEEN':
      return 'SPACE_BETWEEN';
    default:
      return 'START';
  }
}

function mapCounterAxisAlign(
  align: string | undefined,
): 'START' | 'CENTER' | 'END' | 'STRETCH' {
  switch (align) {
    case 'CENTER':
      return 'CENTER';
    case 'MAX':
      return 'END';
    default:
      return 'START';
  }
}

function mapSizing(mode: string | undefined): 'FIXED' | 'HUG' {
  return mode === 'AUTO' ? 'HUG' : 'FIXED';
}
