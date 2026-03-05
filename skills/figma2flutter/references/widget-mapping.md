# Widget Mapping Reference

## Figma Node → Flutter Widget Mapping

### FRAME (Auto-Layout)

| Condition | Flutter | Notes |
|---|---|---|
| mode=VERTICAL, no style | `Column(children: [...])` | Pure flex |
| mode=VERTICAL, with style | `Container(decoration: ..., child: Column(...))` | Styled flex |
| mode=HORIZONTAL, no style | `Row(children: [...])` | Pure flex |
| mode=HORIZONTAL, with style | `Container(decoration: ..., child: Row(...))` | Styled flex |
| wrap=true | `Wrap(direction: ..., children: [...])` | Wrapping layout |
| mode=NONE | `Stack(children: [...Positioned(...)])` | Absolute positioning |

### Alignment Mapping

| IR primaryAxisAlign | Flutter MainAxisAlignment |
|---|---|
| START | MainAxisAlignment.start |
| CENTER | MainAxisAlignment.center |
| END | MainAxisAlignment.end |
| SPACE_BETWEEN | MainAxisAlignment.spaceBetween |

| IR counterAxisAlign | Flutter CrossAxisAlignment |
|---|---|
| START | CrossAxisAlignment.start |
| CENTER | CrossAxisAlignment.center |
| END | CrossAxisAlignment.end |
| STRETCH | CrossAxisAlignment.stretch |

### Sizing

| IR | Flutter |
|---|---|
| primaryAxisSizing=HUG | MainAxisSize.min |
| primaryAxisSizing=FIXED | SizedBox wrapper or MainAxisSize.max |
| childOverrides.layoutGrow=1 | Wrap child in Expanded |

### Spacing

- `itemSpacing` → `SizedBox(height: N)` between Column children, `SizedBox(width: N)` between Row children
- `padding` → `EdgeInsets.all()` / `EdgeInsets.symmetric()` / `EdgeInsets.only()`

### TEXT

```dart
Text('characters', style: AppTypography.ref.copyWith(color: AppColors.ref), textAlign: ...)
```
Mixed segments → `RichText` with `TextSpan` children.

### RECTANGLE

```dart
Container(width: W, height: H, decoration: BoxDecoration(color: ..., borderRadius: ..., border: ...))
```

### IMAGE

```dart
ClipRRect(borderRadius: ..., child: Image.asset('ref', width: W, height: H, fit: BoxFit.cover))
```

| IR scaleMode | Flutter BoxFit |
|---|---|
| FILL | BoxFit.cover |
| FIT | BoxFit.contain |
| CROP | BoxFit.cover (with clip) |
| TILE | ImageRepeat.repeat |

### COMPONENT → StatelessWidget class definition
### INSTANCE → Component class reference with override params
### GROUP → Stack with Positioned children
