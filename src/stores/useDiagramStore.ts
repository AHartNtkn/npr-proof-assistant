import { create } from 'zustand';
import type { 
  DiagramState, 
  Diagram, 
  Rewrite, 
  Generator, 
  Diagram0,
  DiagramN,
  NPRAspectsResult,
  NPRValidationError
} from '../types';
import { 
  validateDiagram, 
  composeDiagrams,
  isComposable,
  normalizeDiagram,
  type ValidationResult
} from '../engine';
import { 
  validateWithCompleteSystem,
  getAllNPRAxioms,
  satisfiesAllNPRLaws,
  type ValidationReport
} from '../axioms';

interface ValidationSummary extends ValidationResult {
  axiomResults: NPRAspectsResult;
}

interface ValidMove {
  type: 'rewrite' | 'compose' | 'contract';
  description: string;
  target?: Diagram | Rewrite;
}

interface DiagramStore extends DiagramState {
  // Diagram manipulation
  setDiagram: (diagram: Diagram) => void;
  clearDiagram: () => void;
  
  // Selection management
  selectDiagram: (diagram: Diagram | null) => void;
  selectSlice: (sliceIndex: number | null) => void;
  setHoveredRewrite: (rewrite: Rewrite | null) => void;
  clearSelection: () => void;
  
  // History management
  pushToHistory: (diagram: Diagram) => void;
  undo: () => void;
  
  // NPR-specific operations
  applyRewrite: (rewrite: Rewrite, position: number) => void;
  addGenerator: (generator: Generator) => void;
  composeWithDiagram: (diagram: Diagram) => void;
  
  // Engine integration
  validateCurrentDiagram: () => ValidationSummary;
  canComposeWith: (diagram: Diagram) => boolean;
  
  // Axiom system integration
  validateNPRCompliance: () => NPRAspectsResult;
  enforceNPRAxioms: boolean;
  getValidMoves: () => ValidMove[];
}

// Helper function to create an empty 0-dimensional diagram
const createEmptyDiagram = (): Diagram0 => ({
  dimension: 0,
  generator: {
    id: 'empty',
    label: 'ε',
  },
});

// Helper functions for type guards (will be used in future implementations)
// const isDiagram0 = (d: Diagram): d is Diagram0 => d.dimension === 0;
// const isDiagramN = (d: Diagram): d is DiagramN => d.dimension > 0;

