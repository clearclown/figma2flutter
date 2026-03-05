---
name: figma-verify
description: Verify Flutter output matches Figma design using Claude Vision
arguments:
  - name: widget-name
    description: Name of the widget to verify (snake_case)
    required: true
---

# /figma-verify

Verify that the Flutter golden test output matches the Figma reference screenshot for a specific widget.

## Steps

1. **Find reference files**:
   - Figma reference: `test/goldens/figma_ref/$ARGUMENTS_figma_ref.png`
   - Flutter golden: Find in the project's golden test output directory
   - IR JSON: `output/ir/$ARGUMENTS.ir.json` or `test/fixtures/$ARGUMENTS.ir.json`

2. **Build the verify-visual CLI** if not already built:
   ```bash
   npm run build:verify
   ```

3. **Run verification**:
   ```bash
   node dist/verify-visual.js \
     test/goldens/figma_ref/$ARGUMENTS_figma_ref.png \
     test/goldens/ci/$ARGUMENTS.png \
     --ir output/ir/$ARGUMENTS.ir.json
   ```

4. **Analyze results**: If the score is below 8/10, investigate the specific differences and suggest code fixes in the relevant emitter files.

5. **Report**: Present a summary of the verification results, including fidelity score, differences found, and recommended fixes.
