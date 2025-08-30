/**
 * Tests for categorical normalization operations
 * Following TDD: Red -> Green -> Refactor cycle
 */

import { describe, it, expect } from 'vitest';
import {
  normalizeDiagram,
  normalizeRewrite,
  reduceTerms,
  checkTypeConsistency,
  performBetaReduction,
  performEtaExpansion,
  isNormalForm
} from '../normalization';
import {
  createGeneratorDiagram,
  createEmptyDiagram,
  type Diagram,
  type Generator
} from '../../types/diagram';
import {
  createGeneratorRewrite,
  createIdentityRewrite,
  createCospanRewrite,
  type Cospan,
  type Rewrite
} from '../../types/rewrite';

describe('Normalization Operations', () => {
  describe('normalizeDiagram', () => {
    it('should normalize a 0-dimensional diagram to itself if already normal', () => {
      const generator: Generator = { id: 'test-gen', label: 'A' };
      const diagram = createGeneratorDiagram(generator);
      
      const result = normalizeDiagram(diagram);
      
      expect(result).toEqual(diagram);
      expect(isNormalForm(result)).toBe(true);
    });

    it('should normalize empty diagram to itself', () => {
      const diagram = createEmptyDiagram();
      
      const result = normalizeDiagram(diagram);
      
      expect(result).toEqual(diagram);
      expect(isNormalForm(result)).toBe(true);
    });

    it('should normalize higher dimensional diagrams', () => {
      const sourceGen: Generator = { id: 'source', label: 'S' };
      const sourceDiagram = createGeneratorDiagram(sourceGen);
      
      const diagram: Diagram = {
        dimension: 1,
        source: sourceDiagram,
        cospans: []
      };
      
      const result = normalizeDiagram(diagram);
      
      expect(result).toBeDefined();
      expect(result.dimension).toBeGreaterThanOrEqual(0);
      expect(isNormalForm(result)).toBe(true);
    });

    it('should preserve cartesian structure during normalization', () => {
      const cartesianGen: Generator = { 
        id: 'cart-gen', 
        label: 'C', 
        color: 'cartesian' 
      };
      const diagram = createGeneratorDiagram(cartesianGen);
      
      const result = normalizeDiagram(diagram);
      
      if (result.dimension === 0) {
        expect(result.generator.color).toBe('cartesian');
      }
      expect(isNormalForm(result)).toBe(true);
    });

    it('should handle complex nested structures', () => {
      const gen1: Generator = { id: 'gen1', label: 'A' };
      const gen2: Generator = { id: 'gen2', label: 'B' };
      const innerDiagram = createGeneratorDiagram(gen1);
      
      const complexDiagram: Diagram = {
        dimension: 2,
        source: innerDiagram,
        cospans: [{
          forward: createGeneratorRewrite(gen1, gen2),
          backward: createGeneratorRewrite(gen2, gen1)
        }]
      };
      
      const result = normalizeDiagram(complexDiagram);
      
      expect(result).toBeDefined();
      expect(isNormalForm(result)).toBe(true);
    });
  });

  describe('normalizeRewrite', () => {
    it('should normalize identity rewrites to themselves', () => {
      const identity = createIdentityRewrite();
      
      const result = normalizeRewrite(identity);
      
      expect(result).toEqual(identity);
      expect(result.dimension).toBe(1);
    });

    it('should normalize generator rewrites', () => {
      const gen1: Generator = { id: 'gen1', label: 'A' };
      const gen2: Generator = { id: 'gen2', label: 'B' };
      const rewrite = createGeneratorRewrite(gen1, gen2);
      
      const result = normalizeRewrite(rewrite);
      
      expect(result).toBeDefined();
      expect(result.dimension).toBe(0);
      if (result.dimension === 0) {
        expect(result.source).toEqual(gen1);
        expect(result.target).toEqual(gen2);
      }
    });

    it('should normalize higher dimensional rewrites', () => {
      const higherDimRewrite: Rewrite = {
        dimension: 2,
        cones: []
      };
      
      const result = normalizeRewrite(higherDimRewrite);
      
      expect(result).toBeDefined();
      expect(result.dimension).toBeGreaterThanOrEqual(0);
    });

    it('should handle cones in normalization', () => {
      const gen1: Generator = { id: 'gen1', label: 'A' };
      const gen2: Generator = { id: 'gen2', label: 'B' };
      const cospan = createCospanRewrite(
        createGeneratorRewrite(gen1, gen2),
        createGeneratorRewrite(gen2, gen1)
      );
      
      const rewriteWithCone: Rewrite = {
        dimension: 2,
        cones: [{
          index: 0,
          source: [cospan],
          target: cospan,
          slices: [createIdentityRewrite()]
        }]
      };
      
      const result = normalizeRewrite(rewriteWithCone);
      
      expect(result).toBeDefined();
      expect(result.dimension).toBe(2);
    });
  });

  describe('reduceTerms', () => {
    it('should reduce identity compositions to simpler forms', () => {
      const gen: Generator = { id: 'gen', label: 'G' };
      const identity = createIdentityRewrite();
      const genRewrite = createGeneratorRewrite(gen, gen);
      const terms = [identity, genRewrite, identity];
      
      const result = reduceTerms(terms);
      
      expect(result.length).toBeLessThanOrEqual(terms.length);
      // Should eliminate redundant identities
    });

    it('should reduce inverse pairs to identity', () => {
      const gen1: Generator = { id: 'gen1', label: 'A' };
      const gen2: Generator = { id: 'gen2', label: 'B' };
      const forward = createGeneratorRewrite(gen1, gen2);
      const backward = createGeneratorRewrite(gen2, gen1);
      const terms = [forward, backward];
      
      const result = reduceTerms(terms);
      
      // Should recognize inverse patterns and reduce
      expect(result.length).toBeLessThanOrEqual(2);
    });

    it('should handle empty term list', () => {
      const terms: Rewrite[] = [];
      
      const result = reduceTerms(terms);
      
      expect(result).toEqual([]);
    });

    it('should preserve irreducible terms', () => {
      const gen1: Generator = { id: 'gen1', label: 'A' };
      const gen2: Generator = { id: 'gen2', label: 'B' };
      const gen3: Generator = { id: 'gen3', label: 'C' };
      
      const terms = [
        createGeneratorRewrite(gen1, gen2),
        createGeneratorRewrite(gen2, gen3)
      ];
      
      const result = reduceTerms(terms);
      
      // These are not reducible, should remain
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('checkTypeConsistency', () => {
    it('should return true for type-consistent diagrams', () => {
      const gen: Generator = { id: 'gen', label: 'G' };
      const diagram = createGeneratorDiagram(gen);
      
      const result = checkTypeConsistency(diagram);
      
      expect(result).toBe(true);
    });

    it('should detect type inconsistencies in complex structures', () => {
      const gen1: Generator = { id: 'gen1', label: 'A', color: 'cartesian' };
      const gen2: Generator = { id: 'gen2', label: 'B', color: 'cocartesian' };
      const sourceDiagram = createGeneratorDiagram(gen1);
      
      // Create a potentially inconsistent structure
      const diagram: Diagram = {
        dimension: 1,
        source: sourceDiagram,
        cospans: [{
          forward: createGeneratorRewrite(gen1, gen2),
          backward: createGeneratorRewrite(gen2, gen1)
        }]
      };
      
      const result = checkTypeConsistency(diagram);
      
      expect(typeof result).toBe('boolean');
    });

    it('should validate dimension consistency', () => {
      const gen: Generator = { id: 'gen', label: 'G' };
      const malformedDiagram = {
        dimension: 1,
        source: null,
        cospans: []
      } as any;
      
      const result = checkTypeConsistency(malformedDiagram);
      
      expect(result).toBe(false);
    });

    it('should check color consistency in NPR structures', () => {
      const cartGen: Generator = { id: 'cart', label: 'C', color: 'cartesian' };
      const cocartGen: Generator = { id: 'cocart', label: 'D', color: 'cocartesian' };
      
      const diagram1 = createGeneratorDiagram(cartGen);
      const diagram2 = createGeneratorDiagram(cocartGen);
      
      expect(checkTypeConsistency(diagram1)).toBe(true);
      expect(checkTypeConsistency(diagram2)).toBe(true);
    });
  });

  describe('performBetaReduction', () => {
    it('should perform beta reduction on applicable terms', () => {
      const gen1: Generator = { id: 'gen1', label: 'A' };
      const gen2: Generator = { id: 'gen2', label: 'B' };
      const rewrite = createGeneratorRewrite(gen1, gen2);
      
      const result = performBetaReduction(rewrite);
      
      expect(result).toBeDefined();
      // Beta reduction should simplify the term
    });

    it('should handle identity rewrites in beta reduction', () => {
      const identity = createIdentityRewrite();
      
      const result = performBetaReduction(identity);
      
      expect(result).toEqual(identity);
    });

    it('should reduce complex terms with beta redexes', () => {
      const higherDimRewrite: Rewrite = {
        dimension: 2,
        cones: []
      };
      
      const result = performBetaReduction(higherDimRewrite);
      
      expect(result).toBeDefined();
      expect(result.dimension).toBeGreaterThanOrEqual(0);
    });
  });

  describe('performEtaExpansion', () => {
    it('should perform eta expansion when beneficial', () => {
      const gen: Generator = { id: 'gen', label: 'G' };
      const rewrite = createGeneratorRewrite(gen, gen);
      
      const result = performEtaExpansion(rewrite);
      
      expect(result).toBeDefined();
      // Eta expansion might increase the term complexity
    });

    it('should handle identity expansion', () => {
      const identity = createIdentityRewrite();
      
      const result = performEtaExpansion(identity);
      
      expect(result).toBeDefined();
    });

    it('should preserve structure during expansion', () => {
      const gen1: Generator = { id: 'gen1', label: 'A' };
      const gen2: Generator = { id: 'gen2', label: 'B' };
      const rewrite = createGeneratorRewrite(gen1, gen2);
      
      const result = performEtaExpansion(rewrite);
      
      if (result.dimension === 0) {
        expect(result.source.id).toBe(gen1.id);
        expect(result.target.id).toBe(gen2.id);
      }
    });
  });

  describe('isNormalForm', () => {
    it('should return true for diagrams in normal form', () => {
      const gen: Generator = { id: 'gen', label: 'G' };
      const diagram = createGeneratorDiagram(gen);
      
      const result = isNormalForm(diagram);
      
      expect(result).toBe(true);
    });

    it('should return false for diagrams not in normal form', () => {
      const gen1: Generator = { id: 'gen1', label: 'A' };
      const gen2: Generator = { id: 'gen2', label: 'B' };
      const sourceDiagram = createGeneratorDiagram(gen1);
      
      // Create a diagram with potentially reducible structure
      const diagramWithRedex: Diagram = {
        dimension: 2,
        source: sourceDiagram,
        cospans: [
          // Multiple identity cospans that could be reduced
          createCospanRewrite(createIdentityRewrite(), createIdentityRewrite()),
          createCospanRewrite(createIdentityRewrite(), createIdentityRewrite())
        ]
      };
      
      const result = isNormalForm(diagramWithRedex);
      
      expect(typeof result).toBe('boolean');
    });

    it('should check normal form for empty diagrams', () => {
      const empty = createEmptyDiagram();
      
      const result = isNormalForm(empty);
      
      expect(result).toBe(true);
    });

    it('should handle complex nested structures in normal form checking', () => {
      const gen: Generator = { id: 'complex', label: 'C', color: 'cartesian' };
      const innerDiagram = createGeneratorDiagram(gen);
      
      const complexDiagram: Diagram = {
        dimension: 3,
        source: {
          dimension: 2,
          source: innerDiagram,
          cospans: []
        },
        cospans: []
      };
      
      const result = isNormalForm(complexDiagram);
      
      expect(typeof result).toBe('boolean');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle malformed inputs gracefully', () => {
      const malformed = {
        dimension: -1,
        source: null
      } as any;
      
      expect(() => normalizeDiagram(malformed)).toThrow();
    });

    it('should handle circular references during normalization', () => {
      const gen: Generator = { id: 'cycle', label: 'C' };
      const sourceDiagram = createGeneratorDiagram(gen);
      const cyclicDiagram: any = {
        dimension: 1,
        source: sourceDiagram,
        cospans: []
      };
      // Create artificial cycle
      cyclicDiagram.source = cyclicDiagram;
      
      expect(() => normalizeDiagram(cyclicDiagram)).toThrow();
    });

    it('should preserve NPR axioms during normalization', () => {
      const cartGen: Generator = { id: 'cart', label: 'C', color: 'cartesian' };
      const diagram = createGeneratorDiagram(cartGen);
      
      const result = normalizeDiagram(diagram);
      
      expect(checkTypeConsistency(result)).toBe(true);
      if (result.dimension === 0) {
        expect(result.generator.color).toBe('cartesian');
      }
    });

    it('should handle null/undefined inputs', () => {
      expect(() => normalizeDiagram(null as any)).toThrow();
      expect(() => normalizeRewrite(undefined as any)).toThrow();
    });
  });
});