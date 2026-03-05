import { NodeExtractor } from './extractor/node-extractor';
import { extractScreenshots } from './extractor/screenshot-extractor';
import { compileIR } from '../compiler/flutter-compiler';

// Figma codegen event handler (async for SVG export support)
figma.codegen.on('generate', async (event): Promise<CodegenResult[]> => {
  const extractor = new NodeExtractor();

  // Extract file key from the current document
  const fileKey = figma.fileKey ?? 'unknown';

  // Build the IR document (async for SVG/screenshot export)
  const irDoc = await extractor.extract(event.node, fileKey);

  // Include screenshots if preference is enabled
  const settings = figma.codegen.preferences.customSettings;
  if (settings?.screenshots === 'true') {
    try {
      irDoc.screenshots = await extractScreenshots(event.node);
    } catch {
      // Screenshot export failed — continue without screenshots
    }
  }

  // Return based on selected language
  if (event.language === 'ir-json') {
    return [
      {
        language: 'JSON',
        code: JSON.stringify(irDoc, null, 2),
        title: 'Figma IR',
      },
    ];
  }

  // Default: Flutter/Dart output
  const result = compileIR(irDoc);

  // Combine widget code and token classes
  const fullOutput = [
    '// === Widget Code ===',
    result.widgetCode,
    '',
    '// === AppColors ===',
    result.tokenFiles.colors,
  ].join('\n');

  return [
    {
      language: 'KOTLIN', // Closest to Dart syntax highlighting available in Figma
      code: fullOutput,
      title: 'Flutter',
    },
  ];
});