export const useDiagramStore = create<DiagramStore>((set, get) => ({
  // Initial state
  currentDiagram: createEmptyDiagram(),
  history: [],
  selection: {
    selectedDiagram: null,
    selectedSlice: null,
    hoveredRewrite: null,
  },
  enforceNPRAxioms: true,

  // Diagram manipulation
  setDiagram: (diagram: Diagram) => {
    // Validate diagram structure before setting
    const validationResult = validateDiagram(diagram);
    if (!validationResult.isValid) {
      throw new Error('Invalid diagram structure');
    }
    
    set((state) => ({
      currentDiagram: diagram,
      history: [...state.history, state.currentDiagram].filter(Boolean) as Diagram[],
    }));
  },

  clearDiagram: () => {
    set({
      currentDiagram: createEmptyDiagram(),
      history: [],
      selection: {
        selectedDiagram: null,
        selectedSlice: null,
        hoveredRewrite: null,
      },
    });
  },

  // Selection management
  selectDiagram: (diagram: Diagram | null) => {
    set((state) => ({
      selection: {
        ...state.selection,
        selectedDiagram: diagram,
      },
    }));
  },

  selectSlice: (sliceIndex: number | null) => {
    set((state) => ({
      selection: {
        ...state.selection,
        selectedSlice: sliceIndex,
      },
    }));
  },

  setHoveredRewrite: (rewrite: Rewrite | null) => {
    set((state) => ({
      selection: {
        ...state.selection,
        hoveredRewrite: rewrite,
      },
    }));
  },

  clearSelection: () => {
    set({
      selection: {
        selectedDiagram: null,
        selectedSlice: null,
        hoveredRewrite: null,
      },
    });
  },

  // History management
  pushToHistory: (diagram: Diagram) => {
    set((state) => ({
      history: [...state.history, diagram],
    }));
  },

  undo: () => {
    const { history } = get();
    if (history.length > 0) {
      const previousDiagram = history[history.length - 1];
      set({
        currentDiagram: previousDiagram,
        history: history.slice(0, -1),
      });
    }
  },

  // Engine integration
  validateCurrentDiagram: (): ValidationSummary => {
    const { currentDiagram } = get();
    if (!currentDiagram) {
      return {
        isValid: false,
        errors: [{ message: 'No current diagram', code: 'NO_DIAGRAM' }],
        warnings: [],
        axiomResults: {
          isValid: false,
          errors: [],
          warnings: [],
          context: { axioms: [], errors: [], warnings: [] }
        }
      };
    }
    
    const engineValidation = validateDiagram(currentDiagram);
    const axiomValidation = get().validateNPRCompliance();
    
    return {
      ...engineValidation,
      axiomResults: axiomValidation
    };
  },

  canComposeWith: (diagram: Diagram) => {
    const { currentDiagram } = get();
    if (!currentDiagram) return false;
    return isComposable(currentDiagram, diagram);
  },

  // Axiom system integration
  validateNPRCompliance: (): NPRAspectsResult => {
    const { currentDiagram } = get();
    if (!currentDiagram) {
      return {
        isValid: false,
        errors: [{ code: 'NO_DIAGRAM', message: 'No diagram to validate', severity: 'error' }],
        warnings: [],
        context: { axioms: [], errors: [], warnings: [] }
      };
    }
    
    const report = validateWithCompleteSystem(currentDiagram);
    return {
      isValid: report.isValid(),
      errors: report.getAllErrors(),
      warnings: report.getAllWarnings(),
      context: {
        axioms: getAllNPRAxioms(),
        errors: report.getAllErrors(),
        warnings: report.getAllWarnings()
      }
    };
  },

  getValidMoves: (): ValidMove[] => {
    const { currentDiagram } = get();
    if (!currentDiagram) return [];
    
    const moves: ValidMove[] = [];
    
    // Add basic moves based on current diagram state
    moves.push({
      type: 'rewrite',
      description: 'Apply identity rewrite',
    });
    
    if (currentDiagram.dimension === 0) {
      moves.push({
        type: 'compose',
        description: 'Compose with another generator',
      });
    }
    
    return moves;
  },

  // NPR-specific operations
  applyRewrite: (rewrite: Rewrite, position: number) => {
    const { currentDiagram, enforceNPRAxioms } = get();
    if (!currentDiagram) return;
    
    // Validate rewrite if axiom enforcement is enabled
    if (enforceNPRAxioms) {
      // For now, just check basic structure validity
      if (!rewrite || typeof rewrite !== 'object') {
        throw new Error('NPR axiom violation: Invalid rewrite structure');
      }
      
      if (rewrite.dimension === 0) {
        if (!rewrite.source || !rewrite.target) {
          throw new Error('NPR axiom violation: 0-dimensional rewrite must have source and target');
        }
      }
    }
    
    get().pushToHistory(currentDiagram);
    
    // Apply rewrite based on dimension and type
    if (rewrite.dimension === 0 && currentDiagram.dimension === 0) {
      // Simple generator replacement
      const newDiagram: Diagram0 = {
        dimension: 0,
        generator: rewrite.target as Generator
      };
      
      set({ currentDiagram: newDiagram });
    } else {
      // For higher dimensions, create a composed diagram
      const composedDiagram: DiagramN = {
        dimension: Math.max(currentDiagram.dimension, 1),
        source: currentDiagram,
        cospans: [{ forward: rewrite, backward: rewrite }]
      };
      
      set({ currentDiagram: composedDiagram });
    }
  },

  addGenerator: (generator: Generator) => {
    // Add a new generator to the diagram
    const newDiagram: Diagram0 = {
      dimension: 0,
      generator,
    };
    set((state) => ({
      currentDiagram: newDiagram,
      history: [...state.history, state.currentDiagram].filter(Boolean) as Diagram[],
    }));
  },

  composeWithDiagram: (diagram: Diagram) => {
    const { currentDiagram, canComposeWith } = get();
    if (!currentDiagram) return;
    
    if (!canComposeWith(diagram)) {
      console.warn('Diagrams are not composable');
      return;
    }
    
    get().pushToHistory(currentDiagram);
    
    try {
      const composedDiagram = composeDiagrams(currentDiagram, diagram);
      set({ currentDiagram: composedDiagram });
    } catch (error) {
      console.error('Composition failed:', error);
      // Restore previous state
      const { history } = get();
      if (history.length > 0) {
        get().undo();
      }
    }
  },
}));