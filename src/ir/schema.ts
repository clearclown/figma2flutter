// ===== Figma2Flutter Intermediate Representation (IR) Schema =====
// This is the central contract between Figma extraction and Flutter compilation.
// All style values in the node tree are TOKEN REFERENCES (string keys), never raw values.

export interface IRDocument {
  version: '1.0.0';
  metadata: IRMetadata;
  tokens: IRTokens;
  root: IRNode;
  screenshots?: IRScreenshots;
}

// ===== Metadata =====
export interface IRMetadata {
  sourcePluginVersion: string;
  figmaFileKey: string;
  figmaNodeId: string;
  figmaNodeName: string;
  exportedAt: string; // ISO 8601
}

// ===== Design Tokens =====
export interface IRTokens {
  colors: Record<string, IRColorToken>;
  typography: Record<string, IRTypographyToken>;
  spacing: Record<string, number>;
  radii: Record<string, number>;
  shadows: Record<string, IRShadowToken>;
}

export interface IRColorToken {
  r: number; // 0-1
  g: number; // 0-1
  b: number; // 0-1
  a: number; // 0-1
}

export interface IRTypographyToken {
  fontFamily: string;
  fontWeight: number; // 100-900
  fontSize: number;
  lineHeight: IRLineHeight;
  letterSpacing: IRLetterSpacing;
}

export interface IRLineHeight {
  unit: 'PIXELS' | 'PERCENT' | 'AUTO';
  value: number;
}

export interface IRLetterSpacing {
  unit: 'PIXELS' | 'PERCENT';
  value: number;
}

export interface IRShadowToken {
  type: 'DROP_SHADOW' | 'INNER_SHADOW';
  colorRef: string;
  offset: { x: number; y: number };
  blurRadius: number;
  spreadRadius: number;
}

// ===== Node Tree =====
export type IRNode =
  | IRFrameNode
  | IRTextNode
  | IRRectangleNode
  | IRImageNode
  | IRComponentNode
  | IRInstanceNode
  | IRGroupNode
  | IRVectorNode;

export type IRNodeType =
  | 'FRAME'
  | 'TEXT'
  | 'RECTANGLE'
  | 'IMAGE'
  | 'COMPONENT'
  | 'INSTANCE'
  | 'GROUP'
  | 'VECTOR';

// Common base for all nodes
export interface IRNodeBase {
  id: string;
  name: string;
  type: IRNodeType;
  visible: boolean;
  opacity: number; // 0-1
  rotation: number; // degrees
  size: { width: number; height: number };
  position?: { x: number; y: number }; // Only for absolute-positioned children
}

// ===== Frame =====
export interface IRFrameNode extends IRNodeBase {
  type: 'FRAME';
  layout: IRLayout;
  style: IRBoxStyle;
  clipsContent: boolean;
  children: IRNode[];
}

export interface IRLayout {
  mode: 'NONE' | 'HORIZONTAL' | 'VERTICAL';
  primaryAxisAlign: 'START' | 'CENTER' | 'END' | 'SPACE_BETWEEN';
  counterAxisAlign: 'START' | 'CENTER' | 'END' | 'STRETCH';
  primaryAxisSizing: 'FIXED' | 'HUG';
  counterAxisSizing: 'FIXED' | 'HUG';
  padding: IREdgeInsets;
  itemSpacing: number;
  wrap: boolean;
  childOverrides?: Record<string, IRChildOverride>;
}

export interface IRChildOverride {
  layoutAlign: 'INHERIT' | 'STRETCH';
  layoutGrow: number; // 0 = fixed, 1 = fill
}

export interface IREdgeInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

// ===== Box Style =====
export interface IRBoxStyle {
  fills: IRFill[];
  strokes: IRStroke[];
  effects: IREffect[];
  borderRadius: IRBorderRadius;
}

export interface IRFill {
  type: 'SOLID' | 'LINEAR_GRADIENT' | 'RADIAL_GRADIENT';
  colorRef?: string;
  opacity: number;
  gradientStops?: { colorRef: string; position: number }[];
  gradientHandlePositions?: { x: number; y: number }[];
}

export interface IRStroke {
  colorRef: string;
  weight: number;
  align: 'INSIDE' | 'OUTSIDE' | 'CENTER';
}

export interface IREffect {
  type: 'DROP_SHADOW' | 'INNER_SHADOW' | 'LAYER_BLUR';
  shadowRef?: string;
  blurRadius?: number;
}

export interface IRBorderRadius {
  topLeft: number;
  topRight: number;
  bottomRight: number;
  bottomLeft: number;
}

// ===== Text =====
export interface IRTextNode extends IRNodeBase {
  type: 'TEXT';
  characters: string;
  typographyRef: string;
  colorRef: string;
  textAlign: 'LEFT' | 'CENTER' | 'RIGHT' | 'JUSTIFIED';
  verticalAlign: 'TOP' | 'CENTER' | 'BOTTOM';
  segments?: IRTextSegment[];
}

export interface IRTextSegment {
  characters: string;
  typographyRef: string;
  colorRef: string;
}

// ===== Rectangle =====
export interface IRRectangleNode extends IRNodeBase {
  type: 'RECTANGLE';
  style: IRBoxStyle;
}

// ===== Image =====
export interface IRImageNode extends IRNodeBase {
  type: 'IMAGE';
  imageRef: string;
  scaleMode: 'FILL' | 'FIT' | 'CROP' | 'TILE';
  style: IRBoxStyle;
}

// ===== Component =====
export interface IRComponentNode extends IRNodeBase {
  type: 'COMPONENT';
  componentKey: string;
  layout: IRLayout;
  style: IRBoxStyle;
  clipsContent: boolean;
  children: IRNode[];
}

// ===== Instance =====
export interface IRInstanceNode extends IRNodeBase {
  type: 'INSTANCE';
  componentRef: string;
  overrides: Record<string, unknown>;
  layout: IRLayout;
  style: IRBoxStyle;
  clipsContent: boolean;
  children: IRNode[];
}

// ===== Group =====
export interface IRGroupNode extends IRNodeBase {
  type: 'GROUP';
  children: IRNode[];
}

// ===== Vector =====
export interface IRVectorNode extends IRNodeBase {
  type: 'VECTOR';
  style: IRBoxStyle;
  svgPath?: string;
  svgString?: string;         // Full SVG from exportAsync('SVG_STRING')
  vectorPaths?: {             // Structured path data from node.vectorPaths
    windingRule: 'NONZERO' | 'EVENODD';
    data: string;             // SVG path d attribute
  }[];
}

// ===== Screenshots =====
export interface IRScreenshots {
  root: IRScreenshot;
}

export interface IRScreenshot {
  nodeId: string;
  nodeName: string;
  scale: number;      // 2x recommended
  width: number;      // Pixel width (after scale)
  height: number;
  base64: string;     // PNG base64 encoded
}
