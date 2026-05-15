// ==========================================
// TREE ENGINE CORE
// 3D Tree Layout and Visualization Logic
// ==========================================

import type {
  TreeNode,
  Person,
  MarriageInfo,
  BranchPoint,
  BranchCurve,
  TreeLayout,
  ZoomLevel,
} from "@tree/types";

// ==========================================
// LAYOUT CONSTANTS
// ==========================================

const LAYOUT = {
  // Horizontal spacing between siblings
  SIBLING_SPACING: 4,
  // Vertical spacing between generations
  GENERATION_SPACING: 6,
  // Node size
  NODE_RADIUS: 0.8,
  // Branch thickness at root
  BRANCH_THICKNESS_ROOT: 0.3,
  // Branch thickness decay per level
  BRANCH_THICKNESS_DECAY: 0.85,
  // Marriage node offset
  MARRIAGE_OFFSET: 1.5,
  // Maximum visible nodes at each zoom
  MAX_NODES_FAR: 100,
  MAX_NODES_MEDIUM: 50,
  MAX_NODES_CLOSE: 20,
};

// ==========================================
// TREE NODE FACTORY
// ==========================================

export function createTreeNode(
  person: Person,
  depth: number = 0,
  isExpanded: boolean = false
): TreeNode {
  return {
    id: person.id,
    person,
    children: [],
    marriages: [],
    depth,
    isExpanded,
    isLoading: false,
    isVisible: true,
    zoomLevel: "medium",
  };
}

// ==========================================
// 3D POSITION CALCULATOR
// ==========================================

export interface LayoutPosition {
  x: number;
  y: number;
  z: number;
}

export function calculateNodePosition(
  node: TreeNode,
  siblingIndex: number,
  totalSiblings: number
): LayoutPosition {
  // Vertical position based on generation
  const y = -node.depth * LAYOUT.GENERATION_SPACING;

  // Horizontal position centered on parent
  const siblingOffset = (siblingIndex - (totalSiblings - 1) / 2) * LAYOUT.SIBLING_SPACING;

  // Slight Z variation for depth perception
  const z = node.depth * 0.3 + (siblingIndex % 2) * 0.2;

  return { x: siblingOffset, y, z };
}

// ==========================================
// BRANCH CURVE GENERATION
// ==========================================

export function generateBranchCurve(
  start: LayoutPosition,
  end: LayoutPosition,
  depth: number
): BranchCurve {
  // Control points for smooth Bezier curve
  const midY = (start.y + end.y) / 2;
  
  const controlPoints: BranchPoint[] = [
    { x: start.x, y: start.y + (midY - start.y) * 0.3, z: start.z },
    { x: (start.x + end.x) / 2, y: midY, z: (start.z + end.z) / 2 },
    { x: end.x, y: end.y + (midY - end.y) * 0.3, z: end.z },
  ];

  return {
    start: { x: start.x, y: start.y, z: start.z },
    end: { x: end.x, y: end.y, z: end.z },
    controlPoints,
    thickness: LAYOUT.BRANCH_THICKNESS_ROOT * Math.pow(LAYOUT.BRANCH_THICKNESS_DECAY, depth),
  };
}

// ==========================================
// VIEWPORT CULLING (LOD - Level of Detail)
// ==========================================

export function isNodeInViewport(
  node: TreeNode,
  viewport: { centerX: number; centerY: number; centerZ: number; zoom: number },
  threshold: number = 0.1
): boolean {
  const dx = Math.abs((node.x || 0) - viewport.centerX);
  const dy = Math.abs((node.y || 0) - viewport.centerY);
  const dz = Math.abs((node.z || 0) - viewport.centerZ);

  // Simple bounding box check
  const effectiveThreshold = threshold / viewport.zoom;
  return dx < effectiveThreshold * 20 && dy < effectiveThreshold * 20 && dz < effectiveThreshold * 10;
}

