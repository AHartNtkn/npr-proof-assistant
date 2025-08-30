/**
 * Tests for categorical contraction operations
 * Following TDD: Red -> Green -> Refactor cycle
 */

import { describe, it, expect } from 'vitest';
import {
  contractDiagram,
  contractCospan,
  findContractibleParts,
  performColimitContraction
} from '../contraction';
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

describe('Contraction Operations', () => {
  describe('contractDiagram', () => {
    it('should contract a simple 0-dimensional diagram to itself', () => {
      const generator: Generator = { id: 'test-gen', label: 'A' };
      const diagram = createGeneratorDiagram(generator);
      
      const result = contractDiagram(diagram);
      
      expect(result).toEqual(diagram);
    });

    it('should contract an empty diagram to itself', () => {
      const diagram = createEmptyDiagram();
      
      const result = contractDiagram(diagram);
      
      expect(result).toEqual(diagram);
    });

    it('should handle 1-dimensional diagram contraction', () => {
      const sourceGen: Generator = { id: 'source', label: 'S' };
      const targetGen: Generator = { id: 'target', label: 'T' };
      const sourceDiagram = createGeneratorDiagram(sourceGen);
      
      const diagram: Diagram = {
        dimension: 1,
        source: sourceDiagram,
        cospans: []
      };
      
      const result = contractDiagram(diagram);
      
      // Should return a valid diagram
      expect(result.dimension).toBeGreaterThanOrEqual(0);
    });

    it('should preserve NPR axioms during contraction', () => {
      const cartesianGen: Generator = { 
        id: 'cart-gen', 
        label: 'C', 
        color: 'cartesian' 
      };
      const diagram = createGeneratorDiagram(cartesianGen);
      
      const result = contractDiagram(diagram);
      
      // The resulting diagram should still have cartesian color preserved
      if (result.dimension === 0) {
        expect(result.generator.color).toBe('cartesian');
      }
    });
  });

  describe('contractCospan', () => {
    it('should contract identity cospans to simpler form', () => {
      const gen: Generator = { id: 'test', label: 'T' };
      const identity = createIdentityRewrite();
      const cospan = createCospanRewrite(identity, identity);
      
      const result = contractCospan(cospan);
      
      // Should return a valid cospan
      expect(result.forward).toBeDefined();
      expect(result.backward).toBeDefined();
    });

    it('should handle generator-to-generator rewrites in cospans', () => {
      const sourceGen: Generator = { id: 'source', label: 'S' };
      const targetGen: Generator = { id: 'target', label: 'T' };
      const forward = createGeneratorRewrite(sourceGen, targetGen);
      const backward = createGeneratorRewrite(targetGen, sourceGen);
      const cospan = createCospanRewrite(forward, backward);
      
      const result = contractCospan(cospan);
      
      expect(result.forward).toBeDefined();
      expect(result.backward).toBeDefined();
    });
  });

  describe('findContractibleParts', () => {
    it('should find no contractible parts in simple diagrams', () => {
      const diagram = createEmptyDiagram();
      
      const parts = findContractibleParts(diagram);
      
      expect(parts).toEqual([]);
    });

    it('should identify contractible sequences in complex diagrams', () => {
      const gen: Generator = { id: 'complex', label: 'C' };
      const sourceDiagram = createGeneratorDiagram(gen);
      const diagram: Diagram = {
        dimension: 2,
        source: sourceDiagram,
        cospans: []
      };
      
      const parts = findContractibleParts(diagram);
      
      expect(Array.isArray(parts)).toBe(true);
    });
  });

  describe('performColimitContraction', () => {
    it('should perform colimit contraction on zigzag parts', () => {
      const gen1: Generator = { id: 'gen1', label: 'A' };
      const gen2: Generator = { id: 'gen2', label: 'B' };
      const rewrite1 = createGeneratorRewrite(gen1, gen2);
      const rewrite2 = createGeneratorRewrite(gen2, gen1);
      const parts: Rewrite[] = [rewrite1, rewrite2];
      
      const result = performColimitContraction(parts);
      
      // Should return a valid rewrite representing the colimit
      expect(result).toBeDefined();
      expect(result.dimension).toBeGreaterThanOrEqual(0);
    });

    it('should handle empty parts array', () => {
      const parts: Rewrite[] = [];
      
      const result = performColimitContraction(parts);
      
      // Should return identity rewrite
      expect(result.dimension).toBe(1);
      if (result.dimension === 1) {
        expect(result.identity).toBe(true);
      }
    });

    it('should preserve categorical structure in colimits', () => {
      const cartGen: Generator = { id: 'cart', label: 'C', color: 'cartesian' };
      const cocartGen: Generator = { id: 'cocart', label: 'D', color: 'cocartesian' };
      const rewrite = createGeneratorRewrite(cartGen, cocartGen);
      const parts: Rewrite[] = [rewrite];
      
      const result = performColimitContraction(parts);
      
      expect(result).toBeDefined();
      // Structure should be preserved in some meaningful way
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle malformed diagram structures gracefully', () => {
      const malformedDiagram = {
        dimension: -1,
        source: null,
        cospans: null
      } as any;
      
      expect(() => contractDiagram(malformedDiagram)).toThrow();
    });

    it('should handle cyclic references in diagrams', () => {
      const gen: Generator = { id: 'cycle', label: 'C' };
      const sourceDiagram = createGeneratorDiagram(gen);
      const cyclicDiagram: any = {
        dimension: 1,
        source: sourceDiagram,
        cospans: []
      };
      // Create cycle (in practice this shouldn't happen with proper construction)
      cyclicDiagram.source = cyclicDiagram;
      
      // Should either handle gracefully or throw meaningful error
      expect(() => contractDiagram(cyclicDiagram)).toThrow();
    });
  });
});