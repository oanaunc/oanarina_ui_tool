# Dynamic stroke prototype derivation safety

Dynamic strokes already reject unsupported saved contour/style/Motion inputs. Prototype variables can also change width or height in an unpublished derived document. Final prototype derivation now invokes the same dynamic-stroke validator after style/layout resolution and before publishing presentation state or rendering Artwork. A width that collapses the coordinate box or exceeds its limit refuses the complete action batch with a local presentation message. Saved source, history, variable state and frame navigation remain unchanged; a normal subsequent navigation remains available.

This is a safety correction, not a wider dynamic-animation capability. Valid static variable-derived boxes remain supported. Two pure cases and two actual browser cases cover zero and oversized variable-bound widths, batch refusal, unchanged source/state and subsequent navigation. No build or release output is generated.
