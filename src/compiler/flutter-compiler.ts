import {
  IRDocument,
  IRNode,
  IRRectangleNode,
  IRTextNode,
  IRFrameNode,
  IRImageNode,
  IRComponentNode,
  IRGroupNode,
  IRVectorNode,
} from '../ir/schema';
import { indent } from './dart-formatter';
import { TokenConfig, DEFAULT_CONFIG } from '../shared/types';
import { emitContainer } from './emitters/container-emitter';
import { emitText } from './emitters/text-emitter';
import { emitFlex } from './emitters/flex-emitter';
import { emitStack } from './emitters/stack-emitter';
import { emitImage } from './emitters/image-emitter';
import { emitComponent } from './emitters/component-emitter';
import { emitVector } from './emitters/vector-emitter';
import { emitTokenFiles, TokenFiles } from './token-emitter';

export interface CompileResult {
  widgetCode: string;
  tokenFiles: TokenFiles;
}

export interface CompilerOptions {
  tokenConfig?: TokenConfig;
}

export function compileIR(ir: IRDocument, options?: CompilerOptions): CompileResult {
  const tokenConfig = options?.tokenConfig ?? DEFAULT_CONFIG.tokenConfig;

  const compileNode = (node: IRNode): string => {
    return compileNodeWithConfig(node, tokenConfig, compileNode);
  };

  const widgetCode = compileNode(ir.root);
  const tokenFiles = emitTokenFiles(ir.tokens);

  return { widgetCode, tokenFiles };
}

function compileNodeWithConfig(
  node: IRNode,
  tokenConfig: TokenConfig,
  compileNode: (node: IRNode) => string,
): string {
  // Skip invisible nodes
  if (!node.visible) {
    return '';
  }

  let code = compileNodeInner(node, tokenConfig, compileNode);

  // Wrap in Opacity if partially transparent (0 < opacity < 1)
  if (node.opacity < 1 && node.opacity > 0 && code.trim().length > 0) {
    const indentedChild = indent(code.trimEnd(), 1);
    code = `Opacity(\n  opacity: ${node.opacity},\n  child: ${indentedChild.trimStart()},\n)`;
  }

  return code;
}

function compileNodeInner(
  node: IRNode,
  tokenConfig: TokenConfig,
  compileNode: (node: IRNode) => string,
): string {
  switch (node.type) {
    case 'RECTANGLE':
      return emitContainer(node as IRRectangleNode, {
        colorClassName: tokenConfig.colorClassName,
      });

    case 'TEXT':
      return emitText(node as IRTextNode, {
        colorClassName: tokenConfig.colorClassName,
        typographyClassName: tokenConfig.typographyClassName,
      });

    case 'FRAME': {
      const frame = node as IRFrameNode;
      if (frame.layout.mode === 'VERTICAL' || frame.layout.mode === 'HORIZONTAL') {
        return emitFlex(frame, {
          colorClassName: tokenConfig.colorClassName,
          typographyClassName: tokenConfig.typographyClassName,
          compileNode,
        });
      }
      // NONE layout → Stack
      return emitStack(frame, { compileNode });
    }

    case 'IMAGE':
      return emitImage(node as IRImageNode);

    case 'GROUP':
      return emitStack(node as IRGroupNode, { compileNode });

    case 'COMPONENT': {
      const comp = node as IRComponentNode;
      // Compile the body as if it were a FRAME, then wrap in StatelessWidget class
      const virtualFrame: IRFrameNode = {
        id: comp.id,
        name: comp.name,
        type: 'FRAME',
        visible: comp.visible,
        opacity: comp.opacity,
        rotation: comp.rotation,
        size: comp.size,
        layout: comp.layout,
        style: comp.style,
        clipsContent: comp.clipsContent,
        children: comp.children,
      };
      const bodyCode = compileNodeWithConfig(virtualFrame, tokenConfig, compileNode);
      return emitComponent(comp, bodyCode);
    }

    case 'INSTANCE': {
      // Render INSTANCE the same as FRAME (reuse its layout/style/children)
      const inst = node as unknown as IRFrameNode;
      if (inst.layout.mode === 'VERTICAL' || inst.layout.mode === 'HORIZONTAL') {
        return emitFlex(inst, {
          colorClassName: tokenConfig.colorClassName,
          typographyClassName: tokenConfig.typographyClassName,
          compileNode,
        });
      }
      return emitStack(inst, { compileNode });
    }

    case 'VECTOR':
      return emitVector(node as IRVectorNode);

    default: {
      const _exhaustive: never = node;
      return `// Unsupported node type: ${(_exhaustive as IRNode).type}\n`;
    }
  }
}
