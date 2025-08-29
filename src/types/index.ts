export type AppMode = 'formula' | 'proof';

export interface AppState {
  mode: AppMode;
  previousMode: AppMode | null;
  transitioning: boolean;
}

export interface ModeActions {
  setMode: (mode: AppMode) => void;
  toggleMode: () => void;
}

export interface GraphNode {
  id: string;
  x: number;
  y: number;
  type: string;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: string;
}

export interface GraphState {
  nodes: GraphNode[];
  edges: GraphEdge[];
  selectedNode: string | null;
  selectedEdge: string | null;
}