export function getZoomLevel(zoom: number): ZoomLevel {
  if (zoom < 0.2) return "far";
  if (zoom < 0.5) return "medium";
  if (zoom < 1.5) return "close";
  return "profile";
}

export function getMaxVisibleNodes(zoomLevel: ZoomLevel): number {
  switch (zoomLevel) {
    case "far":
      return LAYOUT.MAX_NODES_FAR;
    case "medium":
      return LAYOUT.MAX_NODES_MEDIUM;
    case "close":
      return LAYOUT.MAX_NODES_CLOSE;
    case "profile":
      return 5;
    default:
      return LAYOUT.MAX_NODES_MEDIUM;
  }
}

// ==========================================
// TREE LAYOUT ALGORITHM
// ==========================================

export function buildTreeLayout(rootNode: TreeNode): TreeLayout {
  const nodes = new Map<string, TreeNode>();
  const branches: BranchCurve[] = [];

  function traverse(node: TreeNode, parentPosition?: LayoutPosition) {
    nodes.set(node.id, node);

    // Calculate position
    const siblingIndex = 0;
    const totalSiblings = node.children.length + (node.marriages.length > 0 ? 1 : 0);
    const position = calculateNodePosition(node, siblingIndex, totalSiblings || 1);

    node.x = position.x;
    node.y = position.y;
    node.z = position.z;

    // Generate branch if has parent
    if (parentPosition) {
      branches.push(generateBranchCurve(parentPosition, position, node.depth));
    }

    // Process children
    node.children.forEach((child, index) => {
      traverse(child, position);
    });

    // Process marriages
    node.marriages.forEach((marriage) => {
      marriage.children.forEach((child) => {
        traverse(child, position);
      });
    });
  }

  traverse(rootNode);

  return {
    nodes,
    branches,
    rootId: rootNode.id,
    maxDepth: getMaxDepth(rootNode),
    totalNodes: nodes.size,
  };
}

function getMaxDepth(node: TreeNode): number {
  let maxDepth = node.depth;
  node.children.forEach((child) => {
    maxDepth = Math.max(maxDepth, getMaxDepth(child));
  });
  node.marriages.forEach((marriage) => {
    marriage.children.forEach((child) => {
      maxDepth = Math.max(maxDepth, getMaxDepth(child));
    });
  });
  return maxDepth;
}

// ==========================================
// INFINITE ZOOM UTILITIES
// ==========================================

export interface ZoomBounds {
  minZoom: number;
  maxZoom: number;
  currentZoom: number;
}

export const DEFAULT_ZOOM_BOUNDS: ZoomBounds = {
  minZoom: 0.01,
  maxZoom: 10,
  currentZoom: 0.5,
};

export function clampZoom(zoom: number, bounds: ZoomBounds = DEFAULT_ZOOM_BOUNDS): number {
  return Math.max(bounds.minZoom, Math.min(bounds.maxZoom, zoom));
}

export function zoomToFitTree(tree: TreeLayout, viewportWidth: number, viewportHeight: number): number {
  if (tree.totalNodes === 0) return 1;

  // Calculate tree extents
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;

  tree.nodes.forEach((node) => {
    if (node.x !== undefined && node.y !== undefined) {
      minX = Math.min(minX, node.x);
      maxX = Math.max(maxX, node.x);
      minY = Math.min(minY, node.y);
      maxY = Math.max(maxY, node.y);
    }
  });

  const treeWidth = maxX - minX + LAYOUT.SIBLING_SPACING * 2;
  const treeHeight = maxY - minY + LAYOUT.GENERATION_SPACING * 2;

  const zoomX = viewportWidth / treeWidth;
  const zoomY = viewportHeight / treeHeight;

  return Math.min(zoomX, zoomY) * 0.8; // 0.8 for padding
}

// ==========================================
// RE-EXPORT ALL TYPES
// ==========================================

export * from "@tree/types";