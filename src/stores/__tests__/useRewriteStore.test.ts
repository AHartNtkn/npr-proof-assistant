/**
 * Tests for useRewriteStore - managing rewrite rules and transformations
 * Following TDD approach - these tests should fail initially
 */

import { renderHook, act } from '@testing-library/react';
import { useRewriteStore } from '../useRewriteStore';
import { 
  createGeneratorRewrite,
  createIdentityRewrite,
  type Rewrite,
  type Generator,
  type Diagram
} from '../../types';
import { composeDiagrams } from '../../engine';
import { getAllNPRAxioms } from '../../axioms';

describe('useRewriteStore Tests', () => {
  beforeEach(() => {
    // Reset store before each test
    const { result } = renderHook(() => useRewriteStore());
    act(() => {
      result.current.clearAllRewrites();
    });
  });

  describe('Rewrite Rule Management', () => {
    it('should add and manage rewrite rules', () => {
      const { result } = renderHook(() => useRewriteStore());
      
      const genA: Generator = { id: 'a', label: 'A' };
      const genB: Generator = { id: 'b', label: 'B' };
      const rewrite = createGeneratorRewrite(genA, genB);
      
      // This should fail initially - need to implement rule management
      expect(result.current.addRewriteRule).toBeDefined();
      expect(result.current.availableRules).toBeInstanceOf(Array);
      
      act(() => {
        result.current.addRewriteRule('test-rule', rewrite);
      });
      
      expect(result.current.availableRules).toHaveLength(1);
      expect(result.current.availableRules[0].id).toBe('test-rule');
      expect(result.current.availableRules[0].rewrite).toEqual(rewrite);
    });

    it('should validate rewrite rules before adding', () => {
      const { result } = renderHook(() => useRewriteStore());
      
      const invalidRewrite = {
        dimension: -1,
        source: null,
        target: null
      } as any;
      
      // This should fail initially - need to implement validation
      expect(() => {
        act(() => {
          result.current.addRewriteRule('invalid', invalidRewrite);
        });
      }).toThrow('Invalid rewrite rule');
    });

    it('should remove rewrite rules', () => {
      const { result } = renderHook(() => useRewriteStore());
      
      const rewrite = createIdentityRewrite();
      
      act(() => {
        result.current.addRewriteRule('test-rule', rewrite);
      });
      
      expect(result.current.availableRules).toHaveLength(1);
      
      act(() => {
        result.current.removeRewriteRule('test-rule');
      });
      
      expect(result.current.availableRules).toHaveLength(0);
    });

    it('should categorize rules by type', () => {
      const { result } = renderHook(() => useRewriteStore());
      
      const genRewrite = createGeneratorRewrite(
        { id: 'a' }, 
        { id: 'b' }
      );
      const identityRewrite = createIdentityRewrite();
      
      act(() => {
        result.current.addRewriteRule('gen-rule', genRewrite);
        result.current.addRewriteRule('id-rule', identityRewrite);
      });
      
      // This should fail initially - need to implement categorization
      expect(result.current.getRulesByType).toBeDefined();
      
      const generatorRules = result.current.getRulesByType('generator');
      const identityRules = result.current.getRulesByType('identity');
      
      expect(generatorRules).toHaveLength(1);
      expect(identityRules).toHaveLength(1);
    });
  });

  describe('Rule Application System', () => {
    it('should find applicable rules for a diagram', () => {
      const { result } = renderHook(() => useRewriteStore());
      
      const genA: Generator = { id: 'a', label: 'A' };
      const genB: Generator = { id: 'b', label: 'B' };
      const testDiagram: Diagram = {
        dimension: 0,
        generator: genA
      };
      
      const rewrite = createGeneratorRewrite(genA, genB);
      
      act(() => {
        result.current.addRewriteRule('a-to-b', rewrite);
      });
      
      // This should fail initially - need to implement rule matching
      expect(result.current.getApplicableRules).toBeDefined();
      
      const applicableRules = result.current.getApplicableRules(testDiagram);
      expect(applicableRules).toHaveLength(1);
      expect(applicableRules[0].id).toBe('a-to-b');
    });

    it('should validate rule compatibility with NPR axioms', () => {
      const { result } = renderHook(() => useRewriteStore());
      
      const cartesianGen: Generator = { id: 'cart', color: 'cartesian' };
      const cocartesianGen: Generator = { id: 'cocart', color: 'cocartesian' };
      
      // This could violate NPR axioms depending on context
      const conflictingRewrite = createGeneratorRewrite(cartesianGen, cocartesianGen);
      
      // This should fail initially - need to implement NPR validation
      expect(result.current.validateRuleWithNPR).toBeDefined();
      
      const isValid = result.current.validateRuleWithNPR(conflictingRewrite);
      expect(typeof isValid).toBe('boolean');
    });

    it('should suggest rule compositions', () => {
      const { result } = renderHook(() => useRewriteStore());
      
      const genA: Generator = { id: 'a' };
      const genB: Generator = { id: 'b' };
      const genC: Generator = { id: 'c' };
      
      const ruleAB = createGeneratorRewrite(genA, genB);
      const ruleBC = createGeneratorRewrite(genB, genC);
      
      act(() => {
        result.current.addRewriteRule('a-to-b', ruleAB);
        result.current.addRewriteRule('b-to-c', ruleBC);
      });
      
      // This should fail initially - need to implement composition suggestions
      expect(result.current.suggestCompositions).toBeDefined();
      
      const suggestions = result.current.suggestCompositions(ruleAB);
      expect(suggestions).toHaveLength(1);
      expect(suggestions[0].composedWith).toBe('b-to-c');
    });
  });

  describe('Rule Collections and Libraries', () => {
    it('should load predefined NPR axiom rules', () => {
      const { result } = renderHook(() => useRewriteStore());
      
      // This should fail initially - need to implement axiom loading
      expect(result.current.loadNPRAxioms).toBeDefined();
      
      act(() => {
        result.current.loadNPRAxioms();
      });
      
      const axiomRules = result.current.getRulesByCategory('axiom');
      expect(axiomRules.length).toBeGreaterThan(0);
    });

    it('should create custom rule collections', () => {
      const { result } = renderHook(() => useRewriteStore());
      
      const rules = [
        createIdentityRewrite(),
        createGeneratorRewrite({ id: 'x' }, { id: 'y' })
      ];
      
      // This should fail initially - need to implement collections
      expect(result.current.createRuleCollection).toBeDefined();
      
      act(() => {
        result.current.createRuleCollection('custom', rules);
      });
      
      const collection = result.current.getRuleCollection('custom');
      expect(collection).toBeDefined();
      expect(collection!.rules).toHaveLength(2);
    });

    it('should export and import rule collections', () => {
      const { result } = renderHook(() => useRewriteStore());
      
      const rewrite = createIdentityRewrite();
      
      act(() => {
        result.current.addRewriteRule('test', rewrite);
      });
      
      // This should fail initially - need to implement serialization
      expect(result.current.exportRules).toBeDefined();
      expect(result.current.importRules).toBeDefined();
      
      const exportedData = result.current.exportRules();
      expect(exportedData).toBeDefined();
      expect(typeof exportedData).toBe('string');
      
      act(() => {
        result.current.clearAllRewrites();
      });
      expect(result.current.availableRules).toHaveLength(0);
      
      act(() => {
        result.current.importRules(exportedData);
      });
      expect(result.current.availableRules).toHaveLength(1);
    });
  });

  describe('Performance and Optimization', () => {
    it('should index rules for fast lookup', () => {
      const { result } = renderHook(() => useRewriteStore());
      
      // Add many rules
      const rules = Array.from({ length: 100 }, (_, i) => {
        const gen = { id: `gen-${i}` };
        const target = { id: `target-${i}` };
        return createGeneratorRewrite(gen, target);
      });
      
      act(() => {
        rules.forEach((rule, i) => {
          result.current.addRewriteRule(`rule-${i}`, rule);
        });
      });
      
      expect(result.current.availableRules).toHaveLength(100);
      
      // This should fail initially - need to implement optimized lookup
      expect(result.current.ruleIndex).toBeDefined();
      
      const lookupTime = performance.now();
      const rule = result.current.findRuleById('rule-50');
      const lookupDuration = performance.now() - lookupTime;
      
      expect(rule).toBeDefined();
      expect(lookupDuration).toBeLessThan(1); // Should be fast
    });

    it('should batch rule operations efficiently', () => {
      const { result } = renderHook(() => useRewriteStore());
      
      const rules = Array.from({ length: 10 }, (_, i) => ({
        id: `rule-${i}`,
        rewrite: createIdentityRewrite()
      }));
      
      // This should fail initially - need to implement batching
      expect(result.current.batchAddRules).toBeDefined();
      
      act(() => {
        result.current.batchAddRules(rules);
      });
      
      expect(result.current.availableRules).toHaveLength(10);
    });
  });

  describe('Rule Conflict Detection', () => {
    it('should detect conflicting rules', () => {
      const { result } = renderHook(() => useRewriteStore());
      
      const genA: Generator = { id: 'a' };
      const genB: Generator = { id: 'b' };
      const genC: Generator = { id: 'c' };
      
      const rule1 = createGeneratorRewrite(genA, genB);
      const rule2 = createGeneratorRewrite(genA, genC); // Conflicting
      
      act(() => {
        result.current.addRewriteRule('rule1', rule1);
        result.current.addRewriteRule('rule2', rule2);
      });
      
      // This should fail initially - need to implement conflict detection
      expect(result.current.detectConflicts).toBeDefined();
      
      const conflicts = result.current.detectConflicts();
      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].conflictingRules).toContain('rule1');
      expect(conflicts[0].conflictingRules).toContain('rule2');
    });

    it('should resolve conflicts with priority system', () => {
      const { result } = renderHook(() => useRewriteStore());
      
      const genA: Generator = { id: 'a' };
      const genB: Generator = { id: 'b' };
      const genC: Generator = { id: 'c' };
      
      const lowPriorityRule = createGeneratorRewrite(genA, genB);
      const highPriorityRule = createGeneratorRewrite(genA, genC);
      
      act(() => {
        result.current.addRewriteRule('low', lowPriorityRule, 1);
        result.current.addRewriteRule('high', highPriorityRule, 10);
      });
      
      const testDiagram: Diagram = { dimension: 0, generator: genA };
      
      // This should fail initially - need to implement priority resolution
      expect(result.current.resolveWithPriority).toBeDefined();
      
      const chosenRule = result.current.resolveWithPriority(testDiagram);
      expect(chosenRule?.id).toBe('high');
    });
  });
});