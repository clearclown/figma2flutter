import {
  IRDocument,
  IRNode,
  IRNodeBase,
  IRRectangleNode,
  IRFrameNode,
  IRTextNode,
  IRComponentNode,
  IRInstanceNode,
  IRGroupNode,
  IRImageNode,
  IRVectorNode,
} from '../../ir/schema';
import { IR_VERSION, PLUGIN_VERSION } from '../../shared/constants';
import { extractBoxStyle } from './style-extractor';
import { extractLayout } from './layout-extractor';
import { extractText } from './text-extractor';
import { TokenExtractor } from './token-extractor';

/**
 * Extract a Figma SceneNode tree into a complete IRDocument.
 * Supports all major node types: FRAME, TEXT, RECTANGLE, IMAGE, COMPONENT, INSTANCE, GROUP, VECTOR.
 */
export class NodeExtractor {
  private tokens: TokenExtractor;

  constructor() {
    this.tokens = new TokenExtractor();
  }

  async extract(node: SceneNode, fileKey: string): Promise<IRDocument> {
    const root = await this.extractNode(node);

    return {
      version: IR_VERSION,
      metadata: {
        sourcePluginVersion: PLUGIN_VERSION,
        figmaFileKey: fileKey,
        figmaNodeId: node.id,
        figmaNodeName: node.name,
        exportedAt: new Date().toISOString(),
      },
      tokens: this.tokens.getTokens(),
      root,
    };
  }

  private async extractNode(node: SceneNode): Promise<IRNode> {
    const base = this.extractBase(node);

    switch (node.type) {
      case 'FRAME':
      case 'SECTION':
        return this.extractFrame(node as FrameNode, base);

      case 'TEXT':
        return extractText(node as TextNode, base, this.tokens);

      case 'COMPONENT':
        return this.extractComponent(node as ComponentNode, base);

      case 'INSTANCE':
        return this.extractInstance(node as InstanceNode, base);

      case 'GROUP':
        return this.extractGroup(node as GroupNode, base);

      case 'COMPONENT_SET':
        return this.extractFrame(node as unknown as FrameNode, base);

      case 'RECTANGLE':
      case 'ELLIPSE':
      case 'LINE':
      case 'STAR':
      case 'POLYGON':
        return this.extractRectangleOrImage(node as RectangleNode, base);

      case 'VECTOR':
        return this.extractVector(node as VectorNode, base);

      default:
        // Fallback for unknown types
        if ('fills' in node) {
          return this.extractRectangleOrImage(node as unknown as RectangleNode, base);
        }
        return this.createMinimalRectangle(base);
    }
  }

  private extractBase(node: SceneNode): IRNodeBase {
    const base: IRNodeBase = {
      id: node.id,
      name: node.name,
      type: 'RECTANGLE', // Placeholder, overridden by specific extractors
      visible: node.visible,
      opacity: 'opacity' in node ? (node.opacity as number) : 1,
      rotation: 'rotation' in node ? (node.rotation as number) : 0,
      size: {
        width: node.width,
        height: node.height,
      },
    };

    // Add absolute position for children in free-form (non-auto-layout) parents
    if ('x' in node && 'y' in node) {
      const parent = node.parent;
      if (parent && 'layoutMode' in parent && parent.layoutMode === 'NONE') {
        base.position = { x: node.x as number, y: node.y as number };
      }
      // Also add position for GROUP children
      if (parent && parent.type === 'GROUP') {
        base.position = { x: node.x as number, y: node.y as number };
      }
    }

    return base;
  }

  // ===== FRAME =====
  private async extractFrame(node: FrameNode, base: IRNodeBase): Promise<IRFrameNode> {
    const style = extractBoxStyle(node, this.tokens);
    const layout = extractLayout(node);
    const visibleChildren = node.children.filter((c: SceneNode) => c.visible);
    const children = await Promise.all(visibleChildren.map((c: SceneNode) => this.extractNode(c)));

    return {
      ...base,
      type: 'FRAME',
      layout,
      style,
      clipsContent: node.clipsContent ?? false,
      children,
    };
  }

