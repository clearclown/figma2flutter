#!/usr/bin/env node
/**
 * Visual verification CLI — compares Figma reference screenshots with Flutter golden images
 * using Claude Vision API.
 *
 * Usage:
 *   node dist/verify-visual.js <figma_ref.png> <flutter_golden.png> [--ir design.ir.json] [--json]
 */
import { readFileSync, existsSync } from 'fs';
import { resolve, extname } from 'path';

interface VerificationReport {
  score: number;          // 1-10 fidelity score
  pass: boolean;          // score >= 8
  differences: Difference[];
  suggestions: string[];
}

interface Difference {
  category: 'color' | 'spacing' | 'font' | 'layout' | 'border-radius' | 'other';
  severity: 'low' | 'medium' | 'high';
  description: string;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length < 2 || args.includes('--help')) {
    printUsage();
    process.exit(0);
  }

  const figmaRefPath = resolve(args[0]);
  const flutterGoldenPath = resolve(args[1]);
  const irPath = getArg(args, '--ir');
  const jsonOutput = args.includes('--json');

  // Validate files exist
  if (!existsSync(figmaRefPath)) {
    console.error(`Error: Figma reference not found: ${figmaRefPath}`);
    process.exit(1);
  }
  if (!existsSync(flutterGoldenPath)) {
    console.error(`Error: Flutter golden not found: ${flutterGoldenPath}`);
    process.exit(1);
  }

  // Read images as base64
  const figmaRef = readImageAsBase64(figmaRefPath);
  const flutterGolden = readImageAsBase64(flutterGoldenPath);

  // Read IR if provided
  let irContext = '';
  if (irPath) {
    const irFile = resolve(irPath);
    if (existsSync(irFile)) {
      const irDoc = JSON.parse(readFileSync(irFile, 'utf-8'));
      irContext = `\n\nIR Document (design specifications):\n${JSON.stringify(irDoc, null, 2).slice(0, 4000)}`;
    }
  }

  // Check for API key
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('Error: ANTHROPIC_API_KEY environment variable is required');
    console.error('Set it with: export ANTHROPIC_API_KEY=your-key-here');
    process.exit(1);
  }

  console.log('Comparing Figma reference with Flutter golden...\n');

  const report = await compareWithClaude(figmaRef, flutterGolden, irContext, apiKey);

  if (jsonOutput) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    printReport(report);
  }

  process.exit(report.pass ? 0 : 1);
}

async function compareWithClaude(
  figmaRef: { base64: string; mediaType: string },
  flutterGolden: { base64: string; mediaType: string },
  irContext: string,
  apiKey: string,
): Promise<VerificationReport> {
  const prompt = `You are a visual QA engineer comparing a Figma design reference (Image 1) with a Flutter rendering (Image 2).

Analyze both images and identify differences in these categories:
- **Color**: Background, text, border colors
- **Spacing**: Padding, margins, gaps between elements
- **Font**: Size, weight, family, line-height
- **Layout**: Alignment, positioning, sizing
- **Border radius**: Corner rounding

For each difference found, provide:
1. Category (color/spacing/font/layout/border-radius/other)
2. Severity (low/medium/high)
3. Description

Rate the overall fidelity on a scale of 1-10 (10 = pixel-perfect).

Respond in this exact JSON format:
{
  "score": <number 1-10>,
  "differences": [
    { "category": "<category>", "severity": "<severity>", "description": "<description>" }
  ],
  "suggestions": ["<suggestion for fix>"]
}${irContext}`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: figmaRef.mediaType,
                data: figmaRef.base64,
              },
            },
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: flutterGolden.mediaType,
                data: flutterGolden.base64,
              },
            },
            {
              type: 'text',
              text: prompt,
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Anthropic API error (${response.status}): ${errorText}`);
  }

  const data = await response.json() as { content: { type: string; text: string }[] };
  const textContent = data.content.find(c => c.type === 'text');
  if (!textContent) {
    throw new Error('No text response from Claude');
  }

  // Parse JSON from response (may be wrapped in markdown code block)
  const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Could not parse JSON from Claude response');
  }

  const parsed = JSON.parse(jsonMatch[0]) as { score: number; differences: Difference[]; suggestions: string[] };
  return {
    score: parsed.score,
    pass: parsed.score >= 8,
    differences: parsed.differences || [],
    suggestions: parsed.suggestions || [],
  };
}

function readImageAsBase64(filePath: string): { base64: string; mediaType: string } {
  const buffer = readFileSync(filePath);
  const ext = extname(filePath).toLowerCase();
  const mediaType = ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'image/png';
  return {
    base64: buffer.toString('base64'),
    mediaType,
  };
}

function printReport(report: VerificationReport): void {
  const status = report.pass ? 'PASS' : 'FAIL';
  const icon = report.pass ? '✅' : '❌';
  console.log(`${icon} Visual Verification: ${status} (score: ${report.score}/10)\n`);

  if (report.differences.length > 0) {
    console.log('Differences found:');
    for (const diff of report.differences) {
      const severityIcon = diff.severity === 'high' ? '🔴' : diff.severity === 'medium' ? '🟡' : '🟢';
      console.log(`  ${severityIcon} [${diff.category}] ${diff.description}`);
    }
    console.log('');
  }

  if (report.suggestions.length > 0) {
    console.log('Suggestions:');
    for (const suggestion of report.suggestions) {
      console.log(`  → ${suggestion}`);
    }
    console.log('');
  }
}

function printUsage(): void {
  console.log(`
figma2flutter Visual Verification — Compare Figma designs with Flutter renders

Usage:
  node dist/verify-visual.js <figma_ref.png> <flutter_golden.png> [options]

Options:
  --ir <path>     Path to IR JSON for additional context
  --json          Output report as JSON
  --help          Show this help message

Environment:
  ANTHROPIC_API_KEY    Required: Your Anthropic API key
  ANTHROPIC_MODEL      Optional: Model to use (default: claude-sonnet-4-20250514)

Examples:
  node dist/verify-visual.js figma_ref.png flutter_golden.png
  node dist/verify-visual.js figma_ref.png flutter_golden.png --ir design.ir.json
  node dist/verify-visual.js figma_ref.png flutter_golden.png --json
`);
}

function getArg(args: string[], flag: string): string | undefined {
  const idx = args.indexOf(flag);
  if (idx === -1 || idx + 1 >= args.length) return undefined;
  return args[idx + 1];
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
