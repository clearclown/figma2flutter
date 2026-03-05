---
description: Validate generated Flutter code against Figma IR and coding standards
argument-hint: [path/to/widget.dart] [path/to/ir.json]
allowed-tools: Read, Grep, Glob, Bash
---

Validate that generated Flutter widget code correctly implements the Figma design.

Load the **figma2flutter** skill for guidance.

## Process

Given input: $ARGUMENTS

1. Locate the widget Dart file and its corresponding IR JSON (check `{generatedDir}/ir/` by name).

2. **Token compliance**: Scan for hard-coded values:
   - `Color(0x...)` or `Colors.xxx` literals
   - Raw `double` in TextStyle fontSize
   - Raw `double` in EdgeInsets
   - Report violations with line numbers

3. **Structure verification**: Compare widget tree against IR:
   - Node hierarchy matches (Column/Row/Stack usage)
   - All Figma children are represented
   - Text content matches

4. **Code quality**: Check `const` constructors, StatelessWidget usage, Theme.of(context).

5. **Golden test existence**: Confirm a corresponding golden test exists.

6. Report: PASS/FAIL per check, specific violations, recommendations.
