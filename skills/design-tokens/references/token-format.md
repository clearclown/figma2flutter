# Token Format Reference

## Color Token
```json
{ "r": 0.0-1.0, "g": 0.0-1.0, "b": 0.0-1.0, "a": 0.0-1.0 }
```
Converted to Dart: `Color(0xAARRGGBB)` where each channel is `round(value * 255)`.

## Typography Token
```json
{
  "fontFamily": "Noto Sans JP",
  "fontWeight": 700,
  "fontSize": 24,
  "lineHeight": { "unit": "PIXELS", "value": 32 },
  "letterSpacing": { "unit": "PIXELS", "value": -0.408 }
}
```
Dart `height` = lineHeight.value / fontSize (when unit is PIXELS).

## Spacing Token
Simple `number` value representing logical pixels.

## Naming Convention
- Token key `"primary/500"` → Dart identifier `primary500`
- Split by `/`, `.`, `-`, spaces → camelCase
- First segment lowercase, subsequent segments Title case
