# CI Golden Test Configuration

## GitHub Actions

```yaml
name: Golden Tests
on: [push, pull_request]

jobs:
  golden-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: subosito/flutter-action@v2
        with:
          flutter-version: '3.x'
      - run: flutter pub get
      - run: flutter test --dart-define=CI=true test/golden/
      - name: Upload failure diffs
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: golden-failures
          path: test/golden_test/failures/
```

## tabechao Configuration

tabechao uses a tolerant comparator (3% threshold) in `test/golden_test/flutter_test_config.dart`.
This allows minor font rendering differences between macOS and Linux CI.

## Rules for PRs

- `--update-goldens` should NOT be run in CI
- Golden baseline updates require manual review and explicit commit
- Each golden image change should be visually reviewed before merging
