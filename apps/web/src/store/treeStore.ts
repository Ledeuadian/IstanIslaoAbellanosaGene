// ==========================================
// FAMILY TREE STORE (Zustand)
// Global state management
// ==========================================

import { create } from 'zustand';
import type { Person, TreeNode, Viewport, CreatePersonInput, ZoomLevel } from '@tree/types';
import { getZoomLevel, clampZoom, DEFAULT_ZOOM_BOUNDS } from '@tree/tree-engine';

interface TreeState {
  // Root person
  rootPersonId: string | null;
  rootPerson: Person | null;
  
  // Tree data
  nodes: Map<string, TreeNode>;
  expandedNodes: Set<string>;
  selectedNodeId: string | null;
  editingNodeId: string | null; // Node being edited via sidebar (separate from selection)
  
  // Custom positions for draggable nodes
  customPositions: Map<string, [number, number, number]>;
  
  // Viewport
  viewport: Viewport;
  zoomLevel: ZoomLevel;
  
  // UI state
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  highlightedNodes: Set<string>; // Nodes matching search
  showAddModal: boolean;
  showAddParentModal: boolean;
  showAddSpouseModal: boolean;
  editingPerson: Person | null;
  isDraggingNode: boolean;
  
  // Actions
  setRootPerson: (person: Person) => void;
  setHighlightedNodes: (nodeIds: string[]) => void;
  clearHighlightedNodes: () => void;
  toggleNode: (nodeId: string) => void;
  selectNode: (nodeId: string | null) => void;
  setViewport: (viewport: Partial<Viewport>) => void;
  zoom: (delta: number) => void;
  zoomTo: (level: number) => void;
  pan: (dx: number, dy: number) => void;
  resetView: () => void;
  setSearchQuery: (query: string) => void;
  setShowAddModal: (show: boolean) => void;
  setShowAddParentModal: (show: boolean) => void;
  setShowAddSpouseModal: (show: boolean) => void;
  setEditingPerson: (person: Person | null) => void;
  setEditingNodeId: (nodeId: string | null) => void;
  setEditingNodeAndExpand: (nodeId: string | null, expandNodeId: string) => void;
  setIsDraggingNode: (dragging: boolean) => void;
  addPerson: (person: Person) => void;
  updatePerson: (person: Person) => void;
  removePerson: (personId: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Position actions
  setCustomPosition: (personId: string, position: [number, number, number]) => void;
  clearCustomPosition: (personId: string) => void;
  initializeCustomPositions: (positions: Map<string, [number, number, number]>) => void;
}

export const useTreeStore = create<TreeState>((set, get) => ({
  // Initial state
  rootPersonId: null,
  rootPerson: null,
  nodes: new Map(),
  expandedNodes: new Set(),
  selectedNodeId: null,
  editingNodeId: null, // Separate from selection for sidebar editing
  customPositions: new Map(),
  viewport: {
    centerX: 0,
    centerY: 0,
    centerZ: 5,
    zoom: 0.5,
    rotationX: 0.2,
    rotationY: 0,
    rotationZ: 0,
  },
  zoomLevel: 'medium',
  isLoading: false,
  error: null,
  searchQuery: '',
  highlightedNodes: new Set(),
  showAddModal: false,
  showAddParentModal: false,
  showAddSpouseModal: false,
  editingPerson: null,
  isDraggingNode: false,

  // Actions
  setRootPerson: (person) => set({ 
    rootPersonId: person.id, 
    rootPerson: person,
    selectedNodeId: person.id,
  }),

  setHighlightedNodes: (nodeIds) => set({ highlightedNodes: new Set(nodeIds) }),

  clearHighlightedNodes: () => set({ highlightedNodes: new Set() }),

  toggleNode: (nodeId) => set((state) => {
    const newExpanded = new Set(state.expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    return { expandedNodes: newExpanded };
  }),

  selectNode: (nodeId) => set({ selectedNodeId: nodeId }),

  setViewport: (viewport) => set((state) => ({
    viewport: { ...state.viewport, ...viewport }
  })),

  zoom: (delta) => set((state) => {
    const newZoom = clampZoom(state.viewport.zoom + delta);
    return {
      viewport: { ...state.viewport, zoom: newZoom },
      zoomLevel: getZoomLevel(newZoom),
    };
  }),

  zoomTo: (level) => set((state) => ({
    viewport: { ...state.viewport, zoom: clampZoom(level) },
    zoomLevel: getZoomLevel(level),
  })),

  pan: (dx, dy) => set((state) => ({
    viewport: {
      ...state.viewport,
      centerX: state.viewport.centerX + dx,
      centerY: state.viewport.centerY + dy,
    }
  })),

  resetView: () => set((state) => ({
    viewport: {
      centerX: 0,
      centerY: 0,
      centerZ: 5,
      zoom: 0.5,
      rotationX: 0.2,
      rotationY: 0,
      rotationZ: 0,
    },
    zoomLevel: 'medium',
  })),

  setSearchQuery: (query) => set({ searchQuery: query }),

  setShowAddModal: (show) => set({ showAddModal: show }),

  setShowAddParentModal: (show) => set({ showAddParentModal: show }),

  setShowAddSpouseModal: (show) => set({ showAddSpouseModal: show }),

  setEditingPerson: (person) => set({ editingPerson: person }),
  setEditingNodeId: (nodeId) => set({ editingNodeId: nodeId }),
  setEditingNodeAndExpand: (nodeId, expandNodeId) => set((state) => {
    const newExpanded = new Set(state.expandedNodes);
    newExpanded.add(expandNodeId);
    return { editingNodeId: nodeId, expandedNodes: newExpanded };
  }),
  setIsDraggingNode: (dragging) => set({ isDraggingNode: dragging }),
  addPerson: (person) => set((state) => {
    const newNodes = new Map(state.nodes);
    newNodes.set(person.id, {
      id: person.id,
      person,
      children: [],
      marriages: [],
      depth: 0,
      isExpanded: false,
      isLoading: false,
      isVisible: true,
      zoomLevel: state.zoomLevel,
    });
    return { nodes: newNodes };
  }),

  updatePerson: (person) => set((state) => {
    const newNodes = new Map(state.nodes);
    const existingNode = newNodes.get(person.id);
    if (existingNode) {
      newNodes.set(person.id, { ...existingNode, person });
    }
    return { nodes: newNodes };
  }),

  removePerson: (personId) => set((state) => {
    const newNodes = new Map(state.nodes);
    newNodes.delete(personId);
    return { nodes: newNodes };
  }),

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),

  setCustomPosition: (personId, position) => set((state) => {
    const newPositions = new Map(state.customPositions);
    newPositions.set(personId, position);
    return { customPositions: newPositions };
  }),

  clearCustomPosition: (personId) => set((state) => {
    const newPositions = new Map(state.customPositions);
    newPositions.delete(personId);
    return { customPositions: newPositions };
  }),

  initializeCustomPositions: (positions) => set({
    customPositions: positions,
  }),
}));