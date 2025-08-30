// App-level types
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

// Re-export core diagram types and utilities
export type { Generator, Diagram, Diagram0, DiagramN } from './diagram';
export { 
  isValidGenerator, 
  isValidDiagram, 
  createEmptyDiagram, 
  createGeneratorDiagram 
} from './diagram';

// Re-export rewrite types and utilities  
export type { Rewrite, Rewrite0, RewriteI, RewriteN, Cospan, Cone } from './rewrite';
export {
  isValidRewrite,
  isValidCospan, 
  isValidCone,
  createGeneratorRewrite,
  createIdentityRewrite,
  createCospanRewrite
} from './rewrite';

// Re-export NPR validation types and functions
export type { NPRAxiom, NPRValidationError, NPRValidationContext, NPRAspectsResult } from './npr';
export {
  isNPRCompliant,
  validateNPRAspects,
  getNPRAxioms,
  checkCartesianProperties,
  checkCocartesianProperties,
  validateDiagramComposition,
  createNPRValidationContext
} from './npr';

// UI interaction types
export interface SelectionState {
  selectedDiagram: Diagram | null;
  selectedSlice: number | null;
  hoveredRewrite: Rewrite | null;
}

// Store state for diagram management
export interface DiagramState {
  currentDiagram: Diagram | null;
  history: Diagram[];
  selection: SelectionState;
}