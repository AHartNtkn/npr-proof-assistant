import { create } from 'zustand';
import type { GraphState, GraphNode, GraphEdge } from '../types';

interface GraphStore extends GraphState {
  addNode: (node: GraphNode) => void;
  addEdge: (edge: GraphEdge) => void;
  selectNode: (nodeId: string | null) => void;
  selectEdge: (edgeId: string | null) => void;
  clearSelection: () => void;
}

export const useGraphStore = create<GraphStore>((set) => ({
  // Initial state
  nodes: [],
  edges: [],
  selectedNode: null,
  selectedEdge: null,

  // Actions
  addNode: (node: GraphNode) => {
    set((state) => ({
      nodes: [...state.nodes, node],
    }));
  },

  addEdge: (edge: GraphEdge) => {
    set((state) => ({
      edges: [...state.edges, edge],
    }));
  },

  selectNode: (nodeId: string | null) => {
    set({
      selectedNode: nodeId,
      selectedEdge: null,
    });
  },

  selectEdge: (edgeId: string | null) => {
    set({
      selectedEdge: edgeId,
      selectedNode: null,
    });
  },

  clearSelection: () => {
    set({
      selectedNode: null,
      selectedEdge: null,
    });
  },
}));