/**
 * Tests for useDiagramStore integration with engine and axiom systems
 * Following TDD approach - these tests should fail initially
 */

import { renderHook, act } from '@testing-library/react';
import { useDiagramStore } from '../useDiagramStore';
import { 
  createEmptyDiagram, 
  createGeneratorDiagram,
  type Diagram,
  type Generator
} from '../../types';
import { composeDiagrams, isComposable } from '../../engine';
import { validateWithCompleteSystem } from '../../axioms';

describe('useDiagramStore Integration Tests', () => {
  beforeEach(() => {
    // Reset store before each test
    const { result } = renderHook(() => useDiagramStore());
    act(() => {
      result.current.clearDiagram();
    });
  });

  describe('Engine Integration', () => {
    it('should validate diagram using engine validation', () => {
      const { result } = renderHook(() => useDiagramStore());
      
      const generator: Generator = {
        id: 'test-gen',
        label: 'A',
        color: 'cartesian'
      };
      
      const diagram = createGeneratorDiagram(generator);
      
      act(() => {
        result.current.setDiagram(diagram);
      });
      
      // This should fail initially - need to implement validation integration
      expect(result.current.validateCurrentDiagram).toBeDefined();
      
      act(() => {
        const validationResult = result.current.validateCurrentDiagram();
        expect(validationResult.isValid).toBe(true);
        expect(validationResult.errors).toHaveLength(0);
      });
    });

    it('should compose diagrams using engine composition', () => {
      const { result } = renderHook(() => useDiagramStore());
      
      const genA: Generator = { id: 'a', label: 'A' };
      const genB: Generator = { id: 'b', label: 'B' };
      
      const diagramA = createGeneratorDiagram(genA);
      const diagramB = createGeneratorDiagram(genB);
      
      act(() => {
        result.current.setDiagram(diagramA);
      });
      
      // This should fail initially - need to implement proper composition
      act(() => {
        result.current.composeWithDiagram(diagramB);
      });
      
      // Verify composition occurred properly
      const currentDiagram = result.current.currentDiagram;
      expect(currentDiagram).not.toBeNull();
      expect(currentDiagram!.dimension).toBeGreaterThan(0);
    });

    it('should check diagram compatibility before composition', () => {
      const { result } = renderHook(() => useDiagramStore());
      
      const genA: Generator = { id: 'a', color: 'cartesian' };
      const genB: Generator = { id: 'b', color: 'cocartesian' };
      
      const diagramA = createGeneratorDiagram(genA);
      const diagramB = createGeneratorDiagram(genB);
      
      act(() => {
        result.current.setDiagram(diagramA);
      });
      
      // This should fail initially - need to implement compatibility checking
      expect(result.current.canComposeWith).toBeDefined();
      
      const canCompose = result.current.canComposeWith(diagramB);
      expect(typeof canCompose).toBe('boolean');
    });

    it('should apply rewrite rules using engine operations', () => {
      const { result } = renderHook(() => useDiagramStore());
      
      const generator: Generator = { id: 'test', label: 'X' };
      const diagram = createGeneratorDiagram(generator);
      
      act(() => {
        result.current.setDiagram(diagram);
      });
      
      const rewrite = {
        dimension: 0,
        source: generator,
        target: { id: 'result', label: 'Y' }
      } as const;
      
      // This should fail initially - need to implement proper rewrite application
      act(() => {
        result.current.applyRewrite(rewrite, 0);
      });
      
      const currentDiagram = result.current.currentDiagram;
      expect(currentDiagram).not.toBeNull();
      if (currentDiagram!.dimension === 0) {
        expect(currentDiagram.generator.label).toBe('Y');
      }
    });
  });

  describe('Axiom System Integration', () => {
    it('should validate diagrams against NPR axioms', () => {
      const { result } = renderHook(() => useDiagramStore());
      
      const cartesianGen: Generator = {
        id: 'cart',
        label: 'C',
        color: 'cartesian'
      };
      
      const diagram = createGeneratorDiagram(cartesianGen);
      
      act(() => {
        result.current.setDiagram(diagram);
      });
      
      // This should fail initially - need to implement NPR validation
      expect(result.current.validateNPRCompliance).toBeDefined();
      
      act(() => {
        const nprResult = result.current.validateNPRCompliance();
        expect(nprResult.isValid).toBe(true);
        expect(nprResult.axiomResults).toBeInstanceOf(Array);
      });
    });

    it('should prevent invalid operations based on NPR axioms', () => {
      const { result } = renderHook(() => useDiagramStore());
      
      // Create an invalid scenario according to NPR rules
      const invalidGen: Generator = { id: 'invalid', color: 'cartesian' };
      const diagram = createGeneratorDiagram(invalidGen);
      
      act(() => {
        result.current.setDiagram(diagram);
      });
      
      // This should fail initially - need to implement axiom enforcement
      expect(result.current.enforceNPRAxioms).toBe(true);
      
      // Try an operation that should be blocked by axioms
      const conflictingRewrite = {
        dimension: 0,
        source: invalidGen,
        target: { id: 'conflict', color: 'cocartesian' }
      } as const;
      
      expect(() => {
        act(() => {
          result.current.applyRewrite(conflictingRewrite, 0);
        });
      }).toThrow('NPR axiom violation');
    });

    it('should suggest valid next moves based on axiom system', () => {
      const { result } = renderHook(() => useDiagramStore());
      
      const generator: Generator = { id: 'start', color: 'cartesian' };
      const diagram = createGeneratorDiagram(generator);
      
      act(() => {
        result.current.setDiagram(diagram);
      });
      
      // This should fail initially - need to implement move suggestion
      expect(result.current.getValidMoves).toBeDefined();
      
      const validMoves = result.current.getValidMoves();
      expect(Array.isArray(validMoves)).toBe(true);
      expect(validMoves.length).toBeGreaterThan(0);
    });
  });

  describe('State Management', () => {
    it('should maintain history with proper state transitions', () => {
      const { result } = renderHook(() => useDiagramStore());
      
      const genA: Generator = { id: 'a' };
      const genB: Generator = { id: 'b' };
      const genC: Generator = { id: 'c' };
      
      const diagramA = createGeneratorDiagram(genA);
      const diagramB = createGeneratorDiagram(genB);
      const diagramC = createGeneratorDiagram(genC);
      
      // Initial state
      expect(result.current.history).toHaveLength(0);
      
      // First transition
      act(() => {
        result.current.setDiagram(diagramA);
      });
      
      expect(result.current.currentDiagram).toEqual(diagramA);
      expect(result.current.history).toHaveLength(1);
      
      // Second transition
      act(() => {
        result.current.setDiagram(diagramB);
      });
      
      expect(result.current.currentDiagram).toEqual(diagramB);
      expect(result.current.history).toHaveLength(2);
      
      // Third transition
      act(() => {
        result.current.setDiagram(diagramC);
      });
      
      expect(result.current.currentDiagram).toEqual(diagramC);
      expect(result.current.history).toHaveLength(3);
      
      // Undo operations
      act(() => {
        result.current.undo();
      });
      
      expect(result.current.currentDiagram).toEqual(diagramB);
      expect(result.current.history).toHaveLength(2);
    });

    it('should handle complex selection state updates', () => {
      const { result } = renderHook(() => useDiagramStore());
      
      const diagram = createGeneratorDiagram({ id: 'test' });
      
      act(() => {
        result.current.setDiagram(diagram);
        result.current.selectDiagram(diagram);
        result.current.selectSlice(2);
      });
      
      expect(result.current.selection.selectedDiagram).toEqual(diagram);
      expect(result.current.selection.selectedSlice).toBe(2);
      
      act(() => {
        result.current.clearSelection();
      });
      
      expect(result.current.selection.selectedDiagram).toBeNull();
      expect(result.current.selection.selectedSlice).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should handle engine operation failures gracefully', () => {
      const { result } = renderHook(() => useDiagramStore());
      
      const invalidDiagram = { dimension: -1 } as unknown as Diagram;
      
      // This should fail initially - need to implement error handling
      expect(() => {
        act(() => {
          result.current.setDiagram(invalidDiagram);
        });
      }).toThrow('Invalid diagram structure');
    });

    it('should recover from axiom validation failures', () => {
      const { result } = renderHook(() => useDiagramStore());
      
      // Start with valid state
      const validDiagram = createEmptyDiagram();
      
      act(() => {
        result.current.setDiagram(validDiagram);
      });
      
      // Attempt invalid operation
      const invalidRewrite = {
        dimension: 0,
        source: null,
        target: null
      } as any;
      
      // Should not crash, should maintain valid state
      act(() => {
        try {
          result.current.applyRewrite(invalidRewrite, 0);
        } catch (error) {
          // Error is expected, state should remain consistent
        }
      });
      
      expect(result.current.currentDiagram).toEqual(validDiagram);
    });
  });
});