  // ===== COMPONENT =====
  private async extractComponent(node: ComponentNode, base: IRNodeBase): Promise<IRComponentNode> {
    const style = extractBoxStyle(node, this.tokens);
    const layout = extractLayout(node);
    const visibleChildren = node.children.filter((c: SceneNode) => c.visible);
    const children = await Promise.all(visibleChildren.map((c: SceneNode) => this.extractNode(c)));

    return {
      ...base,
      type: 'COMPONENT',
      componentKey: node.key,
      layout,
      style,
      clipsContent: node.clipsContent ?? false,
      children,
    };
  }

  // ===== INSTANCE =====
  private async extractInstance(node: InstanceNode, base: IRNodeBase): Promise<IRInstanceNode> {
    const style = extractBoxStyle(node, this.tokens);
    const layout = extractLayout(node);
    const visibleChildren = node.children.filter((c: SceneNode) => c.visible);
    const children = await Promise.all(visibleChildren.map((c: SceneNode) => this.extractNode(c)));

    return {
      ...base,
      type: 'INSTANCE',
      componentRef: node.mainComponent?.key ?? '',
      overrides: {}, // Instance overrides are complex; basic support for now
      layout,
      style,
      clipsContent: node.clipsContent ?? false,
      children,
    };
  }

  // ===== GROUP =====
  private async extractGroup(node: GroupNode, base: IRNodeBase): Promise<IRGroupNode> {
    const visibleChildren = node.children.filter((c: SceneNode) => c.visible);
    const children = await Promise.all(visibleChildren.map((c: SceneNode) => this.extractNode(c)));

    return {
      ...base,
      type: 'GROUP',
      children,
    };
  }

  // ===== RECTANGLE / IMAGE detection =====
  private extractRectangleOrImage(node: RectangleNode, base: IRNodeBase): IRRectangleNode | IRImageNode {
    // Detect image fill → emit as IMAGE node
    if (Array.isArray(node.fills)) {
      for (const paint of node.fills as Paint[]) {
        if (paint.type === 'IMAGE' && paint.visible !== false) {
          return this.extractImage(node, base, (paint as ImagePaint).imageHash ?? '');
        }
      }
    }

    const style = extractBoxStyle(node, this.tokens);
    return {
      ...base,
      type: 'RECTANGLE',
      style,
    };
  }

  // ===== IMAGE =====
  private extractImage(node: RectangleNode, base: IRNodeBase, imageHash: string): IRImageNode {
    const style = extractBoxStyle(node, this.tokens);
    const scaleMode = this.mapImageScaleMode(node);

    return {
      ...base,
      type: 'IMAGE',
      imageRef: imageHash,
      scaleMode,
      style,
    };
  }

  // ===== VECTOR =====
  private async extractVector(node: VectorNode, base: IRNodeBase): Promise<IRVectorNode> {
    const style = extractBoxStyle(node, this.tokens);

    const result: IRVectorNode = {
      ...base,
      type: 'VECTOR',
      style,
    };

    // Extract structured path data (synchronous)
    if (node.vectorPaths && node.vectorPaths.length > 0) {
      result.vectorPaths = node.vectorPaths.map(vp => ({
        windingRule: vp.windingRule as 'NONZERO' | 'EVENODD',
        data: vp.data,
      }));
    }

    // Export full SVG string (asynchronous, with timeout)
    try {
      const svgPromise = node.exportAsync({ format: 'SVG_STRING' });
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('SVG export timeout')), 2000)
      );
      const svgString = await Promise.race([svgPromise, timeoutPromise]) as string;
      if (svgString) {
        result.svgString = svgString;
      }
    } catch {
      // SVG export failed or timed out — continue without svgString
    }

    return result;
  }

  private mapImageScaleMode(node: RectangleNode): 'FILL' | 'FIT' | 'CROP' | 'TILE' {
    if (Array.isArray(node.fills)) {
      for (const paint of node.fills as Paint[]) {
        if (paint.type === 'IMAGE') {
          const imgPaint = paint as ImagePaint;
          switch (imgPaint.scaleMode) {
            case 'FIT':
              return 'FIT';
            case 'CROP':
              return 'CROP';
            case 'TILE':
              return 'TILE';
            default:
              return 'FILL';
          }
        }
      }
    }
    return 'FILL';
  }

  private createMinimalRectangle(base: IRNodeBase): IRRectangleNode {
    return {
      ...base,
      type: 'RECTANGLE',
      style: {
        fills: [],
        strokes: [],
        effects: [],
        borderRadius: { topLeft: 0, topRight: 0, bottomRight: 0, bottomLeft: 0 },
      },
    };
  }
}
