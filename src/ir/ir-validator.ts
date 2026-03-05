import {
  IRDocument,
  IRNode,
  IRTextNode,
  IRFrameNode,
  IRRectangleNode,
  IRImageNode,
  IRComponentNode,
  IRInstanceNode,
  IRGroupNode,
  IRVectorNode,
  IRBoxStyle,
} from './schema';

export interface ValidationError {
  path: string;
  code: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

/** Validate an IR document for structural correctness and token reference integrity */
export function validateIR(doc: IRDocument): ValidationResult {
  const issues: ValidationError[] = [];

  // Version check
  if (doc.version !== '1.0.0') {
    issues.push({
      path: 'version',
      code: 'INVALID_VERSION',
      message: `Unsupported version: ${doc.version}`,
      severity: 'error',
    });
  }

  // Metadata check
  if (!doc.metadata.figmaNodeId) {
    issues.push({
      path: 'metadata.figmaNodeId',
      code: 'MISSING_FIELD',
      message: 'figmaNodeId is required',
      severity: 'error',
    });
  }

  // Collect used token references
  const usedColors = new Set<string>();
  const usedTypography = new Set<string>();

  // Validate node tree recursively
  validateNode(doc.root, 'root', doc, issues, usedColors, usedTypography);

  // Orphan token detection
  for (const key of Object.keys(doc.tokens.colors)) {
    if (!usedColors.has(key)) {
      issues.push({
        path: `tokens.colors["${key}"]`,
        code: 'ORPHAN_TOKEN',
        message: `Color token "${key}" is defined but never referenced`,
        severity: 'warning',
      });
    }
  }
  for (const key of Object.keys(doc.tokens.typography)) {
    if (!usedTypography.has(key)) {
      issues.push({
        path: `tokens.typography["${key}"]`,
        code: 'ORPHAN_TOKEN',
        message: `Typography token "${key}" is defined but never referenced`,
        severity: 'warning',
      });
    }
  }

  // Color token value validation
  for (const [key, color] of Object.entries(doc.tokens.colors)) {
    for (const ch of ['r', 'g', 'b', 'a'] as const) {
      if (color[ch] < 0 || color[ch] > 1) {
        issues.push({
          path: `tokens.colors["${key}"].${ch}`,
          code: 'INVALID_RANGE',
          message: `Color channel ${ch} value ${color[ch]} is out of range [0, 1]`,
          severity: 'error',
        });
      }
    }
  }

  const errors = issues.filter((i) => i.severity === 'error');
  const warnings = issues.filter((i) => i.severity === 'warning');

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

function validateNode(
  node: IRNode,
  path: string,
  doc: IRDocument,
  issues: ValidationError[],
  usedColors: Set<string>,
  usedTypography: Set<string>,
): void {
  // Common field validation
  if (node.opacity < 0 || node.opacity > 1) {
    issues.push({
      path: `${path}.opacity`,
      code: 'INVALID_RANGE',
      message: `Opacity ${node.opacity} is out of range [0, 1]`,
      severity: 'error',
    });
  }
  if (node.size.width < 0 || node.size.height < 0) {
    issues.push({
      path: `${path}.size`,
      code: 'INVALID_RANGE',
      message: 'Size dimensions cannot be negative',
      severity: 'error',
    });
  }

  switch (node.type) {
    case 'TEXT': {
      const text = node as IRTextNode;
      validateColorRef(text.colorRef, `${path}.colorRef`, doc, issues, usedColors);
      validateTypographyRef(text.typographyRef, `${path}.typographyRef`, doc, issues, usedTypography);

      if (text.segments) {
        for (let i = 0; i < text.segments.length; i++) {
          const seg = text.segments[i];
          validateColorRef(seg.colorRef, `${path}.segments[${i}].colorRef`, doc, issues, usedColors);
          validateTypographyRef(
            seg.typographyRef,
            `${path}.segments[${i}].typographyRef`,
            doc,
            issues,
            usedTypography,
          );
        }
      }
      break;
    }

    case 'RECTANGLE': {
      const rect = node as IRRectangleNode;
      validateBoxStyle(rect.style, `${path}.style`, doc, issues, usedColors);
      break;
    }

    case 'FRAME': {
      const frame = node as IRFrameNode;
      validateBoxStyle(frame.style, `${path}.style`, doc, issues, usedColors);
      validateChildren(frame.children, path, doc, issues, usedColors, usedTypography);
      break;
    }

    case 'COMPONENT': {
      const comp = node as IRComponentNode;
      validateBoxStyle(comp.style, `${path}.style`, doc, issues, usedColors);
      validateChildren(comp.children, path, doc, issues, usedColors, usedTypography);
      break;
    }

    case 'INSTANCE': {
      const inst = node as IRInstanceNode;
      validateBoxStyle(inst.style, `${path}.style`, doc, issues, usedColors);
      validateChildren(inst.children, path, doc, issues, usedColors, usedTypography);
      break;
    }

    case 'GROUP': {
      const group = node as IRGroupNode;
      if (group.children.length === 0) {
        issues.push({
          path: `${path}.children`,
          code: 'EMPTY_CHILDREN',
          message: 'GROUP node has no children',
          severity: 'warning',
        });
      }
      validateChildren(group.children, path, doc, issues, usedColors, usedTypography);
      break;
    }

    case 'IMAGE': {
      const img = node as IRImageNode;
      if (!img.imageRef) {
        issues.push({
          path: `${path}.imageRef`,
          code: 'MISSING_FIELD',
          message: 'IMAGE node requires imageRef',
          severity: 'error',
        });
      }
      validateBoxStyle(img.style, `${path}.style`, doc, issues, usedColors);
      break;
    }

    case 'VECTOR': {
      const vec = node as IRVectorNode;
      validateBoxStyle(vec.style, `${path}.style`, doc, issues, usedColors);
      break;
    }
  }
}

function validateChildren(
  children: IRNode[],
  parentPath: string,
  doc: IRDocument,
  issues: ValidationError[],
  usedColors: Set<string>,
  usedTypography: Set<string>,
): void {
  for (let i = 0; i < children.length; i++) {
    validateNode(children[i], `${parentPath}.children[${i}]`, doc, issues, usedColors, usedTypography);
  }
}

function validateColorRef(
  ref: string,
  path: string,
  doc: IRDocument,
  issues: ValidationError[],
  usedColors: Set<string>,
): void {
  usedColors.add(ref);
  if (!doc.tokens.colors[ref]) {
    issues.push({
      path,
      code: 'MISSING_TOKEN',
      message: `Color token "${ref}" not found in tokens.colors`,
      severity: 'error',
    });
  }
}

function validateTypographyRef(
  ref: string,
  path: string,
  doc: IRDocument,
  issues: ValidationError[],
  usedTypography: Set<string>,
): void {
  usedTypography.add(ref);
  if (!doc.tokens.typography[ref]) {
    issues.push({
      path,
      code: 'MISSING_TOKEN',
      message: `Typography token "${ref}" not found in tokens.typography`,
      severity: 'error',
    });
  }
}

function validateBoxStyle(
  style: IRBoxStyle,
  path: string,
  doc: IRDocument,
  issues: ValidationError[],
  usedColors: Set<string>,
): void {
  for (let i = 0; i < style.fills.length; i++) {
    const fill = style.fills[i];
    if (fill.colorRef) {
      validateColorRef(fill.colorRef, `${path}.fills[${i}].colorRef`, doc, issues, usedColors);
    }
    if (fill.gradientStops) {
      for (let j = 0; j < fill.gradientStops.length; j++) {
        validateColorRef(
          fill.gradientStops[j].colorRef,
          `${path}.fills[${i}].gradientStops[${j}].colorRef`,
          doc,
          issues,
          usedColors,
        );
      }
    }
  }

  for (let i = 0; i < style.strokes.length; i++) {
    validateColorRef(style.strokes[i].colorRef, `${path}.strokes[${i}].colorRef`, doc, issues, usedColors);
  }

  for (let i = 0; i < style.effects.length; i++) {
    const effect = style.effects[i];
    if (effect.shadowRef) {
      if (!doc.tokens.shadows[effect.shadowRef]) {
        issues.push({
          path: `${path}.effects[${i}].shadowRef`,
          code: 'MISSING_TOKEN',
          message: `Shadow token "${effect.shadowRef}" not found in tokens.shadows`,
          severity: 'error',
        });
      }
    }
  }
}
