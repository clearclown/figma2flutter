#!/usr/bin/env node
/**
 * CLI entry point for figma2flutter pipeline.
 *
 * Usage:
 *   npx ts-node src/cli/convert.ts <ir.json> [--out-dir <dir>] [--config <config.json>]
 *
 * Reads an IR JSON file, compiles it to Flutter/Dart, validates the IR,
 * and writes the generated files to the target directory.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, join, dirname } from 'path';
import { compileIR, CompilerOptions } from '../compiler/flutter-compiler';
import { validateIR } from '../ir/ir-validator';
import { emitWidgetTest } from '../compiler/test-emitter';
import { IRDocument } from '../ir/schema';
import { TokenConfig } from '../shared/types';

interface CLIConfig {
  targetFlutterProject: string;
  generatedDir: string;
  testDir: string;
  goldenDir: string;
  tokenConfig?: Partial<TokenConfig>;
  screenshotConfig?: {
    scale?: number;
    referenceDir?: string;
    tolerance?: number;
  };
}

function main(): void {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help')) {
    printUsage();
    process.exit(0);
  }

  // Parse arguments
  const irPath = args[0];
  const outDir = getArg(args, '--out-dir');
  const configPath = getArg(args, '--config');
  const generateTests = !args.includes('--no-tests');
  const validateOnly = args.includes('--validate-only');
  const withScreenshots = args.includes('--with-screenshots');

  // Load IR
  const irJson = readFileSync(resolve(irPath), 'utf-8');
  const ir: IRDocument = JSON.parse(irJson);

  // Validate IR
  console.log(`\n🔍 Validating IR: ${irPath}`);
  const validation = validateIR(ir);

  if (validation.warnings.length > 0) {
    for (const w of validation.warnings) {
      console.log(`  ⚠️  [${w.code}] ${w.path}: ${w.message}`);
    }
  }

  if (!validation.valid) {
    console.error('\n❌ IR validation failed:');
    for (const e of validation.errors) {
      console.error(`  ✗ [${e.code}] ${e.path}: ${e.message}`);
    }
    process.exit(1);
  }
  console.log(`  ✓ IR is valid (${Object.keys(ir.tokens.colors).length} colors, ${Object.keys(ir.tokens.typography).length} typography tokens)`);

  if (validateOnly) {
    process.exit(0);
  }

  // Load config
  let config: CLIConfig | undefined;
  if (configPath) {
    config = JSON.parse(readFileSync(resolve(configPath), 'utf-8'));
  } else {
    const defaultConfigPath = resolve('figma2flutter.config.json');
    if (existsSync(defaultConfigPath)) {
      config = JSON.parse(readFileSync(defaultConfigPath, 'utf-8'));
    }
  }

  // Build compiler options from config
  const compilerOptions: CompilerOptions = {};
  if (config?.tokenConfig) {
    compilerOptions.tokenConfig = {
      colorClassName: config.tokenConfig.colorClassName ?? 'AppColors',
      colorImport: config.tokenConfig.colorImport ?? 'app_colors.dart',
      typographyClassName: config.tokenConfig.typographyClassName ?? 'AppTypography',
      typographyImport: config.tokenConfig.typographyImport ?? 'app_typography.dart',
      spacingClassName: config.tokenConfig.spacingClassName ?? 'AppSpacing',
      spacingImport: config.tokenConfig.spacingImport ?? 'app_spacing.dart',
      generateTokenFiles: config.tokenConfig.generateTokenFiles ?? true,
    };
  }

  // Compile IR → Dart
  console.log('\n⚙️  Compiling IR → Flutter/Dart...');
  const result = compileIR(ir, compilerOptions);

  // Determine output directory
  const targetDir = outDir
    ? resolve(outDir)
    : config?.targetFlutterProject
      ? resolve(config.targetFlutterProject.replace('~', process.env.HOME ?? ''), config.generatedDir ?? 'lib/generated')
      : resolve('output');

  const widgetDir = join(targetDir, 'widgets');
  const tokenDir = join(targetDir, 'tokens');
  const irDir = join(targetDir, 'ir');

  // Write widget code
  const widgetName = toSnakeCase(ir.metadata.figmaNodeName);
  mkdirSync(widgetDir, { recursive: true });
  const widgetPath = join(widgetDir, `${widgetName}.dart`);
  writeFileSync(widgetPath, result.widgetCode);
  console.log(`  📝 Widget: ${widgetPath}`);

  // Write token files (if generating)
  const shouldGenerateTokens = compilerOptions.tokenConfig?.generateTokenFiles !== false;
  if (shouldGenerateTokens) {
    mkdirSync(tokenDir, { recursive: true });
    if (result.tokenFiles.colors) {
      writeFileSync(join(tokenDir, 'app_colors.dart'), result.tokenFiles.colors);
    }
    if (result.tokenFiles.typography) {
      writeFileSync(join(tokenDir, 'app_typography.dart'), result.tokenFiles.typography);
    }
    if (result.tokenFiles.spacing) {
      writeFileSync(join(tokenDir, 'app_spacing.dart'), result.tokenFiles.spacing);
    }
    console.log(`  📝 Tokens: ${tokenDir}/`);
  }

  // Save IR for traceability
  mkdirSync(irDir, { recursive: true });
  writeFileSync(join(irDir, `${widgetName}.ir.json`), JSON.stringify(ir, null, 2));
  console.log(`  📝 IR (trace): ${irDir}/${widgetName}.ir.json`);

  // Extract and save screenshots if present
  if (withScreenshots && ir.screenshots) {
    const refDir = config?.screenshotConfig?.referenceDir
      ? resolve(config.targetFlutterProject?.replace('~', process.env.HOME ?? '') ?? '.', config.screenshotConfig.referenceDir)
      : join(targetDir, '..', 'test', 'goldens', 'figma_ref');
    mkdirSync(refDir, { recursive: true });

    const pngBuffer = Buffer.from(ir.screenshots.root.base64, 'base64');
    const refPath = join(refDir, `${widgetName}_figma_ref.png`);
    writeFileSync(refPath, pngBuffer);
    console.log(`  📸 Figma ref: ${refPath}`);
  }

  // Generate widget test
  if (generateTests) {
    const testDir = config?.testDir
      ? resolve(config.targetFlutterProject?.replace('~', process.env.HOME ?? '') ?? '.', config.testDir)
      : join(targetDir, '..', 'test', 'golden', 'generated');

    mkdirSync(testDir, { recursive: true });
    const testCode = emitWidgetTest(ir, {
      widgetImport: `package:app/generated/widgets/${widgetName}.dart`,
      tokenImport: shouldGenerateTokens ? 'package:app/generated/tokens/app_colors.dart' : undefined,
    });
    const testPath = join(testDir, `${widgetName}_test.dart`);
    writeFileSync(testPath, testCode);
    console.log(`  🧪 Test: ${testPath}`);
  }

  console.log('\n✅ Done!\n');
}

function printUsage(): void {
  console.log(`
figma2flutter CLI — Convert Figma IR JSON to Flutter/Dart

Usage:
  npx ts-node src/cli/convert.ts <ir.json> [options]

Options:
  --out-dir <dir>       Output directory for generated files
  --config <path>       Path to figma2flutter.config.json
  --no-tests            Skip test generation
  --with-screenshots    Extract and save Figma reference screenshots as PNG
  --validate-only       Only validate the IR, don't compile
  --help                Show this help message

Examples:
  npx ts-node src/cli/convert.ts design.ir.json
  npx ts-node src/cli/convert.ts design.ir.json --out-dir ./lib/generated
  npx ts-node src/cli/convert.ts design.ir.json --with-screenshots
  npx ts-node src/cli/convert.ts design.ir.json --validate-only
`);
}

function getArg(args: string[], flag: string): string | undefined {
  const idx = args.indexOf(flag);
  if (idx === -1 || idx + 1 >= args.length) return undefined;
  return args[idx + 1];
}

function toSnakeCase(name: string): string {
  return name
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[\s\-\/\.]+/g, '_')
    .toLowerCase();
}

main();
