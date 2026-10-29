# Explicit color contrast checker

Expand **Color contrast checker** near the bottom of the right inspector in Design or Inspect mode. Enter foreground/background hex colors and foreground opacity. The calculator composites foreground sRGB channels over the explicitly opaque background, then uses WCAG 2.x relative luminance to report the contrast ratio and normal/large text AA/AAA thresholds. Pass/fail compares the full ratio, before the three-decimal display rounding.

Select one layer with exactly one visible solid fill, then choose **Use selected paint** to copy that paint's color and opacity. **Use as background** copies its color as an opaque background. These actions change the calculator only; they never recolor or mutate a design. Invalid color input hides results and returns to the last valid color on blur. The calculator is a temporary inspection tool, not document data.

This is a color-pair check, not an automatic canvas or document accessibility audit. It does not sample backgrounds, resolve overlap or clipping, evaluate gradients/images, ancestor opacity, layer blends/effects/strokes, rich text ranges or transformed font sizing. A copied paint's opacity excludes layer/ancestor opacity. It does not identify incidental text, logos, inactive controls or other WCAG exceptions. Full accessibility auditing remains partial in the feature register.

Formula and text threshold guidance: [WCAG 2.2 contrast minimum](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) and [contrast enhanced](https://www.w3.org/WAI/WCAG22/Understanding/contrast-enhanced.html). Large text means at least 24 CSS px regular or 18⅔ CSS px bold; a design's eventual output scaling matters.

Validation: reference black/white and identical pairs; #777777/white below 4.5; unrounded threshold boundaries; foreground alpha over light/dark backgrounds; invalid-input rejection; reachable inspector interactions; disabled complex-paint extraction; saved document remains unchanged.
