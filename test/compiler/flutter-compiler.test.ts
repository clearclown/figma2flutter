import { describe, it, expect } from 'vitest';
import { compileIR } from '../../src/compiler/flutter-compiler';
import { IRDocument } from '../../src/ir/schema';
import simpleRectFixture from '../fixtures/simple-rectangle.ir.json';
import textNodeFixture from '../fixtures/text-node.ir.json';
import autoLayoutColumnFixture from '../fixtures/auto-layout-column.ir.json';
import autoLayoutRowFixture from '../fixtures/auto-layout-row.ir.json';
import nestedFramesFixture from '../fixtures/nested-frames.ir.json';
import componentInstanceFixture from '../fixtures/component-instance.ir.json';
import imageNodeFixture from '../fixtures/image-node.ir.json';
import stackGroupFixture from '../fixtures/stack-group.ir.json';
import fullCardFixture from '../fixtures/full-card.ir.json';
import wrapLayoutFixture from '../fixtures/wrap-layout.ir.json';
import visibilityFixture from '../fixtures/visibility-opacity.ir.json';
import shadowFixture from '../fixtures/shadow-effect.ir.json';
import richTextFixture from '../fixtures/rich-text.ir.json';
import vectorSvgFixture from '../fixtures/vector-svg.ir.json';
import vectorPathsFixture from '../fixtures/vector-paths.ir.json';
import { readFileSync } from 'fs';
import { resolve } from 'path';

function loadExpected(name: string): string {
  return readFileSync(resolve(__dirname, `../expected/${name}`), 'utf-8');
}

