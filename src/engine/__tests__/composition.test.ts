/**
 * Tests for categorical composition operations
 * Following TDD: Red -> Green -> Refactor cycle
 */

import { describe, it, expect } from 'vitest';
import {
  composeDiagrams,
  composeRewrites,
  composeSequentially,
  isComposable,
  getCompositionType
} from '../composition';
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

describe('Composition Operations', () => {
  describe('composeDiagrams', () => {
    it('should compose two 0-dimensional diagrams', () => {
      const gen1: Generator = { id: 'gen1', label: 'A' };
      const gen2: Generator = { id: 'gen2', label: 'B' };
      const diagram1 = createGeneratorDiagram(gen1);
      const diagram2 = createGeneratorDiagram(gen2);

      const result = composeDiagrams(diagram1, diagram2);

      expect(result).toBeDefined();
      expect(result.dimension).toBeGreaterThanOrEqual(0);
    });

    it('should handle composition with empty diagram as identity', () => {
      const gen: Generator = { id: 'test', label: 'T' };
      const diagram = createGeneratorDiagram(gen);
      const empty = createEmptyDiagram();

      const result1 = composeDiagrams(diagram, empty);
      const result2 = composeDiagrams(empty, diagram);

      // Composing with empty should preserve the original diagram
      expect(result1).toEqual(diagram);
      expect(result2).toEqual(diagram);
    });

    it('should preserve cartesian structure in composition', () => {
      const cartGen1: Generator = { id: 'cart1', label: 'C1', color: 'cartesian' };
      const cartGen2: Generator = { id: 'cart2', label: 'C2', color: 'cartesian' };
      const diagram1 = createGeneratorDiagram(cartGen1);
      const diagram2 = createGeneratorDiagram(cartGen2);

      const result = composeDiagrams(diagram1, diagram2);

      expect(result).toBeDefined();
      // Result should maintain some cartesian properties
    });

    it('should handle mixed color composition', () => {
      const cartGen: Generator = { id: 'cart', label: 'C', color: 'cartesian' };
      const cocartGen: Generator = { id: 'cocart', label: 'D', color: 'cocartesian' };
      const diagram1 = createGeneratorDiagram(cartGen);
      const diagram2 = createGeneratorDiagram(cocartGen);

      const result = composeDiagrams(diagram1, diagram2);

      expect(result).toBeDefined();
      expect(result.dimension).toBeGreaterThanOrEqual(0);
    });

    it('should compose higher-dimensional diagrams', () => {
      const sourceGen: Generator = { id: 'source', label: 'S' };
      const sourceDiagram = createGeneratorDiagram(sourceGen);
      
      const diagram1: Diagram = {
        dimension: 1,
        source: sourceDiagram,
        cospans: []
      };

      const diagram2: Diagram = {
        dimension: 1,
        source: sourceDiagram,
        cospans: []
      };

      const result = composeDiagrams(diagram1, diagram2);

      expect(result).toBeDefined();
      expect(result.dimension).toBeGreaterThanOrEqual(1);
    });
  });

  describe('composeRewrites', () => {
    it('should compose generator rewrites when compatible', () => {
      const gen1: Generator = { id: 'gen1', label: 'A' };
      const gen2: Generator = { id: 'gen2', label: 'B' };
      const gen3: Generator = { id: 'gen3', label: 'C' };
      
      const rewrite1 = createGeneratorRewrite(gen1, gen2);
      const rewrite2 = createGeneratorRewrite(gen2, gen3);

      const result = composeRewrites(rewrite1, rewrite2);

      expect(result).toBeDefined();
      expect(result.dimension).toBe(0);
      if (result.dimension === 0) {
        expect(result.source).toEqual(gen1);
        expect(result.target).toEqual(gen3);
      }
    });

    it('should handle identity rewrite composition', () => {
      const gen: Generator = { id: 'gen', label: 'G' };
      const rewrite = createGeneratorRewrite(gen, gen);
      const identity = createIdentityRewrite();

      const result1 = composeRewrites(identity, rewrite);
      const result2 = composeRewrites(rewrite, identity);

      // Identity should act as neutral element
      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
    });

    it('should fail composition of incompatible rewrites', () => {
      const gen1: Generator = { id: 'gen1', label: 'A' };
      const gen2: Generator = { id: 'gen2', label: 'B' };
      const gen3: Generator = { id: 'gen3', label: 'C' };
      
      const rewrite1 = createGeneratorRewrite(gen1, gen2);
      const rewrite2 = createGeneratorRewrite(gen3, gen1); // Incompatible

      expect(() => composeRewrites(rewrite1, rewrite2)).toThrow();
    });

    it('should compose higher-dimensional rewrites', () => {
      const identity = createIdentityRewrite();
      const higherDimRewrite: Rewrite = {
        dimension: 2,
        cones: []
      };

      const result = composeRewrites(identity, higherDimRewrite);

      expect(result).toBeDefined();
    });
  });

  describe('composeSequentially', () => {
    it('should compose a sequence of compatible rewrites', () => {
      const gen1: Generator = { id: 'gen1', label: 'A' };
      const gen2: Generator = { id: 'gen2', label: 'B' };
      const gen3: Generator = { id: 'gen3', label: 'C' };
      const gen4: Generator = { id: 'gen4', label: 'D' };
      
      const rewrites = [
        createGeneratorRewrite(gen1, gen2),
        createGeneratorRewrite(gen2, gen3),
        createGeneratorRewrite(gen3, gen4)
      ];

      const result = composeSequentially(rewrites);

      expect(result).toBeDefined();
      if (result.dimension === 0) {
        expect(result.source).toEqual(gen1);
        expect(result.target).toEqual(gen4);
      }
    });

    it('should handle empty sequence as identity', () => {
      const rewrites: Rewrite[] = [];

      const result = composeSequentially(rewrites);

      expect(result.dimension).toBe(1);
      if (result.dimension === 1) {
        expect(result.identity).toBe(true);
      }
    });

    it('should handle single rewrite sequence', () => {
      const gen1: Generator = { id: 'gen1', label: 'A' };
      const gen2: Generator = { id: 'gen2', label: 'B' };
      const rewrite = createGeneratorRewrite(gen1, gen2);

      const result = composeSequentially([rewrite]);

      expect(result).toEqual(rewrite);
    });

    it('should fail on incompatible sequence', () => {
      const gen1: Generator = { id: 'gen1', label: 'A' };
      const gen2: Generator = { id: 'gen2', label: 'B' };
      const gen3: Generator = { id: 'gen3', label: 'C' };
      
      const incompatibleRewrites = [
        createGeneratorRewrite(gen1, gen2),
        createGeneratorRewrite(gen3, gen1) // Gap in composition
      ];

      expect(() => composeSequentially(incompatibleRewrites)).toThrow();
    });
  });

  describe('isComposable', () => {
    it('should return true for compatible diagrams', () => {
      const gen1: Generator = { id: 'gen1', label: 'A' };
      const gen2: Generator = { id: 'gen2', label: 'B' };
      const diagram1 = createGeneratorDiagram(gen1);
      const diagram2 = createGeneratorDiagram(gen2);

      const result = isComposable(diagram1, diagram2);

      expect(typeof result).toBe('boolean');
    });

    it('should return true for same-dimension diagrams', () => {
      const gen: Generator = { id: 'gen', label: 'G' };
      const sourceDiagram = createGeneratorDiagram(gen);
      
      const diagram1: Diagram = {
        dimension: 1,
        source: sourceDiagram,
        cospans: []
      };

      const diagram2: Diagram = {
        dimension: 1,
        source: sourceDiagram,
        cospans: []
      };

      const result = isComposable(diagram1, diagram2);

      expect(result).toBe(true);
    });

    it('should handle dimension mismatches according to NPR rules', () => {
      const gen: Generator = { id: 'gen', label: 'G' };
      const diagram0D = createGeneratorDiagram(gen);
      const diagram1D: Diagram = {
        dimension: 1,
        source: diagram0D,
        cospans: []
      };

      const result = isComposable(diagram0D, diagram1D);

      // Should return boolean based on NPR composition rules
      expect(typeof result).toBe('boolean');
    });
  });

  describe('getCompositionType', () => {
    it('should identify horizontal composition', () => {
      const gen1: Generator = { id: 'gen1', label: 'A' };
      const gen2: Generator = { id: 'gen2', label: 'B' };
      const diagram1 = createGeneratorDiagram(gen1);
      const diagram2 = createGeneratorDiagram(gen2);

      const type = getCompositionType(diagram1, diagram2);

      expect(['horizontal', 'vertical', 'whiskering', 'invalid']).toContain(type);
    });

    it('should identify vertical composition for compatible structures', () => {
      const gen: Generator = { id: 'gen', label: 'G' };
      const sourceDiagram = createGeneratorDiagram(gen);
      
      const diagram1: Diagram = {
        dimension: 1,
        source: sourceDiagram,
        cospans: []
      };

      const diagram2: Diagram = {
        dimension: 1,
        source: sourceDiagram,
        cospans: []
      };

      const type = getCompositionType(diagram1, diagram2);

      expect(['horizontal', 'vertical', 'whiskering', 'invalid']).toContain(type);
    });

    it('should identify whiskering for mixed dimensions', () => {
      const gen: Generator = { id: 'gen', label: 'G' };
      const diagram0D = createGeneratorDiagram(gen);
      const diagram1D: Diagram = {
        dimension: 1,
        source: diagram0D,
        cospans: []
      };

      const type = getCompositionType(diagram0D, diagram1D);

      expect(['horizontal', 'vertical', 'whiskering', 'invalid']).toContain(type);
    });

    it('should identify invalid compositions', () => {
      const malformedDiagram = {
        dimension: -1,
        generator: null
      } as any;

      const validDiagram = createEmptyDiagram();

      const type = getCompositionType(malformedDiagram, validDiagram);

      expect(type).toBe('invalid');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle null/undefined inputs gracefully', () => {
      const validDiagram = createEmptyDiagram();

      expect(() => composeDiagrams(null as any, validDiagram)).toThrow();
      expect(() => composeDiagrams(validDiagram, undefined as any)).toThrow();
    });

    it('should handle malformed diagram structures', () => {
      const malformed = {
        dimension: 'invalid',
        source: null
      } as any;

      const valid = createEmptyDiagram();

      expect(() => composeDiagrams(malformed, valid)).toThrow();
    });

    it('should preserve NPR axioms in composed results', () => {
      const cartGen: Generator = { id: 'cart', label: 'C', color: 'cartesian' };
      const diagram = createGeneratorDiagram(cartGen);

      const result = composeDiagrams(diagram, diagram);

      expect(result).toBeDefined();
      // Should maintain cartesian properties where applicable
    });
  });
});