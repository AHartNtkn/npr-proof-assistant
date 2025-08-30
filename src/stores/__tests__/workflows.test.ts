/**
 * End-to-End Workflow Tests for Common Diagram Operations
 * Tests that simulate real-world usage scenarios in the NPR proof assistant
 */

import { renderHook, act } from '@testing-library/react';
import { useDiagramStore } from '../useDiagramStore';
import { useRewriteStore } from '../useRewriteStore';
import { 
  createGeneratorDiagram,
  createEmptyDiagram,
  createGeneratorRewrite,
  type Generator,
  type Diagram
} from '../../types';

describe('End-to-End Workflow Tests', () => {
  let diagramStore: ReturnType<typeof renderHook<typeof useDiagramStore>>;
  let rewriteStore: ReturnType<typeof renderHook<typeof useRewriteStore>>;

  beforeEach(() => {
    // Initialize both stores
    diagramStore = renderHook(() => useDiagramStore());
    rewriteStore = renderHook(() => useRewriteStore());
    
    // Reset to clean state
    act(() => {
      diagramStore.result.current.clearDiagram();
      rewriteStore.result.current.clearAllRewrites();
    });
  });

  describe('Formula Mode Workflows', () => {
    it('should create a simple formula from scratch', () => {
      // Workflow: Start with empty diagram → Add generators → Build formula
      
      // 1. Start with empty diagram (already done in beforeEach)
      expect(diagramStore.result.current.currentDiagram?.generator.id).toBe('empty');
      
      // 2. Add first generator (A)
      const genA: Generator = { id: 'A', label: 'A', color: 'cartesian' };
      
      act(() => {
        diagramStore.result.current.addGenerator(genA);
      });
      
      expect(diagramStore.result.current.currentDiagram?.dimension).toBe(0);
      if (diagramStore.result.current.currentDiagram?.dimension === 0) {
        expect(diagramStore.result.current.currentDiagram.generator).toEqual(genA);
      }
      
      // 3. Create second generator (B) and compose
      const genB: Generator = { id: 'B', label: 'B', color: 'cocartesian' };
      const diagramB = createGeneratorDiagram(genB);
      
      act(() => {
        diagramStore.result.current.composeWithDiagram(diagramB);
      });
      
      // 4. Validate the composed formula
      const validation = diagramStore.result.current.validateCurrentDiagram();
      expect(validation.isValid).toBe(true);
      
      // 5. Check NPR compliance
      const nprValidation = diagramStore.result.current.validateNPRCompliance();
      expect(nprValidation.isValid).toBe(true);
      expect(nprValidation.errors).toHaveLength(0);
    });

    it('should build a complex cartesian product formula', () => {
      // Workflow: Build A × B × C using cartesian generators
      
      const generators: Generator[] = [
        { id: 'A', label: 'A', color: 'cartesian' },
        { id: 'B', label: 'B', color: 'cartesian' },
        { id: 'C', label: 'C', color: 'cartesian' }
      ];
      
      // Build formula incrementally
      act(() => {
        diagramStore.result.current.addGenerator(generators[0]);
      });
      
      for (let i = 1; i < generators.length; i++) {
        const nextDiagram = createGeneratorDiagram(generators[i]);
        
        act(() => {
          // Check if composable first
          const canCompose = diagramStore.result.current.canComposeWith(nextDiagram);
          expect(canCompose).toBe(true);
          
          // Compose
          diagramStore.result.current.composeWithDiagram(nextDiagram);
        });
      }
      
      // Validate final formula
      const currentDiagram = diagramStore.result.current.currentDiagram;
      expect(currentDiagram).not.toBeNull();
      expect(currentDiagram!.dimension).toBeGreaterThan(0);
      
      // Should satisfy cartesian axioms
      const validation = diagramStore.result.current.validateNPRCompliance();
      expect(validation.isValid).toBe(true);
    });

    it('should handle mixed cartesian/cocartesian structures', () => {
      // Workflow: Create A × (B + C) structure
      
      // 1. Create cartesian generator A
      const cartesianA: Generator = { id: 'A', label: 'A', color: 'cartesian' };
      
      act(() => {
        diagramStore.result.current.addGenerator(cartesianA);
      });
      
      // 2. Create cocartesian part B + C
      const cocartesianB: Generator = { id: 'B', label: 'B', color: 'cocartesian' };
      const cocartesianC: Generator = { id: 'C', label: 'C', color: 'cocartesian' };
      
      const diagramB = createGeneratorDiagram(cocartesianB);
      const diagramC = createGeneratorDiagram(cocartesianC);
      
      // Build the structure step by step
      act(() => {
        diagramStore.result.current.composeWithDiagram(diagramB);
      });
      
      act(() => {
        diagramStore.result.current.composeWithDiagram(diagramC);
      });
      
      // Validate mixed structure
      const validation = diagramStore.result.current.validateNPRCompliance();
      // Mixed structures might have specific validation rules
      expect(validation).toBeDefined();
      expect(validation.errors.length).toBeLessThanOrEqual(0);
    });
  });

  describe('Proof Mode Workflows', () => {
    it('should apply axiom rules to transform formulas', () => {
      // Workflow: Create formula → Load axioms → Apply transformations
      
      // 1. Create initial formula
      const genA: Generator = { id: 'A', label: 'A' };
      const genB: Generator = { id: 'B', label: 'B' };
      
      act(() => {
        diagramStore.result.current.addGenerator(genA);
      });
      
      // 2. Load NPR axiom rules
      act(() => {
        rewriteStore.result.current.loadNPRAxioms();
      });
      
      const axiomRules = rewriteStore.result.current.getRulesByCategory('axiom');
      expect(axiomRules.length).toBeGreaterThan(0);
      
      // 3. Create a transformation rule
      const transformRule = createGeneratorRewrite(genA, genB);
      
      act(() => {
        rewriteStore.result.current.addRewriteRule('A-to-B', transformRule);
      });
      
      // 4. Find applicable rules
      const currentDiagram = diagramStore.result.current.currentDiagram!;
      const applicableRules = rewriteStore.result.current.getApplicableRules(currentDiagram);
      
      const ourRule = applicableRules.find(r => r.id === 'A-to-B');
      expect(ourRule).toBeDefined();
      
      // 5. Apply the transformation
      act(() => {
        diagramStore.result.current.applyRewrite(transformRule, 0);
      });
      
      // 6. Verify transformation
      const transformedDiagram = diagramStore.result.current.currentDiagram;
      if (transformedDiagram?.dimension === 0) {
        expect(transformedDiagram.generator.id).toBe('B');
      }
      
      // 7. Validate result still satisfies NPR axioms
      const validation = diagramStore.result.current.validateNPRCompliance();
      expect(validation.isValid).toBe(true);
    });

    it('should handle multi-step proof transformations', () => {
      // Workflow: A → B → C → D chain of transformations
      
      const generators = ['A', 'B', 'C', 'D'].map(label => ({ id: label, label }));
      
      // 1. Start with A
      act(() => {
        diagramStore.result.current.addGenerator(generators[0]);
      });
      
      // 2. Create transformation rules A→B, B→C, C→D
      const transformations = [
        { from: generators[0], to: generators[1] },
        { from: generators[1], to: generators[2] },
        { from: generators[2], to: generators[3] }
      ];
      
      transformations.forEach(({ from, to }, index) => {
        const rule = createGeneratorRewrite(from, to);
        act(() => {
          rewriteStore.result.current.addRewriteRule(`rule-${index}`, rule);
        });
      });
      
      // 3. Apply transformations step by step
      let currentGen = generators[0];
      
      for (let i = 0; i < transformations.length; i++) {
        const { from, to } = transformations[i];
        const rule = createGeneratorRewrite(from, to);
        
        act(() => {
          diagramStore.result.current.applyRewrite(rule, 0);
        });
        
        // Verify intermediate state
        const currentDiagram = diagramStore.result.current.currentDiagram;
        if (currentDiagram?.dimension === 0) {
          expect(currentDiagram.generator.id).toBe(to.id);
        }
        
        currentGen = to;
      }
      
      // 4. Verify final state is D
      const finalDiagram = diagramStore.result.current.currentDiagram;
      if (finalDiagram?.dimension === 0) {
        expect(finalDiagram.generator.id).toBe('D');
      }
      
      // 5. Check history is maintained
      expect(diagramStore.result.current.history.length).toBeGreaterThan(0);
      
      // 6. Test undo functionality
      act(() => {
        diagramStore.result.current.undo();
      });
      
      const undoDiagram = diagramStore.result.current.currentDiagram;
      if (undoDiagram?.dimension === 0) {
        expect(undoDiagram.generator.id).toBe('C');
      }
    });

    it('should detect and resolve rule conflicts', () => {
      // Workflow: Create conflicting rules → Detect conflicts → Resolve with priority
      
      const genA: Generator = { id: 'A', label: 'A' };
      const genB: Generator = { id: 'B', label: 'B' };
      const genC: Generator = { id: 'C', label: 'C' };
      
      // 1. Set up diagram with A
      act(() => {
        diagramStore.result.current.addGenerator(genA);
      });
      
      // 2. Add conflicting rules: A→B and A→C
      const ruleAB = createGeneratorRewrite(genA, genB);
      const ruleAC = createGeneratorRewrite(genA, genC);
      
      act(() => {
        rewriteStore.result.current.addRewriteRule('A-to-B', ruleAB, 1); // Low priority
        rewriteStore.result.current.addRewriteRule('A-to-C', ruleAC, 10); // High priority
      });
      
      // 3. Detect conflicts
      const conflicts = rewriteStore.result.current.detectConflicts();
      expect(conflicts.length).toBeGreaterThan(0);
      
      const conflict = conflicts.find(c => 
        c.conflictingRules.includes('A-to-B') && 
        c.conflictingRules.includes('A-to-C')
      );
      expect(conflict).toBeDefined();
      
      // 4. Resolve with priority
      const currentDiagram = diagramStore.result.current.currentDiagram!;
      const chosenRule = rewriteStore.result.current.resolveWithPriority(currentDiagram);
      
      expect(chosenRule).toBeDefined();
      expect(chosenRule?.id).toBe('A-to-C'); // Higher priority rule
      
      // 5. Apply chosen rule
      act(() => {
        diagramStore.result.current.applyRewrite(chosenRule!.rewrite, 0);
      });
      
      const result = diagramStore.result.current.currentDiagram;
      if (result?.dimension === 0) {
        expect(result.generator.id).toBe('C');
      }
    });
  });

  describe('Mixed Mode Workflows', () => {
    it('should transition between formula and proof modes', () => {
      // Workflow: Build formula in formula mode → Switch to proof mode → Apply rules
      
      // 1. Formula mode: Build A × B
      const genA: Generator = { id: 'A', label: 'A', color: 'cartesian' };
      const genB: Generator = { id: 'B', label: 'B', color: 'cartesian' };
      
      act(() => {
        diagramStore.result.current.addGenerator(genA);
      });
      
      const diagramB = createGeneratorDiagram(genB);
      
      act(() => {
        diagramStore.result.current.composeWithDiagram(diagramB);
      });
      
      // Validate formula
      const formulaValidation = diagramStore.result.current.validateCurrentDiagram();
      expect(formulaValidation.isValid).toBe(true);
      
      // 2. Switch to proof mode: Load axioms and rules
      act(() => {
        rewriteStore.result.current.loadNPRAxioms();
      });
      
      // 3. Create proof transformations
      const genC: Generator = { id: 'C', label: 'C', color: 'cartesian' };
      const genD: Generator = { id: 'D', label: 'D', color: 'cartesian' };
      
      // Add some transformation rules
      const ruleAC = createGeneratorRewrite(genA, genC);
      const ruleBD = createGeneratorRewrite(genB, genD);
      
      act(() => {
        rewriteStore.result.current.addRewriteRule('A-to-C', ruleAC);
        rewriteStore.result.current.addRewriteRule('B-to-D', ruleBD);
      });
      
      // 4. Apply transformations to the composed formula
      const currentDiagram = diagramStore.result.current.currentDiagram!;
      const applicableRules = rewriteStore.result.current.getApplicableRules(currentDiagram);
      
      expect(applicableRules.length).toBeGreaterThan(0);
      
      // Apply first applicable rule
      if (applicableRules.length > 0) {
        act(() => {
          diagramStore.result.current.applyRewrite(applicableRules[0].rewrite, 0);
        });
      }
      
      // 5. Validate result maintains NPR compliance
      const proofValidation = diagramStore.result.current.validateNPRCompliance();
      expect(proofValidation.isValid).toBe(true);
    });

    it('should save and restore complex proof states', () => {
      // Workflow: Build complex state → Export → Clear → Import → Verify
      
      // 1. Build complex state
      const genA: Generator = { id: 'A', label: 'A' };
      const genB: Generator = { id: 'B', label: 'B' };
      const genC: Generator = { id: 'C', label: 'C' };
      
      // Create diagram
      act(() => {
        diagramStore.result.current.addGenerator(genA);
      });
      
      // Add multiple rewrite rules
      const rules = [
        { id: 'A-to-B', rule: createGeneratorRewrite(genA, genB) },
        { id: 'B-to-C', rule: createGeneratorRewrite(genB, genC) },
        { id: 'A-to-C', rule: createGeneratorRewrite(genA, genC) }
      ];
      
      rules.forEach(({ id, rule }) => {
        act(() => {
          rewriteStore.result.current.addRewriteRule(id, rule);
        });
      });
      
      // Apply some transformations
      act(() => {
        diagramStore.result.current.applyRewrite(rules[0].rule, 0); // A → B
        diagramStore.result.current.applyRewrite(rules[1].rule, 0); // B → C
      });
      
      // 2. Export state
      const exportedRules = rewriteStore.result.current.exportRules();
      const currentDiagram = diagramStore.result.current.currentDiagram!;
      
      // 3. Clear everything
      act(() => {
        diagramStore.result.current.clearDiagram();
        rewriteStore.result.current.clearAllRewrites();
      });
      
      expect(diagramStore.result.current.currentDiagram?.generator.id).toBe('empty');
      expect(rewriteStore.result.current.availableRules).toHaveLength(0);
      
      // 4. Import state
      act(() => {
        diagramStore.result.current.setDiagram(currentDiagram);
        rewriteStore.result.current.importRules(exportedRules);
      });
      
      // 5. Verify restoration
      expect(diagramStore.result.current.currentDiagram).toEqual(currentDiagram);
      expect(rewriteStore.result.current.availableRules.length).toBe(3);
      
      // 6. Verify rules still work
      const restoredRules = rewriteStore.result.current.availableRules;
      const foundRule = restoredRules.find(r => r.id === 'A-to-C');
      expect(foundRule).toBeDefined();
      
      // Test rule application still works
      const testDiagram = createGeneratorDiagram(genA);
      const applicableRules = rewriteStore.result.current.getApplicableRules(testDiagram);
      const ourRestoreRule = applicableRules.find(r => r.id === 'A-to-C');
      expect(ourRestoreRule).toBeDefined();
    });
  });

  describe('Error Recovery Workflows', () => {
    it('should recover gracefully from invalid operations', () => {
      // Workflow: Valid state → Invalid operation → Recovery → Continue
      
      // 1. Establish valid state
      const genA: Generator = { id: 'A', label: 'A' };
      
      act(() => {
        diagramStore.result.current.addGenerator(genA);
      });
      
      const validDiagram = diagramStore.result.current.currentDiagram!;
      expect(validDiagram).toBeDefined();
      
      // 2. Attempt invalid operation
      const invalidRewrite = {
        dimension: 0,
        source: null,
        target: null
      } as any;
      
      expect(() => {
        act(() => {
          diagramStore.result.current.applyRewrite(invalidRewrite, 0);
        });
      }).toThrow('NPR axiom violation');
      
      // 3. Verify state is unchanged
      expect(diagramStore.result.current.currentDiagram).toEqual(validDiagram);
      
      // 4. Continue with valid operations
      const genB: Generator = { id: 'B', label: 'B' };
      const validRewrite = createGeneratorRewrite(genA, genB);
      
      act(() => {
        diagramStore.result.current.applyRewrite(validRewrite, 0);
      });
      
      const resultDiagram = diagramStore.result.current.currentDiagram;
      if (resultDiagram?.dimension === 0) {
        expect(resultDiagram.generator.id).toBe('B');
      }
    });

    it('should handle partial system failures without corruption', () => {
      // Workflow: Multi-system operation → Partial failure → State consistency
      
      // 1. Set up multi-system state
      const genA: Generator = { id: 'A', label: 'A' };
      
      act(() => {
        diagramStore.result.current.addGenerator(genA);
        rewriteStore.result.current.loadNPRAxioms();
      });
      
      expect(diagramStore.result.current.currentDiagram).toBeDefined();
      expect(rewriteStore.result.current.availableRules.length).toBeGreaterThan(0);
      
      // 2. Attempt operation that might cause partial failure
      const invalidRule = {
        dimension: -1,
        source: genA,
        target: { id: 'invalid' }
      } as any;
      
      expect(() => {
        act(() => {
          rewriteStore.result.current.addRewriteRule('invalid-rule', invalidRule);
        });
      }).toThrow('Invalid rewrite rule');
      
      // 3. Verify both systems maintain consistency
      expect(diagramStore.result.current.currentDiagram).toBeDefined();
      expect(rewriteStore.result.current.availableRules.every(r => 
        r.rewrite && typeof r.rewrite === 'object'
      )).toBe(true);
      
      // 4. Continue operations should work normally
      const genB: Generator = { id: 'B', label: 'B' };
      const validRule = createGeneratorRewrite(genA, genB);
      
      act(() => {
        rewriteStore.result.current.addRewriteRule('valid-rule', validRule);
      });
      
      expect(rewriteStore.result.current.findRuleById('valid-rule')).toBeDefined();
    });
  });
});