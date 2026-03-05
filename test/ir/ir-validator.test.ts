import { describe, it, expect } from 'vitest';
import { validateIR, ValidationResult } from '../../src/ir/ir-validator';
import { IRDocument } from '../../src/ir/schema';
import simpleRectFixture from '../fixtures/simple-rectangle.ir.json';
import textNodeFixture from '../fixtures/text-node.ir.json';
import autoLayoutColumnFixture from '../fixtures/auto-layout-column.ir.json';
import componentInstanceFixture from '../fixtures/component-instance.ir.json';
import stackGroupFixture from '../fixtures/stack-group.ir.json';

describe('IR Validator', () => {
  describe('valid documents', () => {
    it('validates simple-rectangle as valid', () => {
      const result = validateIR(simpleRectFixture as unknown as IRDocument);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('validates text-node as valid', () => {
      const result = validateIR(textNodeFixture as unknown as IRDocument);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('validates auto-layout-column as valid', () => {
      const result = validateIR(autoLayoutColumnFixture as unknown as IRDocument);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('validates component-instance as valid', () => {
      const result = validateIR(componentInstanceFixture as unknown as IRDocument);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('validates stack-group as valid', () => {
      const result = validateIR(stackGroupFixture as unknown as IRDocument);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('missing token references', () => {
    it('detects missing color token reference', () => {
      const doc: IRDocument = {
        version: '1.0.0',
        metadata: {
          sourcePluginVersion: '0.1.0',
          figmaFileKey: 'test',
          figmaNodeId: '1:1',
          figmaNodeName: 'Test',
          exportedAt: '2025-01-01T00:00:00.000Z',
        },
        tokens: { colors: {}, typography: {}, spacing: {}, radii: {}, shadows: {} },
        root: {
          id: '1:1',
          name: 'Test',
          type: 'TEXT',
          visible: true,
          opacity: 1,
          rotation: 0,
          size: { width: 100, height: 20 },
          characters: 'Hello',
          typographyRef: 'body/md',
          colorRef: 'missing/color',
          textAlign: 'LEFT',
          verticalAlign: 'TOP',
        },
      };

      const result = validateIR(doc);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'MISSING_TOKEN' && e.path.includes('colorRef'))).toBe(
        true,
      );
      expect(
        result.errors.some((e) => e.code === 'MISSING_TOKEN' && e.path.includes('typographyRef')),
      ).toBe(true);
    });

    it('detects missing fill color reference', () => {
      const doc: IRDocument = {
        version: '1.0.0',
        metadata: {
          sourcePluginVersion: '0.1.0',
          figmaFileKey: 'test',
          figmaNodeId: '1:1',
          figmaNodeName: 'Test',
          exportedAt: '2025-01-01T00:00:00.000Z',
        },
        tokens: { colors: {}, typography: {}, spacing: {}, radii: {}, shadows: {} },
        root: {
          id: '1:1',
          name: 'Test',
          type: 'RECTANGLE',
          visible: true,
          opacity: 1,
          rotation: 0,
          size: { width: 100, height: 100 },
          style: {
            fills: [{ type: 'SOLID', colorRef: 'nonexistent/color', opacity: 1 }],
            strokes: [],
            effects: [],
            borderRadius: { topLeft: 0, topRight: 0, bottomRight: 0, bottomLeft: 0 },
          },
        },
      };

      const result = validateIR(doc);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'MISSING_TOKEN')).toBe(true);
    });
  });

  describe('orphan tokens', () => {
    it('warns about unused color tokens', () => {
      const doc: IRDocument = {
        version: '1.0.0',
        metadata: {
          sourcePluginVersion: '0.1.0',
          figmaFileKey: 'test',
          figmaNodeId: '1:1',
          figmaNodeName: 'Test',
          exportedAt: '2025-01-01T00:00:00.000Z',
        },
        tokens: {
          colors: {
            'used/color': { r: 0, g: 0, b: 0, a: 1 },
            'orphan/color': { r: 1, g: 0, b: 0, a: 1 },
          },
          typography: { 'body/md': { fontFamily: 'Inter', fontWeight: 400, fontSize: 14, lineHeight: { unit: 'PIXELS', value: 20 }, letterSpacing: { unit: 'PIXELS', value: 0 } } },
          spacing: {},
          radii: {},
          shadows: {},
        },
        root: {
          id: '1:1',
          name: 'Test',
          type: 'TEXT',
          visible: true,
          opacity: 1,
          rotation: 0,
          size: { width: 100, height: 20 },
          characters: 'Hello',
          typographyRef: 'body/md',
          colorRef: 'used/color',
          textAlign: 'LEFT',
          verticalAlign: 'TOP',
        },
      };

      const result = validateIR(doc);
      expect(result.valid).toBe(true); // Orphans are warnings, not errors
      expect(result.warnings.some((w) => w.code === 'ORPHAN_TOKEN' && w.message.includes('orphan/color'))).toBe(true);
    });
  });

  describe('invalid ranges', () => {
    it('detects opacity out of range', () => {
      const doc: IRDocument = {
        version: '1.0.0',
        metadata: {
          sourcePluginVersion: '0.1.0',
          figmaFileKey: 'test',
          figmaNodeId: '1:1',
          figmaNodeName: 'Test',
          exportedAt: '2025-01-01T00:00:00.000Z',
        },
        tokens: {
          colors: { 'c': { r: 0, g: 0, b: 0, a: 1 } },
          typography: { 't': { fontFamily: 'Inter', fontWeight: 400, fontSize: 14, lineHeight: { unit: 'PIXELS', value: 20 }, letterSpacing: { unit: 'PIXELS', value: 0 } } },
          spacing: {},
          radii: {},
          shadows: {},
        },
        root: {
          id: '1:1',
          name: 'Test',
          type: 'TEXT',
          visible: true,
          opacity: 1.5, // Invalid!
          rotation: 0,
          size: { width: 100, height: 20 },
          characters: 'Hello',
          typographyRef: 't',
          colorRef: 'c',
          textAlign: 'LEFT',
          verticalAlign: 'TOP',
        },
      };

      const result = validateIR(doc);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'INVALID_RANGE' && e.path.includes('opacity'))).toBe(true);
    });

    it('detects negative size', () => {
      const doc: IRDocument = {
        version: '1.0.0',
        metadata: {
          sourcePluginVersion: '0.1.0',
          figmaFileKey: 'test',
          figmaNodeId: '1:1',
          figmaNodeName: 'Test',
          exportedAt: '2025-01-01T00:00:00.000Z',
        },
        tokens: {
          colors: { 'c': { r: 0, g: 0, b: 0, a: 1 } },
          typography: {},
          spacing: {},
          radii: {},
          shadows: {},
        },
        root: {
          id: '1:1',
          name: 'Test',
          type: 'RECTANGLE',
          visible: true,
          opacity: 1,
          rotation: 0,
          size: { width: -10, height: 100 }, // Invalid!
          style: {
            fills: [{ type: 'SOLID', colorRef: 'c', opacity: 1 }],
            strokes: [],
            effects: [],
            borderRadius: { topLeft: 0, topRight: 0, bottomRight: 0, bottomLeft: 0 },
          },
        },
      };

      const result = validateIR(doc);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'INVALID_RANGE' && e.path.includes('size'))).toBe(true);
    });

    it('detects invalid color token channel values', () => {
      const doc: IRDocument = {
        version: '1.0.0',
        metadata: {
          sourcePluginVersion: '0.1.0',
          figmaFileKey: 'test',
          figmaNodeId: '1:1',
          figmaNodeName: 'Test',
          exportedAt: '2025-01-01T00:00:00.000Z',
        },
        tokens: {
          colors: { 'bad/color': { r: 2, g: 0, b: 0, a: 1 } }, // r out of range
          typography: {},
          spacing: {},
          radii: {},
          shadows: {},
        },
        root: {
          id: '1:1',
          name: 'Test',
          type: 'RECTANGLE',
          visible: true,
          opacity: 1,
          rotation: 0,
          size: { width: 10, height: 10 },
          style: {
            fills: [{ type: 'SOLID', colorRef: 'bad/color', opacity: 1 }],
            strokes: [],
            effects: [],
            borderRadius: { topLeft: 0, topRight: 0, bottomRight: 0, bottomLeft: 0 },
          },
        },
      };

      const result = validateIR(doc);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'INVALID_RANGE' && e.message.includes('channel r'))).toBe(true);
    });
  });
});
