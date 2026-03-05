---
description: Convert Figma IR JSON to Flutter widget code via TDD pipeline
argument-hint: [path/to/figma-ir.json]
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
---

Convert a Figma design IR JSON file into a production-quality Flutter widget.

Load the **figma2flutter** and **design-tokens** skills for guidance.

## Process

Given input: $ARGUMENTS

1. Read `figma2flutter.config.json` to get the target Flutter project path and token config.

2. Locate and read the Figma IR JSON file. Validate it has `version`, `metadata`, `tokens`, and `root` fields.

3. Read the IR root node to understand the widget structure. Map Figma nodes to Flutter widgets per the figma2flutter skill mapping rules.

4. Check the target project's existing token classes. If `tokenConfig.generateTokenFiles` is false, verify the referenced token class exists.

5. Write the golden test FIRST at `{testDir}/{widget_name}_golden_test.dart`.

6. Generate the Flutter widget at `{generatedDir}/widgets/{widget_name}.dart`. Reference ALL style values through the configured token class name. Use `const` constructors where possible.

7. Save the IR JSON to `{generatedDir}/ir/{widget_name}.ir.json` for traceability.

8. Run `flutter test --update-goldens` in the target project to capture baseline golden images.

9. Validate: grep for hard-coded color/font/spacing values in the generated code.

10. Report: list generated files, token references used, golden test status.
