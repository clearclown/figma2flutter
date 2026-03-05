---
name: figma2flutter
description: This skill should be used when the user asks to "convert figma to flutter", "generate flutter code from figma", "figma to dart", "convert design to widget", "generate widget from design", "figma codegen", "IR to flutter", or mentions converting Figma designs, nodes, or components into Flutter widgets. Provides the complete pipeline for transforming Figma plugin IR output into production-quality Flutter code.
version: 0.1.0
---

# Figma to Flutter Conversion

Convert Figma design intermediate representation (IR) JSON into idiomatic Flutter widget code following a test-driven development pipeline.

## Pipeline Overview

1. **Parse IR** — Read and validate the Figma IR JSON (exported by the Figma codegen plugin)
2. **Extract tokens** — Identify design tokens (colors, typography, spacing) and map to the project theme
3. **Write test first** — Create a golden test for the target widget using alchemist before writing the widget
4. **Generate widget** — Produce a Flutter widget that references theme tokens exclusively
5. **Run golden test** — Execute the golden test and capture the baseline image
6. **Validate** — Ensure no magic numbers; all values reference design tokens

## IR Format

The Figma plugin emits a JSON IR with this structure:

```json
{
  "version": "1.0.0",
  "metadata": { "figmaFileKey": "...", "figmaNodeId": "...", "figmaNodeName": "..." },
  "tokens": {
    "colors": { "primary/500": { "r": 0.23, "g": 0.51, "b": 0.96, "a": 1 } },
    "typography": { "heading/lg": { "fontFamily": "Noto Sans JP", "fontWeight": 700, "fontSize": 24, ... } },
    "spacing": {}, "radii": {}, "shadows": {}
  },
  "root": { "type": "FRAME", "layout": {...}, "style": {...}, "children": [...] }
}
```

All style values in the node tree are **token references** (string keys), never raw values.

For the full IR schema, consult `references/ir-schema.md`.

## Widget Mapping Rules

| Figma Node | Flutter Widget | Condition |
|---|---|---|
| FRAME + auto-layout vertical | `Column` | No style → direct, with style → `Container` wrap |
| FRAME + auto-layout horizontal | `Row` | Same as above |
| FRAME + wrap=true | `Wrap` | |
| FRAME + layout mode=NONE | `Stack` + `Positioned` | |
| TEXT | `Text` / `RichText` | Mixed segments → RichText |
| RECTANGLE | `Container` + `BoxDecoration` | |
| IMAGE | `ClipRRect` + `Image.asset` | |
| COMPONENT | `StatelessWidget` class | |
| INSTANCE | Component class reference | Overrides → constructor params |

For the complete mapping table, consult `references/widget-mapping.md`.

## Code Generation Rules

### Token Usage (Mandatory)

Every generated Dart file MUST reference design tokens. Hard-coded values are forbidden.

```dart
// CORRECT
color: AppColors.primary500,
// FORBIDDEN
color: Color(0xFF3B82F6),
```

### Configuration

The `figma2flutter.config.json` at the project root specifies:
- `targetFlutterProject` — Path to the Flutter project
- `tokenConfig.colorClassName` — Token class name (e.g., "DesignTokens" for tabechao)
- `tokenConfig.generateTokenFiles` — Whether to generate token Dart files

### TDD Workflow

1. Create golden test FIRST at `test/golden/generated/<widget>_golden_test.dart`
2. Generate widget at `lib/generated/widgets/<widget>.dart`
3. Run `flutter test --update-goldens` to capture baseline
4. Verify golden matches Figma design intent

## Building the Plugin

```bash
npm run build    # esbuild → dist/main.js
npm test         # vitest: IR → Dart compilation tests
```

## Additional Resources

- **`references/ir-schema.md`** — Complete IR JSON schema with all node types
- **`references/widget-mapping.md`** — Exhaustive Figma→Flutter widget mapping
- **`examples/sample-ir.json`** — Example Figma IR JSON
- **`examples/sample-widget.dart`** — Expected Flutter output
