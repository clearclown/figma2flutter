import { IRTokens, IRColorToken, IRTypographyToken } from '../../ir/schema';

/**
 * TokenExtractor accumulates design tokens during node extraction.
 * All colors, typography, spacing etc. are registered here and referenced by key.
 */
export class TokenExtractor {
  private colors: Map<string, IRColorToken> = new Map();
  private typography: Map<string, IRTypographyToken> = new Map();
  private spacingValues: Map<string, number> = new Map();
  private radiiValues: Map<string, number> = new Map();

  /**
   * Register a color and return its token key.
   * If a Figma variable name is provided, use it. Otherwise auto-generate.
   */
  registerColor(r: number, g: number, b: number, a: number, variableName?: string): string {
    const token: IRColorToken = { r, g, b, a };

    if (variableName) {
      this.colors.set(variableName, token);
      return variableName;
    }

    // Check if we already have this exact color
    for (const [existingKey, existingToken] of this.colors) {
      if (
        existingToken.r === r &&
        existingToken.g === g &&
        existingToken.b === b &&
        existingToken.a === a
      ) {
        return existingKey;
      }
    }

    // Auto-generate key from hex value
    const hex = this.colorToHexKey(r, g, b, a);
    const key = `color/raw/${hex}`;
    this.colors.set(key, token);
    return key;
  }

  /**
   * Register a typography token and return its key.
   * Deduplicates based on exact property match.
   */
  registerTypography(
    fontFamily: string,
    fontWeight: number,
    fontSize: number,
    lineHeight: IRTypographyToken['lineHeight'],
    letterSpacing: IRTypographyToken['letterSpacing'],
    variableName?: string,
  ): string {
    const token: IRTypographyToken = { fontFamily, fontWeight, fontSize, lineHeight, letterSpacing };

    if (variableName) {
      this.typography.set(variableName, token);
      return variableName;
    }

    // Check for existing identical typography token
    for (const [existingKey, existing] of this.typography) {
      if (
        existing.fontFamily === fontFamily &&
        existing.fontWeight === fontWeight &&
        existing.fontSize === fontSize &&
        existing.lineHeight.unit === lineHeight.unit &&
        existing.lineHeight.value === lineHeight.value &&
        existing.letterSpacing.unit === letterSpacing.unit &&
        existing.letterSpacing.value === letterSpacing.value
      ) {
        return existingKey;
      }
    }

    // Auto-generate key from properties
    const weightName = this.weightToName(fontWeight);
    const key = `typography/${fontFamily.toLowerCase().replace(/\s+/g, '-')}/${weightName}/${fontSize}`;
    this.typography.set(key, token);
    return key;
  }

  registerSpacing(value: number): string {
    const key = `spacing/${value}`;
    this.spacingValues.set(key, value);
    return key;
  }

  registerRadius(value: number): string {
    const key = `radius/${value}`;
    this.radiiValues.set(key, value);
    return key;
  }

  getTokens(): IRTokens {
    return {
      colors: Object.fromEntries(this.colors),
      typography: Object.fromEntries(this.typography),
      spacing: Object.fromEntries(this.spacingValues),
      radii: Object.fromEntries(this.radiiValues),
      shadows: {},
    };
  }

  private colorToHexKey(r: number, g: number, b: number, a: number): string {
    const to8 = (v: number) => Math.round(Math.min(1, Math.max(0, v)) * 255);
    const hex = ((to8(a) << 24) | (to8(r) << 16) | (to8(g) << 8) | to8(b)) >>> 0;
    return hex.toString(16).toUpperCase().padStart(8, '0');
  }

  private weightToName(weight: number): string {
    const names: Record<number, string> = {
      100: 'thin',
      200: 'extralight',
      300: 'light',
      400: 'regular',
      500: 'medium',
      600: 'semibold',
      700: 'bold',
      800: 'extrabold',
      900: 'black',
    };
    return names[weight] ?? `w${weight}`;
  }
}
