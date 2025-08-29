import { describe, it, expect, beforeEach } from 'vitest';
import { useGraphStore } from './useGraphStore';
import type { GraphNode, GraphEdge } from '../types';

describe('useGraphStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    useGraphStore.setState({
      nodes: [],
      edges: [],
      selectedNode: null,
      selectedEdge: null,
    });
  });

  it('should initialize with empty graph', () => {
    const state = useGraphStore.getState();
    expect(state.nodes).toEqual([]);
    expect(state.edges).toEqual([]);
    expect(state.selectedNode).toBeNull();
    expect(state.selectedEdge).toBeNull();
  });

  it('should add nodes to the graph', () => {
    const { addNode } = useGraphStore.getState();
    
    const node1: GraphNode = {
      id: 'node1',
      x: 100,
      y: 100,
      type: 'variable',
    };
    
    const node2: GraphNode = {
      id: 'node2',
      x: 200,
      y: 200,
      type: 'operator',
    };
    
    addNode(node1);
    let state = useGraphStore.getState();
    expect(state.nodes).toHaveLength(1);
    expect(state.nodes[0]).toEqual(node1);
    
    addNode(node2);
    state = useGraphStore.getState();
    expect(state.nodes).toHaveLength(2);
    expect(state.nodes[1]).toEqual(node2);
  });

  it('should add edges to the graph', () => {
    const { addEdge } = useGraphStore.getState();
    
    const edge: GraphEdge = {
      id: 'edge1',
      source: 'node1',
      target: 'node2',
      type: 'connection',
    };
    
    addEdge(edge);
    const state = useGraphStore.getState();
    expect(state.edges).toHaveLength(1);
    expect(state.edges[0]).toEqual(edge);
  });

  it('should select and deselect nodes', () => {
    const { selectNode } = useGraphStore.getState();
    
    selectNode('node1');
    let state = useGraphStore.getState();
    expect(state.selectedNode).toBe('node1');
    expect(state.selectedEdge).toBeNull();
    
    selectNode(null);
    state = useGraphStore.getState();
    expect(state.selectedNode).toBeNull();
  });

  it('should select and deselect edges', () => {
    const { selectEdge } = useGraphStore.getState();
    
    selectEdge('edge1');
    let state = useGraphStore.getState();
    expect(state.selectedEdge).toBe('edge1');
    expect(state.selectedNode).toBeNull();
    
    selectEdge(null);
    state = useGraphStore.getState();
    expect(state.selectedEdge).toBeNull();
  });

  it('should clear selection when selecting node after edge', () => {
    const { selectEdge, selectNode } = useGraphStore.getState();
    
    selectEdge('edge1');
    selectNode('node1');
    
    const state = useGraphStore.getState();
    expect(state.selectedNode).toBe('node1');
    expect(state.selectedEdge).toBeNull();
  });

  it('should clear selection when selecting edge after node', () => {
    const { selectNode, selectEdge } = useGraphStore.getState();
    
    selectNode('node1');
    selectEdge('edge1');
    
    const state = useGraphStore.getState();
    expect(state.selectedEdge).toBe('edge1');
    expect(state.selectedNode).toBeNull();
  });

  it('should clear all selections', () => {
    const { selectNode, clearSelection } = useGraphStore.getState();
    
    selectNode('node1');
    clearSelection();
    
    const state = useGraphStore.getState();
    expect(state.selectedNode).toBeNull();
    expect(state.selectedEdge).toBeNull();
  });
});