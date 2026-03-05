---
description: Run golden test suite for generated Flutter widgets
argument-hint: [--update] [specific_test_file]
allowed-tools: Read, Bash, Grep, Glob
---

Run or update golden tests for generated Flutter widgets.

Load the **golden-tests** skill for guidance.

## Process

Given input: $ARGUMENTS

1. Read `figma2flutter.config.json` for the target Flutter project path.

2. Discover all `*_golden_test.dart` files in the test directory.

3. Run tests:
   - If `--update` specified: `flutter test --update-goldens {testDir}/`
   - If specific file given: `flutter test [--update-goldens] {file}`
   - Otherwise: `flutter test {testDir}/`

4. Analyze results: count passed/failed, identify which widgets changed.

5. For failures: recommend updating goldens (if intentional) or fixing the widget.
