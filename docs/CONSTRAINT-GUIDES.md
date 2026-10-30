# Unreleased constraint visualization

Select one child of a frame, component or instance and enable **Show constraint
guides** in the inspector. Positional children of auto layout are included when
**Ignore auto layout** is enabled. Flowing auto-layout children, page roots and
plain group children do not use frame constraints and have no guide control.

Guides show the active horizontal and vertical pins in the parent's axes: start,
end, center, both edges for stretch, or dashed pairs for proportional scale. They
connect the unrotated layout box used by the constraint engine, so a child's own
rotation does not change the pin calculation. Ancestor rotation, reflection and
nonuniform scale transform the guides along with the parent. Hidden hierarchies,
multiple selections, vector editing and prototype mode omit the overlay.

This is view-only state. It adds no document fields or Undo entries and is absent
from SVG/raster exports. It does not extend the existing resizing algorithm;
aspect ratios in auto layout, responsive layout completeness and grid-relative
constraints remain separate requirements. Core coordinate checks cover modes,
transformed ancestors and ineligible parents. Browser checks cover the reachable
toggle, rule changes, persistence and Undo without document edits from the toggle.
