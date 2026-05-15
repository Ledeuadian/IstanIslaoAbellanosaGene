// ==========================================
// FAMILY TREE TYPE DEFINITIONS
// ==========================================

// ==========================================
// AUTH & USER TYPES
// ==========================================

export type UserRole = 'admin' | 'viewer';

export interface User {
  id: string;
  username: string;
  email?: string;
  role: UserRole;
  createdAt: string;
}

export interface LoginInput {
  username: string;
  password: string;
}

export interface RegisterInput {
  username: string;
  password: string;
  email?: string;
}

export interface AuthPayload {
  token: string;
  user: User;
}

export interface ChangePasswordInput {
  oldPassword: string;
  newPassword: string;
}

// Gender type
export type Gender = "male" | "female" | "other" | "unknown";

// Parent relationship metadata
export interface ParentRelationshipMeta {
  type: "biological" | "adopted" | "step";
  since?: string;
  notes?: string;
}

// Marriage relationship metadata
export interface MarriageMeta {
  type: "married" | "divorced" | "engaged" | "separated" | "widowed";
  since?: string;
  until?: string;
  notes?: string;
}

// Person Node
export interface Person {
  id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  maidenName?: string;
  gender: Gender;
  birthDate?: string;
  deathDate?: string;
  birthPlace?: string;
  deathPlace?: string;
  photo?: string;
  bio?: string;
  notes?: string;
  generation: number;
  positionX?: number;
  positionY?: number;
  positionZ?: number;
  createdAt: string;
  updatedAt: string;
}

// Simplified Person for list views
export interface PersonSummary {
  id: string;
  firstName: string;
  lastName: string;
  gender: Gender;
  birthDate?: string;
  photo?: string;
}

// Family Node (groups people and marriages)
export interface Family {
  id: string;
  name?: string;
  createdAt: string;
}

// Marriage Node
export interface Marriage {
  id: string;
  type: MarriageMeta["type"];
  since?: string;
  until?: string;
  notes?: string;
  createdAt: string;
}

// Tree Node for 3D visualization
export interface TreeNode {
  id: string;
  person: Person;
  children: TreeNode[];
  marriages: MarriageInfo[];
  depth: number;
  x?: number;
  y?: number;
  z?: number;
  isExpanded: boolean;
  isLoading: boolean;
  isVisible: boolean;
  zoomLevel: ZoomLevel;
}

// Marriage info in tree
export interface MarriageInfo {
  id: string;
  spouse: Person;
  children: TreeNode[];
  type: MarriageMeta["type"];
}

// Zoom levels for level-of-detail rendering
export type ZoomLevel = "far" | "medium" | "close" | "profile";

// Camera viewport
export interface Viewport {
  centerX: number;
  centerY: number;
  centerZ: number;
  zoom: number;
  rotationX: number;
  rotationY: number;
  rotationZ: number;
}

// GraphQL Input types
export interface CreatePersonInput {
  firstName: string;
  middleName?: string;
  lastName: string;
  maidenName?: string;
  gender: Gender;
  birthDate?: string;
  deathDate?: string;
  birthPlace?: string;
  deathPlace?: string;
  photo?: string;
  bio?: string;
  notes?: string;
  generation?: number;
  positionX?: number;
  positionY?: number;
  positionZ?: number;
}

export interface UpdatePersonInput {
  firstName?: string;
  middleName?: string;
  lastName?: string;
  maidenName?: string;
  gender?: Gender;
  birthDate?: string;
  deathDate?: string;
  birthPlace?: string;
  deathPlace?: string;
  photo?: string;
  bio?: string;
  notes?: string;
}

export interface CreateMarriageInput {
  personId1: string;
  personId2: string;
  type?: MarriageMeta["type"];
  since?: string;
  until?: string;
  notes?: string;
}

export interface ParentOfInput {
  parentId: string;
  childId: string;
  type?: ParentRelationshipMeta["type"];
  since?: string;
  notes?: string;
}

// Tree query options
export interface TreeQueryOptions {
  rootPersonId: string;
  maxDepth?: number;
  includeSpouses?: boolean;
  includeSiblings?: boolean;
  centerOnPersonId?: string;
}

// Pagination
export interface PageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor?: string;
  endCursor?: string;
}

export interface Connection<T> {
  nodes: T[];
  pageInfo: PageInfo;
}

// ==========================================
// RELATIONSHIP ENUM
// ==========================================

export enum RelationshipType {
  PARENT_OF = "PARENT_OF",
  CHILD_OF = "CHILD_OF",
  MARRIED_TO = "MARRIED_TO",
  DIVORCED_FROM = "DIVORCED_FROM",
  SIBLING_OF = "SIBLING_OF",
  ADOPTED_BY = "ADOPTED_BY",
}

// ==========================================
// API RESPONSE TYPES
// ==========================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ==========================================
// 3D TREE ENGINE TYPES
// ==========================================

export interface BranchPoint {
  x: number;
  y: number;
  z: number;
}

export interface BranchCurve {
  start: BranchPoint;
  end: BranchPoint;
  controlPoints: BranchPoint[];
  thickness: number;
  color?: string;
}

export interface TreeLayout {
  nodes: Map<string, TreeNode>;
  branches: BranchCurve[];
  rootId: string;
  maxDepth: number;
  totalNodes: number;
}

export interface LazyLoadResult {
  nodes: TreeNode[];
  totalChildren: number;
  hasMore: boolean;
}
