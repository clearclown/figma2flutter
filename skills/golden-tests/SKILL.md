---
name: golden-tests
description: This skill should be used when the user asks to "run golden tests", "update goldens", "visual regression", "golden test failing", "capture golden image", "compare screenshots", or mentions golden testing, visual comparison, or widget screenshot testing for Flutter.
version: 0.1.0
---

# Golden Testing

Manage visual regression testing for generated Flutter widgets.

## Setup

tabechao already has golden test infrastructure at `test/golden_test/` with:
- Tolerant comparator (3% threshold for CI/local rendering differences)
- NotoSansJP + Inter font loading
- Material Icons font loading

For new projects, add `alchemist: ^0.10.0` to `pubspec.yaml` dev_dependencies.

## Writing Golden Tests

Each generated widget gets a golden test:

```dart
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('WidgetName renders correctly', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.light,
        home: Scaffold(body: Center(child: WidgetName())),
      ),
    );
    await expectLater(
      find.byType(WidgetName),
      matchesGoldenFile('goldens/ci/widget_name.png'),
    );
  });
}
```

## Test Naming Convention

- File: `test/golden/generated/<widget_name_snake_case>_golden_test.dart`
- Golden image: `test/goldens/ci/<widget_name>.png`

## Running Tests

```bash
# First run — capture baselines
flutter test --update-goldens test/golden/

# Subsequent runs — compare
flutter test test/golden/

# Specific widget
flutter test test/golden/generated/card_widget_golden_test.dart
```

## Handling Failures

1. Examine the diff in `test/golden_test/failures/`
2. Determine if change was intentional (design update) or regression
3. If intentional: `flutter test --update-goldens` and commit new baselines
4. If regression: fix the widget code

## TDD Integration

1. Write golden test FIRST (red phase)
2. Generate widget implementation (green phase)
3. Run `--update-goldens` to capture baseline
4. Refactor while keeping goldens passing

For CI configuration, consult `references/ci-golden-tests.md`.
