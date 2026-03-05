import { IRColorToken } from '../../ir/schema';

/** Convert 0-1 float to 0-255 integer */
function to8bit(value: number): number {
  return Math.round(Math.min(1, Math.max(0, value)) * 255);
}

/** Convert IRColorToken to Flutter Color hex string: 0xAARRGGBB */
export function colorTokenToHex(token: IRColorToken): string {
  const a = to8bit(token.a);
  const r = to8bit(token.r);
  const g = to8bit(token.g);
  const b = to8bit(token.b);
  const hex = ((a << 24) | (r << 16) | (g << 8) | b) >>> 0;
  return `0x${hex.toString(16).toUpperCase().padStart(8, '0')}`;
}

/** Convert a token key like "primary/500" to a valid Dart identifier like "primary500" */
export function tokenKeyToDartName(key: string): string {
  // Split by / . - and spaces, then camelCase
  const parts = key.split(/[\/\.\-\s]+/);
  return parts
    .map((part, index) => {
      if (index === 0) {
        return part.charAt(0).toLowerCase() + part.slice(1);
      }
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join('');
}