describe('FlutterCompiler', () => {
  describe('simple rectangle', () => {
    it('compiles a rectangle IR to Container widget code', () => {
      const ir = simpleRectFixture as unknown as IRDocument;
      const result = compileIR(ir);
      const expected = loadExpected('simple-rectangle.dart');
      expect(result.widgetCode).toBe(expected);
    });

    it('generates AppColors token class', () => {
      const ir = simpleRectFixture as unknown as IRDocument;
      const result = compileIR(ir);
      const expected = loadExpected('simple-rectangle-tokens.dart');
      expect(result.tokenFiles.colors).toBe(expected);
    });
  });

  describe('custom token config', () => {
    it('uses DesignTokens class name when configured', () => {
      const ir = simpleRectFixture as unknown as IRDocument;
      const result = compileIR(ir, {
        tokenConfig: {
          colorClassName: 'DesignTokens',
          colorImport: 'package:mobile/core/theme/design_tokens.dart',
          typographyClassName: 'DesignTokens',
          typographyImport: 'package:mobile/core/theme/design_tokens.dart',
          spacingClassName: 'DesignTokens',
          spacingImport: 'package:mobile/core/theme/design_tokens.dart',
          generateTokenFiles: false,
        },
      });
      expect(result.widgetCode).toContain('DesignTokens.primary500');
      expect(result.widgetCode).not.toContain('AppColors.');
    });
  });

  describe('text node', () => {
    it('compiles a text node to Text widget', () => {
      const ir = textNodeFixture as unknown as IRDocument;
      const result = compileIR(ir);
      const expected = loadExpected('text-node.dart');
      expect(result.widgetCode).toBe(expected);
    });
  });

  describe('auto-layout column', () => {
    it('compiles a vertical auto-layout frame to Container + Column', () => {
      const ir = autoLayoutColumnFixture as unknown as IRDocument;
      const result = compileIR(ir);
      const expected = loadExpected('auto-layout-column.dart');
      expect(result.widgetCode).toBe(expected);
    });
  });

  describe('auto-layout row', () => {
    it('compiles a horizontal auto-layout with SPACE_BETWEEN to Row (no spacers)', () => {
      const ir = autoLayoutRowFixture as unknown as IRDocument;
      const result = compileIR(ir);
      const expected = loadExpected('auto-layout-row.dart');
      expect(result.widgetCode).toBe(expected);
    });
  });

  describe('nested frames', () => {
    it('compiles nested Column > Row with proper indentation', () => {
      const ir = nestedFramesFixture as unknown as IRDocument;
      const result = compileIR(ir);
      const expected = loadExpected('nested-frames.dart');
      expect(result.widgetCode).toBe(expected);
    });
  });

  describe('component', () => {
    it('compiles a COMPONENT node to a StatelessWidget class', () => {
      const ir = componentInstanceFixture as unknown as IRDocument;
      const result = compileIR(ir);
      const expected = loadExpected('component-instance.dart');
      expect(result.widgetCode).toBe(expected);
    });
  });

  describe('image node', () => {
    it('compiles an IMAGE node to ClipRRect + Image.asset', () => {
      const ir = imageNodeFixture as unknown as IRDocument;
      const result = compileIR(ir);
      const expected = loadExpected('image-node.dart');
      expect(result.widgetCode).toBe(expected);
    });
  });

  describe('stack (group)', () => {
    it('compiles a GROUP node to SizedBox + Stack with Positioned children', () => {
      const ir = stackGroupFixture as unknown as IRDocument;
      const result = compileIR(ir);
      const expected = loadExpected('stack-group.dart');
      expect(result.widgetCode).toBe(expected);
    });
  });

  describe('full card (integration)', () => {
    it('compiles a complex COMPONENT with nested frames, images, text, and buttons', () => {
      const ir = fullCardFixture as unknown as IRDocument;
      const result = compileIR(ir);
      const expected = loadExpected('full-card.dart');
      expect(result.widgetCode).toBe(expected);
    });

    it('generates all token types from full card IR', () => {
      const ir = fullCardFixture as unknown as IRDocument;
      const result = compileIR(ir);
      expect(result.tokenFiles.colors).toBeDefined();
      expect(result.tokenFiles.typography).toBeDefined();
      expect(result.tokenFiles.colors).toContain('surfaceCard');
      expect(result.tokenFiles.colors).toContain('textPrimary');
      expect(result.tokenFiles.colors).toContain('primary500');
      expect(result.tokenFiles.typography).toContain('headingLg');
      expect(result.tokenFiles.typography).toContain('bodyMd');
      expect(result.tokenFiles.typography).toContain('labelMd');
    });

    it('uses custom token class names when configured', () => {
      const ir = fullCardFixture as unknown as IRDocument;
      const result = compileIR(ir, {
        tokenConfig: {
          colorClassName: 'DesignTokens',
          colorImport: 'design_tokens.dart',
          typographyClassName: 'DesignTokens',
          typographyImport: 'design_tokens.dart',
          spacingClassName: 'DesignTokens',
          spacingImport: 'design_tokens.dart',
          generateTokenFiles: false,
        },
      });
      expect(result.widgetCode).toContain('DesignTokens.surfaceCard');
      expect(result.widgetCode).toContain('DesignTokens.headingLg');
      expect(result.widgetCode).toContain('DesignTokens.textOnPrimary');
      expect(result.widgetCode).not.toContain('AppColors.');
      expect(result.widgetCode).not.toContain('AppTypography.');
    });
  });

  describe('wrap layout', () => {
    it('compiles a frame with wrap=true to Wrap widget', () => {
      const ir = wrapLayoutFixture as unknown as IRDocument;
      const result = compileIR(ir);
      expect(result.widgetCode).toContain('Wrap(');
      expect(result.widgetCode).toContain('spacing: 8,');
      expect(result.widgetCode).toContain('runSpacing: 8,');
      expect(result.widgetCode).not.toContain('Row(');
      expect(result.widgetCode).not.toContain('Column(');
    });

    it('compiles wrap layout to exact expected output', () => {
      const ir = wrapLayoutFixture as unknown as IRDocument;
      const result = compileIR(ir);
      const expected = loadExpected('wrap-layout.dart');
      expect(result.widgetCode).toBe(expected);
    });
  });

  describe('visibility and opacity', () => {
    it('filters out invisible nodes', () => {
      const ir = visibilityFixture as unknown as IRDocument;
      const result = compileIR(ir);
      expect(result.widgetCode).toContain("'Visible'");
      expect(result.widgetCode).not.toContain("'Hidden'");
    });

    it('wraps semi-transparent nodes in Opacity widget', () => {
      const ir = visibilityFixture as unknown as IRDocument;
      const result = compileIR(ir);
      expect(result.widgetCode).toContain('Opacity(');
      expect(result.widgetCode).toContain('opacity: 0.5,');
    });

    it('does not add spacer for invisible children', () => {
      const ir = visibilityFixture as unknown as IRDocument;
      const result = compileIR(ir);
      // Only 2 visible children with itemSpacing=8, so exactly 1 SizedBox spacer
      const spacerCount = (result.widgetCode.match(/SizedBox\(height: 8\)/g) || []).length;
      expect(spacerCount).toBe(1);
    });

    it('compiles visibility/opacity to exact expected output', () => {
      const ir = visibilityFixture as unknown as IRDocument;
      const result = compileIR(ir);
      const expected = loadExpected('visibility-opacity.dart');
      expect(result.widgetCode).toBe(expected);
    });
  });

  describe('shadow effects', () => {
    it('emits BoxShadow in BoxDecoration for DROP_SHADOW', () => {
      const ir = shadowFixture as unknown as IRDocument;
      const result = compileIR(ir);
      expect(result.widgetCode).toContain('boxShadow:');
      expect(result.widgetCode).toContain('BoxShadow(');
      expect(result.widgetCode).toContain('AppColors.shadowMd');
      expect(result.widgetCode).toContain('blurRadius: 8');
    });

    it('compiles shadow card to exact expected output', () => {
      const ir = shadowFixture as unknown as IRDocument;
      const result = compileIR(ir);
      const expected = loadExpected('shadow-effect.dart');
      expect(result.widgetCode).toBe(expected);
    });
  });

  describe('rich text (segments)', () => {
    it('compiles multi-segment text to RichText with TextSpans', () => {
      const ir = richTextFixture as unknown as IRDocument;
      const result = compileIR(ir);
      expect(result.widgetCode).toContain('RichText(');
      expect(result.widgetCode).toContain('TextSpan(');
      expect(result.widgetCode).toContain("text: '利用規約'");
      expect(result.widgetCode).toContain("text: 'に同意します'");
      expect(result.widgetCode).toContain('AppTypography.bodyMdBold');
      expect(result.widgetCode).toContain('AppColors.textAccent');
    });

    it('compiles rich text to exact expected output', () => {
      const ir = richTextFixture as unknown as IRDocument;
      const result = compileIR(ir);
      const expected = loadExpected('rich-text.dart');
      expect(result.widgetCode).toBe(expected);
    });
  });

  describe('vector (SVG)', () => {
    it('compiles a VECTOR with svgString to SvgPicture.string()', () => {
      const ir = vectorSvgFixture as unknown as IRDocument;
      const result = compileIR(ir);
      expect(result.widgetCode).toContain('SvgPicture.string(');
      expect(result.widgetCode).toContain("width: 24,");
      expect(result.widgetCode).toContain("height: 24,");
      expect(result.widgetCode).toContain('<svg');
      expect(result.widgetCode).toContain('<path');
    });

    it('compiles vector SVG to exact expected output', () => {
      const ir = vectorSvgFixture as unknown as IRDocument;
      const result = compileIR(ir);
      const expected = loadExpected('vector-svg.dart');
      expect(result.widgetCode).toBe(expected);
    });
  });

  describe('vector (paths)', () => {
    it('compiles a VECTOR with vectorPaths to CustomPaint', () => {
      const ir = vectorPathsFixture as unknown as IRDocument;
      const result = compileIR(ir);
      expect(result.widgetCode).toContain('CustomPaint(');
      expect(result.widgetCode).toContain('Size(16, 16)');
      expect(result.widgetCode).toContain('_ArrowRightPainter()');
    });

    it('compiles vector paths to exact expected output', () => {
      const ir = vectorPathsFixture as unknown as IRDocument;
      const result = compileIR(ir);
      const expected = loadExpected('vector-paths.dart');
      expect(result.widgetCode).toBe(expected);
    });
  });
});
