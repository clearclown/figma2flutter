/** Configuration for the target Flutter project */
export interface ProjectConfig {
  targetFlutterProject: string;
  generatedDir: string;
  testDir: string;
  goldenDir: string;
  tokenConfig: TokenConfig;
  screenshotConfig?: ScreenshotConfig;
  verificationConfig?: VerificationConfig;
}

/** Configuration for design token class references in generated code */
export interface TokenConfig {
  colorClassName: string;
  colorImport: string;
  typographyClassName: string;
  typographyImport: string;
  spacingClassName: string;
  spacingImport: string;
  /** If true, generate token Dart files. If false, reference existing classes. */
  generateTokenFiles: boolean;
}

/** Configuration for screenshot reference extraction */
export interface ScreenshotConfig {
  scale: number;           // default: 2
  referenceDir: string;    // default: 'test/goldens/figma_ref'
  tolerance: number;       // default: 0.03 (3%)
}

/** Configuration for Claude AI visual verification */
export interface VerificationConfig {
  enabled: boolean;
  anthropicModel: string;  // default: 'claude-sonnet-4-20250514'
  autoVerifyOnFailure: boolean;
}

/** Default config for standalone projects (generates its own token files) */
export const DEFAULT_CONFIG: ProjectConfig = {
  targetFlutterProject: '.',
  generatedDir: 'lib/generated',
  testDir: 'test/golden/generated',
  goldenDir: 'test/goldens/ci',
  tokenConfig: {
    colorClassName: 'AppColors',
    colorImport: 'app_colors.dart',
    typographyClassName: 'AppTypography',
    typographyImport: 'app_typography.dart',
    spacingClassName: 'AppSpacing',
    spacingImport: 'app_spacing.dart',
    generateTokenFiles: true,
  },
};
