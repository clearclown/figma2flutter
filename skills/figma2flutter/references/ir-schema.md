# IR Schema Reference

## IRDocument (Top-level)

```typescript
{
  version: "1.0.0",
  metadata: IRMetadata,
  tokens: IRTokens,
  root: IRNode
}
```

## IRTokens

```typescript
{
  colors: Record<string, { r: number, g: number, b: number, a: number }>,
  typography: Record<string, {
    fontFamily: string, fontWeight: number, fontSize: number,
    lineHeight: { unit: "PIXELS"|"PERCENT"|"AUTO", value: number },
    letterSpacing: { unit: "PIXELS"|"PERCENT", value: number }
  }>,
  spacing: Record<string, number>,
  radii: Record<string, number>,
  shadows: Record<string, {
    type: "DROP_SHADOW"|"INNER_SHADOW", colorRef: string,
    offset: { x: number, y: number }, blurRadius: number, spreadRadius: number
  }>
}
```

## Node Types

### FRAME
```typescript
{ type: "FRAME", layout: IRLayout, style: IRBoxStyle, clipsContent: boolean, children: IRNode[] }
```

### TEXT
```typescript
{ type: "TEXT", characters: string, typographyRef: string, colorRef: string,
  textAlign: "LEFT"|"CENTER"|"RIGHT"|"JUSTIFIED", segments?: IRTextSegment[] }
```

### RECTANGLE
```typescript
{ type: "RECTANGLE", style: IRBoxStyle }
```

### IMAGE
```typescript
{ type: "IMAGE", imageRef: string, scaleMode: "FILL"|"FIT"|"CROP"|"TILE", style: IRBoxStyle }
```

### COMPONENT / INSTANCE
```typescript
{ type: "COMPONENT", componentKey: string, layout: IRLayout, style: IRBoxStyle, children: IRNode[] }
{ type: "INSTANCE", componentRef: string, overrides: Record<string, unknown>, ... }
```

## IRLayout
```typescript
{
  mode: "NONE"|"HORIZONTAL"|"VERTICAL",
  primaryAxisAlign: "START"|"CENTER"|"END"|"SPACE_BETWEEN",
  counterAxisAlign: "START"|"CENTER"|"END"|"STRETCH",
  primaryAxisSizing: "FIXED"|"HUG", counterAxisSizing: "FIXED"|"HUG",
  padding: { top, right, bottom, left },
  itemSpacing: number, wrap: boolean,
  childOverrides?: Record<string, { layoutAlign: "INHERIT"|"STRETCH", layoutGrow: number }>
}
```

## IRBoxStyle
```typescript
{
  fills: [{ type: "SOLID"|"LINEAR_GRADIENT"|"RADIAL_GRADIENT", colorRef?: string, opacity: number }],
  strokes: [{ colorRef: string, weight: number, align: "INSIDE"|"OUTSIDE"|"CENTER" }],
  effects: [{ type: "DROP_SHADOW"|"INNER_SHADOW"|"LAYER_BLUR", shadowRef?: string }],
  borderRadius: { topLeft, topRight, bottomRight, bottomLeft }
}
```

## Common Node Base
All nodes share: `id`, `name`, `type`, `visible`, `opacity`, `rotation`, `size: { width, height }`, optional `position: { x, y }`.
