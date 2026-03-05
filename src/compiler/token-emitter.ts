import { IRTokens } from '../ir/schema';
import { colorTokenToHex, tokenKeyToDartName } from '../plugin/utils/color-utils';
import { GENERATED_HEADER } from '../shared/constants';
import { formatDart } from './dart-formatter';

export interface TokenFiles {
  colors: string;
  typography: string;
  spacing: string;
}

export function emitTokenFiles(tokens: IRTokens): TokenFiles {
  return {
    colors: emitColors(tokens.colors),
    typography: emitTypography(tokens.typography),
    spacing: emitSpacing(tokens.spacing),
  };
}

function emitColors(
  colors: IRTokens['colors'],
): string {
  const entries = Object.entries(colors).sort(([a], [b]) => a.localeCompare(b));
  if (entries.length === 0) {
    return formatDart(`${GENERATED_HEADER}
import 'package:flutter/material.dart';

abstract final class AppColors {
}
`);
  }

  const lines = entries.map(([key, token]) => {
    const name = tokenKeyToDartName(key);
    const hex = colorTokenToHex(token);
    return `  static const Color ${name} = Color(${hex});`;
  });

  return formatDart(`${GENERATED_HEADER}
import 'package:flutter/material.dart';

abstract final class AppColors {
${lines.join('\n')}
}
`);
}

function emitTypography(
  typography: IRTokens['typography'],
): string {
  const entries = Object.entries(typography).sort(([a], [b]) => a.localeCompare(b));
  if (entries.length === 0) {
    return formatDart(`${GENERATED_HEADER}
import 'package:flutter/material.dart';

abstract final class AppTypography {
}
`);
  }

  const lines = entries.map(([key, token]) => {
    const name = tokenKeyToDartName(key);
    const heightValue =
      token.lineHeight.unit === 'AUTO'
        ? null
        : token.lineHeight.unit === 'PIXELS'
          ? token.lineHeight.value / token.fontSize
          : token.lineHeight.value / 100;
    const heightLine = heightValue !== null ? `\n    height: ${heightValue},` : '';
    const letterSpacingValue =
      token.letterSpacing.unit === 'PIXELS'
        ? token.letterSpacing.value
        : (token.letterSpacing.value / 100) * token.fontSize;
    const letterSpacingLine =
      letterSpacingValue !== 0 ? `\n    letterSpacing: ${letterSpacingValue},` : '';

    return `  static const TextStyle ${name} = TextStyle(
    fontFamily: '${token.fontFamily}',
    fontWeight: FontWeight.w${token.fontWeight},
    fontSize: ${token.fontSize},${heightLine}${letterSpacingLine}
  );`;
  });

  return formatDart(`${GENERATED_HEADER}
import 'package:flutter/material.dart';

abstract final class AppTypography {
${lines.join('\n\n')}
}
`);
}

function emitSpacing(
  spacing: IRTokens['spacing'],
): string {
  const entries = Object.entries(spacing).sort(([a], [b]) => a.localeCompare(b));
  if (entries.length === 0) {
    return formatDart(`${GENERATED_HEADER}

abstract final class AppSpacing {
}
`);
  }

  const lines = entries.map(([key, value]) => {
    const name = tokenKeyToDartName(key);
    return `  static const double ${name} = ${value};`;
  });

  return formatDart(`${GENERATED_HEADER}

abstract final class AppSpacing {
${lines.join('\n')}
}
`);
}
