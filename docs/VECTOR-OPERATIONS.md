# Vector endpoint and point-group editing

Select two sibling open vector layers and use Vector → Join vector endpoints (Command-J), or Smooth join (Shift-Command-J). The closest endpoint pair determines orientation. The first layer's appearance is retained; geometry is merged into one editable path. Only two leaf vector layers with the same parent are accepted. Closed contours, booleans, mixed parents and containers are rejected before mutation.

Within Edit vector points, select anchors with click or Shift-click. Join requires two open endpoints and either connects two contours or closes one contour. Smooth join preserves tangent directions with a cubic connection. Split at points separates an open path into contours, or opens a closed contour without dropping its closing segment. These are contours in one layer; slicing them into independent layers is a separate unfinished feature.

Delete and heal (Shift-Delete) removes selected anchors and fits a tangent connection between surviving neighbors. Healing is an approximation; inspect the resulting curve. Ordinary Delete retains the existing removal behavior. Degenerate results with fewer than two open-path or three closed-path anchors are rejected.

The point inspector scales or rotates a selected anchor group around its bounding-box center, including tangent vectors. These transformations and endpoint operations use normal undo and .oui persistence. Scalar controls are explicit percentages and degrees. Arbitrary vector networks, branch-region fills, offset paths, cut/eraser tools and exact Figma curve-fitting semantics remain unfinished.
