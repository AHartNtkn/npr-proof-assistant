/**
 * Integration tests for store-engine-axiom interactions
 * Tests that verify all streams (A, B, C, D, E) work together seamlessly
 */

import { renderHook, act } from '@testing-library/react';
import { useDiagramStore } from '../useDiagramStore';
import { useRewriteStore } from '../useRewriteStore';
import { 
  createGeneratorDiagram,
  createGeneratorRewrite,
  type Generator,
  type Diagram
} from '../../types';
import { 
  composeDiagrams,
  validateDiagram,
  normalizeDiagram
} from '../../engine';
import { 
  satisfiesAllNPRLaws,
  validateWithCompleteSystem
} from '../../axioms';
import { 
  serialize,
  deserialize
} from '../../serialization';

describe('Store-Engine-Axiom Integration Tests', () => {
  beforeEach(() => {
    // Reset both stores before each test
    const diagramStore = renderHook(() => useDiagramStore());
    const rewriteStore = renderHook(() => useRewriteStore());
    
    act(() => {
      diagramStore.result.current.clearDiagram();
      rewriteStore.result.current.clearAllRewrites();
    });
  });

  describe('Cross-Stream Type Compatibility', () => {
    it('should handle diagrams from types through all systems', () => {
      const { result: diagramStore } = renderHook(() => useDiagramStore());
      const { result: rewriteStore } = renderHook(() => useRewriteStore());
      
      // Create diagram using types (Stream A)
      const cartesianGen: Generator = {
        id: 'cart-node',
        label: 'C',
        color: 'cartesian'
      };
      const diagram = createGeneratorDiagram(cartesianGen);
      
      // Validate with engine (Stream B)
      const engineValidation = validateDiagram(diagram);
      expect(engineValidation.isValid).toBe(true);
      
      // Validate with axioms (Stream C)  
      const axiomValidation = satisfiesAllNPRLaws(diagram);
      expect(axiomValidation).toBe(true);
      
      // Serialize/deserialize (Stream D)
      const serialized = serialize(diagram);
      const deserialized = deserialize(serialized);
      expect(deserialized).toEqual(diagram);
      
      // Store in diagram store (Stream E)
      act(() => {
        diagramStore.current.setDiagram(diagram);
      });
      
      expect(diagramStore.current.currentDiagram).toEqual(diagram);
      
      // Create rewrite rule in rewrite store
      const targetGen: Generator = { id: 'target', label: 'T' };
      const rewrite = createGeneratorRewrite(cartesianGen, targetGen);
      
      act(() => {
        rewriteStore.current.addRewriteRule('cart-to-target', rewrite);
      });
      
      expect(rewriteStore.current.availableRules).toHaveLength(1);
    });

    it('should validate rewrite rules across engine and axiom systems', () => {
      const { result: rewriteStore } = renderHook(() => useRewriteStore());
      
      // Create a potentially problematic rewrite
      const cartesianGen: Generator = { id: 'cart', color: 'cartesian' };
      const cocartesianGen: Generator = { id: 'cocart', color: 'cocartesian' };
      const rewrite = createGeneratorRewrite(cartesianGen, cocartesianGen);
      
      // Validate through rewrite store (should use both engine and axioms)
      const nprValid = rewriteStore.current.validateRuleWithNPR(rewrite);
      expect(typeof nprValid).toBe('boolean');
      
      act(() => {
        rewriteStore.current.addRewriteRule('mixed-colors', rewrite);
      });
      
      expect(rewriteStore.current.availableRules).toHaveLength(1);
    });
  });

  describe('End-to-End Diagram Operations', () => {
    it('should perform complete diagram lifecycle with all systems', () => {
      const { result: diagramStore } = renderHook(() => useDiagramStore());
      const { result: rewriteStore } = renderHook(() => useRewriteStore());
      
      // 1. Create initial diagram
      const genA: Generator = { id: 'a', label: 'A' };
      const diagramA = createGeneratorDiagram(genA);
      
      act(() => {
        diagramStore.current.setDiagram(diagramA);
      });
      
      // 2. Load NPR axiom rules
      act(() => {
        rewriteStore.current.loadNPRAxioms();
      });
      
      const axiomRules = rewriteStore.current.getRulesByCategory('axiom');
      expect(axiomRules.length).toBeGreaterThan(0);
      
      // 3. Create and apply a rewrite
      const genB: Generator = { id: 'b', label: 'B' };
      const rewriteAB = createGeneratorRewrite(genA, genB);
      
      act(() => {
        rewriteStore.current.addRewriteRule('a-to-b', rewriteAB);
      });
      
      // 4. Find applicable rules
      const applicableRules = rewriteStore.current.getApplicableRules(diagramA);
      expect(applicableRules.length).toBeGreaterThanOrEqual(1);
      
      // Find our specific rule
      const ourRule = applicableRules.find(r => r.id === 'a-to-b');
      expect(ourRule).toBeDefined();
      expect(ourRule?.matchType).toBe('exact');
      
      // 5. Apply the rewrite through diagram store
      act(() => {
        diagramStore.current.applyRewrite(rewriteAB, 0);
      });
      
      // 6. Validate the result
      const currentDiagram = diagramStore.current.currentDiagram;
      expect(currentDiagram).not.toBeNull();
      
      if (currentDiagram && currentDiagram.dimension === 0) {
        expect(currentDiagram.generator.id).toBe('b');
      }
      
      // 7. Validate with complete system
      const validation = diagramStore.current.validateCurrentDiagram();
      expect(validation.isValid).toBe(true);
    });

    it('should handle diagram composition with validation', () => {
      const { result: diagramStore } = renderHook(() => useDiagramStore());
      
      // Create two composable diagrams
      const genA: Generator = { id: 'a', label: 'A' };
      const genB: Generator = { id: 'b', label: 'B' };
      
      const diagramA = createGeneratorDiagram(genA);
      const diagramB = createGeneratorDiagram(genB);
      
      // Set first diagram
      act(() => {
        diagramStore.current.setDiagram(diagramA);
      });
      
      // Check if composable
      const canCompose = diagramStore.current.canComposeWith(diagramB);
      expect(typeof canCompose).toBe('boolean');
      
      // Attempt composition
      act(() => {
        diagramStore.current.composeWithDiagram(diagramB);
      });
      
      // Verify result
      const result = diagramStore.current.currentDiagram;
      expect(result).not.toBeNull();
      
      if (result) {
        // Should have increased dimension or maintained structure
        expect(result.dimension).toBeGreaterThanOrEqual(0);
        
        // Should validate
        const validation = diagramStore.current.validateCurrentDiagram();
        expect(validation.axiomResults).toBeDefined();
      }
    });
  });

  describe('Serialization Integration', () => {
    it('should serialize and restore complete store state', () => {
      const { result: diagramStore } = renderHook(() => useDiagramStore());
      const { result: rewriteStore } = renderHook(() => useRewriteStore());
      
      // Set up complex state
      const diagram = createGeneratorDiagram({ id: 'test', label: 'Test' });
      const rewrite = createGeneratorRewrite({ id: 'a' }, { id: 'b' });
      
      act(() => {
        diagramStore.current.setDiagram(diagram);
        rewriteStore.current.addRewriteRule('test-rule', rewrite);
      });
      
      // Export rewrite rules
      const exportedRules = rewriteStore.current.exportRules();
      expect(exportedRules).toBeTruthy();
      expect(typeof exportedRules).toBe('string');
      
      // Serialize current diagram
      const serializedDiagram = serialize(diagram);
      expect(serializedDiagram).toBeTruthy();
      
      // Clear state
      act(() => {
        diagramStore.current.clearDiagram();
        rewriteStore.current.clearAllRewrites();
      });
      
      expect(diagramStore.current.currentDiagram?.generator.id).toBe('empty');
      expect(rewriteStore.current.availableRules).toHaveLength(0);
      
      // Restore state
      const restoredDiagram = deserialize(serializedDiagram);
      
      act(() => {
        diagramStore.current.setDiagram(restoredDiagram);
        rewriteStore.current.importRules(exportedRules);
      });
      
      expect(diagramStore.current.currentDiagram).toEqual(diagram);
      expect(rewriteStore.current.availableRules).toHaveLength(1);
    });
  });

  describe('Error Handling Across Systems', () => {
    it('should handle errors gracefully across all systems', () => {
      const { result: diagramStore } = renderHook(() => useDiagramStore());
      const { result: rewriteStore } = renderHook(() => useRewriteStore());
      
      // Try to add invalid rewrite rule
      const invalidRewrite = { dimension: -1 } as any;
      
      expect(() => {
        act(() => {
          rewriteStore.current.addRewriteRule('invalid', invalidRewrite);
        });
      }).toThrow('Invalid rewrite rule');
      
      // Store should remain in valid state
      expect(rewriteStore.current.availableRules).toHaveLength(0);
      
      // Try to set invalid diagram
      const invalidDiagram = { dimension: -1 } as any;
      
      expect(() => {
        act(() => {
          diagramStore.current.setDiagram(invalidDiagram);
        });
      }).toThrow('Invalid diagram structure');
      
      // Store should remain in valid state
      expect(diagramStore.current.currentDiagram?.generator.id).toBe('empty');
    });

    it('should recover from partial failures', () => {
      const { result: diagramStore } = renderHook(() => useDiagramStore());
      
      // Set up valid initial state
      const validDiagram = createGeneratorDiagram({ id: 'valid', label: 'Valid' });
      
      act(() => {
        diagramStore.current.setDiagram(validDiagram);
      });
      
      expect(diagramStore.current.currentDiagram).toEqual(validDiagram);
      
      // Try an operation that might fail
      const invalidRewrite = {
        dimension: 0,
        source: null,
        target: null
      } as any;
      
      // This should throw but not crash the store
      expect(() => {
        act(() => {
          diagramStore.current.applyRewrite(invalidRewrite, 0);
        });
      }).toThrow('NPR axiom violation');
      
      // Store should maintain valid state
      expect(diagramStore.current.currentDiagram).toEqual(validDiagram);
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle large numbers of rules efficiently', () => {
      const { result: rewriteStore } = renderHook(() => useRewriteStore());
      
      // Add many rules
      const rules = Array.from({ length: 100 }, (_, i) => ({
        id: `rule-${i}`,
        rewrite: createGeneratorRewrite({ id: `gen-${i}` }, { id: `target-${i}` })
      }));
      
      const startTime = performance.now();
      
      act(() => {
        rewriteStore.current.batchAddRules(rules);
      });
      
      const addTime = performance.now() - startTime;
      expect(addTime).toBeLessThan(100); // Should be fast
      
      expect(rewriteStore.current.availableRules).toHaveLength(100);
      
      // Test fast lookup
      const lookupStart = performance.now();
      const foundRule = rewriteStore.current.findRuleById('rule-50');
      const lookupTime = performance.now() - lookupStart;
      
      expect(foundRule).toBeDefined();
      expect(foundRule?.id).toBe('rule-50');
      expect(lookupTime).toBeLessThan(1); // Should be very fast
    });

    it('should handle complex diagram operations efficiently', () => {
      const { result: diagramStore } = renderHook(() => useDiagramStore());
      
      // Create a series of operations
      const operations: Array<() => void> = [];
      
      for (let i = 0; i < 10; i++) {
        operations.push(() => {
          const gen: Generator = { id: `gen-${i}`, label: `G${i}` };
          const diagram = createGeneratorDiagram(gen);
          diagramStore.current.setDiagram(diagram);
        });
      }
      
      const startTime = performance.now();
      
      act(() => {
        operations.forEach(op => op());
      });
      
      const operationTime = performance.now() - startTime;
      expect(operationTime).toBeLessThan(50); // Should be efficient
      
      // History should be maintained
      expect(diagramStore.current.history.length).toBeGreaterThan(0);
      
      // Should be able to undo efficiently
      const undoStart = performance.now();
      
      act(() => {
        diagramStore.current.undo();
      });
      
      const undoTime = performance.now() - undoStart;
      expect(undoTime).toBeLessThan(5); // Undo should be very fast
    });
  });
});