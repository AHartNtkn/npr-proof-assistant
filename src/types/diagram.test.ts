import { describe, it, expect } from 'vitest';
import type { Generator, Diagram } from './diagram';
import { isValidGenerator, isValidDiagram, createEmptyDiagram, createGeneratorDiagram } from './diagram';

describe('Generator', () => {
  describe('type validation', () => {
    it('should accept minimal generator with just id', () => {
      const generator: Generator = { id: 'test' };
      expect(isValidGenerator(generator)).toBe(true);
    });

    it('should accept generator with id and label', () => {
      const generator: Generator = { id: 'test', label: 'Test Label' };
      expect(isValidGenerator(generator)).toBe(true);
    });

    it('should accept generator with cartesian color', () => {
      const generator: Generator = { 
        id: 'cart', 
        label: 'Cartesian',
        color: 'cartesian' 
      };
      expect(isValidGenerator(generator)).toBe(true);
    });

    it('should accept generator with cocartesian color', () => {
      const generator: Generator = { 
        id: 'cocart', 
        label: 'Cocartesian',
        color: 'cocartesian' 
      };
      expect(isValidGenerator(generator)).toBe(true);
    });

    it('should reject generator with invalid color', () => {
      const generator = { 
        id: 'invalid', 
        label: 'Invalid',
        color: 'invalid-color' 
      } as any;
      expect(isValidGenerator(generator)).toBe(false);
    });

    it('should reject generator without id', () => {
      const generator = { label: 'No ID' } as any;
      expect(isValidGenerator(generator)).toBe(false);
    });

    it('should reject generator with empty id', () => {
      const generator = { id: '', label: 'Empty ID' } as any;
      expect(isValidGenerator(generator)).toBe(false);
    });
  });

  describe('NPR-specific behavior', () => {
    it('should distinguish cartesian from cocartesian generators', () => {
      const cartesian: Generator = { id: 'c1', color: 'cartesian' };
      const cocartesian: Generator = { id: 'c2', color: 'cocartesian' };
      
      expect(cartesian.color).toBe('cartesian');
      expect(cocartesian.color).toBe('cocartesian');
      expect(cartesian.color).not.toBe(cocartesian.color);
    });

    it('should allow generators without color for uncolored nodes', () => {
      const uncolored: Generator = { id: 'uncolored' };
      expect(uncolored.color).toBeUndefined();
    });
  });
});

describe('Diagram', () => {
  describe('0-dimensional diagrams', () => {
    it('should create valid 0-dimensional diagram', () => {
      const generator: Generator = { id: 'test', label: 'Test' };
      const diagram = createGeneratorDiagram(generator);
      
      expect(diagram.dimension).toBe(0);
      expect(diagram.generator).toEqual(generator);
      expect(isValidDiagram(diagram)).toBe(true);
    });

    it('should validate 0-dimensional diagram structure', () => {
      const diagram = {
        dimension: 0,
        generator: { id: 'valid' }
      } as const;
      
      expect(isValidDiagram(diagram)).toBe(true);
    });

    it('should reject 0-dimensional diagram with invalid generator', () => {
      const diagram = {
        dimension: 0,
        generator: { id: '' }
      } as any;
      
      expect(isValidDiagram(diagram)).toBe(false);
    });
  });

  describe('n-dimensional diagrams', () => {
    it('should validate n-dimensional diagram structure', () => {
      const source = createGeneratorDiagram({ id: 'source' });
      const diagram = {
        dimension: 1,
        source: source,
        cospans: []
      } as const;
      
      expect(isValidDiagram(diagram)).toBe(true);
    });

    it('should require positive dimension for n-dimensional diagrams', () => {
      const source = createGeneratorDiagram({ id: 'source' });
      const diagram = {
        dimension: -1,
        source: source,
        cospans: []
      } as any;
      
      expect(isValidDiagram(diagram)).toBe(false);
    });

    it('should require valid source diagram', () => {
      const diagram = {
        dimension: 1,
        source: { dimension: 0, generator: { id: '' } },
        cospans: []
      } as any;
      
      expect(isValidDiagram(diagram)).toBe(false);
    });

    it('should require cospans array', () => {
      const source = createGeneratorDiagram({ id: 'source' });
      const diagram = {
        dimension: 1,
        source: source
      } as any;
      
      expect(isValidDiagram(diagram)).toBe(false);
    });
  });

  describe('diagram creation utilities', () => {
    it('should create empty diagram', () => {
      const empty = createEmptyDiagram();
      
      expect(empty.dimension).toBe(0);
      expect(empty.generator.id).toBe('empty');
      expect(empty.generator.label).toBe('ε');
      expect(isValidDiagram(empty)).toBe(true);
    });

    it('should create generator diagram from generator', () => {
      const generator: Generator = { 
        id: 'test', 
        label: 'Test', 
        color: 'cartesian' 
      };
      const diagram = createGeneratorDiagram(generator);
      
      expect(diagram.dimension).toBe(0);
      expect(diagram.generator).toEqual(generator);
      expect(isValidDiagram(diagram)).toBe(true);
    });
  });

  describe('recursive structure validation', () => {
    it('should validate deeply nested diagram structures', () => {
      const gen = { id: 'deep' };
      const level0 = createGeneratorDiagram(gen);
      const level1 = {
        dimension: 1,
        source: level0,
        cospans: []
      } as const;
      const level2 = {
        dimension: 2,
        source: level1,
        cospans: []
      } as const;
      
      expect(isValidDiagram(level2)).toBe(true);
    });

    it('should reject invalid nested structures', () => {
      const invalidNested = {
        dimension: 2,
        source: {
          dimension: 1,
          source: { dimension: 0, generator: { id: '' } }, // invalid generator
          cospans: []
        },
        cospans: []
      } as any;
      
      expect(isValidDiagram(invalidNested)).toBe(false);
    });
  });
});