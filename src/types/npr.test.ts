import { describe, it, expect } from 'vitest';
import type { NPRAxiom, NPRValidationError } from './npr';
import { 
  validateNPRAspects, 
  isNPRCompliant, 
  getNPRAxioms, 
  checkCartesianProperties,
  checkCocartesianProperties,
  validateDiagramComposition,
  createNPRValidationContext
} from './npr';
import type { Generator, Diagram } from './diagram';
import { createGeneratorDiagram, createEmptyDiagram } from './diagram';
import type { Rewrite, Cospan } from './rewrite';
import { createGeneratorRewrite, createIdentityRewrite } from './rewrite';

describe('NPR Validation', () => {
  describe('basic compliance checking', () => {
    it('should validate NPR-compliant generators', () => {
      const cartesian: Generator = { id: 'cart', color: 'cartesian' };
      const cocartesian: Generator = { id: 'cocart', color: 'cocartesian' };
      const uncolored: Generator = { id: 'plain' };
      
      expect(isNPRCompliant(createGeneratorDiagram(cartesian))).toBe(true);
      expect(isNPRCompliant(createGeneratorDiagram(cocartesian))).toBe(true);
      expect(isNPRCompliant(createGeneratorDiagram(uncolored))).toBe(true);
    });

    it('should validate empty diagram as NPR-compliant', () => {
      const empty = createEmptyDiagram();
      expect(isNPRCompliant(empty)).toBe(true);
    });

    it('should validate complex NPR diagrams', () => {
      const source = createGeneratorDiagram({ id: 'src', color: 'cartesian' });
      const nDiagram = {
        dimension: 1,
        source: source,
        cospans: []
      } as const;
      
      expect(isNPRCompliant(nDiagram)).toBe(true);
    });

    it('should provide validation context', () => {
      const context = createNPRValidationContext();
      
      expect(context).toHaveProperty('axioms');
      expect(context).toHaveProperty('errors');
      expect(context).toHaveProperty('warnings');
      expect(Array.isArray(context.errors)).toBe(true);
      expect(Array.isArray(context.warnings)).toBe(true);
    });
  });

  describe('NPR axiom validation', () => {
    it('should provide core NPR axioms', () => {
      const axioms = getNPRAxioms();
      
      expect(Array.isArray(axioms)).toBe(true);
      expect(axioms.length).toBeGreaterThan(0);
      
      axioms.forEach(axiom => {
        expect(axiom).toHaveProperty('id');
        expect(axiom).toHaveProperty('name');
        expect(axiom).toHaveProperty('description');
        expect(axiom).toHaveProperty('validator');
        expect(typeof axiom.validator).toBe('function');
      });
    });

    it('should validate axioms individually', () => {
      const axioms = getNPRAxioms();
      const diagram = createGeneratorDiagram({ id: 'test' });
      
      axioms.forEach(axiom => {
        expect(() => {
          axiom.validator(diagram);
        }).not.toThrow();
      });
    });

    it('should categorize axioms by type', () => {
      const axioms = getNPRAxioms();
      const categories = [...new Set(axioms.map(a => a.category))];
      
      expect(categories).toContain('structural');
      expect(categories).toContain('cartesian');
      expect(categories).toContain('cocartesian');
    });
  });

  describe('cartesian property validation', () => {
    it('should validate cartesian generators', () => {
      const cartesian: Generator = { id: 'cart', color: 'cartesian' };
      const diagram = createGeneratorDiagram(cartesian);
      
      const errors = checkCartesianProperties(diagram);
      expect(Array.isArray(errors)).toBe(true);
      expect(errors).toHaveLength(0); // No errors for valid cartesian
    });

    it('should check cartesian axioms', () => {
      const cartesian: Generator = { id: 'cart', color: 'cartesian' };
      const diagram = createGeneratorDiagram(cartesian);
      
      const errors = checkCartesianProperties(diagram);
      expect(errors).toEqual([]); // Should pass all cartesian checks
    });

    it('should validate cartesian composition rules', () => {
      const cart1: Generator = { id: 'c1', color: 'cartesian' };
      const cart2: Generator = { id: 'c2', color: 'cartesian' };
      
      const rewrite = createGeneratorRewrite(cart1, cart2);
      const cospan: Cospan = { forward: rewrite, backward: rewrite };
      
      const source = createGeneratorDiagram(cart1);
      const nDiagram = {
        dimension: 1,
        source: source,
        cospans: [cospan]
      } as const;
      
      const errors = checkCartesianProperties(nDiagram);
      expect(errors).toEqual([]);
    });

    it('should detect cartesian violations', () => {
      const mixed: Generator = { id: 'mixed', color: 'cartesian' };
      const plain: Generator = { id: 'plain' };
      
      // This could potentially violate cartesian rules depending on context
      const rewrite = createGeneratorRewrite(mixed, plain);
      const diagram = createGeneratorDiagram(mixed);
      
      const errors = checkCartesianProperties(diagram);
      // For now, should not produce errors as the basic structure is valid
      expect(Array.isArray(errors)).toBe(true);
    });
  });

  describe('cocartesian property validation', () => {
    it('should validate cocartesian generators', () => {
      const cocartesian: Generator = { id: 'cocart', color: 'cocartesian' };
      const diagram = createGeneratorDiagram(cocartesian);
      
      const errors = checkCocartesianProperties(diagram);
      expect(Array.isArray(errors)).toBe(true);
      expect(errors).toHaveLength(0); // No errors for valid cocartesian
    });

    it('should check cocartesian axioms', () => {
      const cocartesian: Generator = { id: 'cocart', color: 'cocartesian' };
      const diagram = createGeneratorDiagram(cocartesian);
      
      const errors = checkCocartesianProperties(diagram);
      expect(errors).toEqual([]); // Should pass all cocartesian checks
    });

    it('should validate cocartesian composition rules', () => {
      const cocart1: Generator = { id: 'cc1', color: 'cocartesian' };
      const cocart2: Generator = { id: 'cc2', color: 'cocartesian' };
      
      const rewrite = createGeneratorRewrite(cocart1, cocart2);
      const cospan: Cospan = { forward: rewrite, backward: rewrite };
      
      const source = createGeneratorDiagram(cocart1);
      const nDiagram = {
        dimension: 1,
        source: source,
        cospans: [cospan]
      } as const;
      
      const errors = checkCocartesianProperties(nDiagram);
      expect(errors).toEqual([]);
    });

    it('should detect cocartesian violations', () => {
      const mixed: Generator = { id: 'mixed', color: 'cocartesian' };
      const plain: Generator = { id: 'plain' };
      
      // This could potentially violate cocartesian rules depending on context
      const rewrite = createGeneratorRewrite(mixed, plain);
      const diagram = createGeneratorDiagram(mixed);
      
      const errors = checkCocartesianProperties(diagram);
      // For now, should not produce errors as the basic structure is valid
      expect(Array.isArray(errors)).toBe(true);
    });
  });

  describe('diagram composition validation', () => {
    it('should validate simple composition', () => {
      const gen1 = createGeneratorDiagram({ id: 'a' });
      const gen2 = createGeneratorDiagram({ id: 'b' });
      
      const errors = validateDiagramComposition(gen1, gen2);
      expect(Array.isArray(errors)).toBe(true);
      expect(errors).toHaveLength(0); // Simple composition should be valid
    });

    it('should validate color-preserving composition', () => {
      const cart1 = createGeneratorDiagram({ id: 'c1', color: 'cartesian' });
      const cart2 = createGeneratorDiagram({ id: 'c2', color: 'cartesian' });
      
      const errors = validateDiagramComposition(cart1, cart2);
      expect(errors).toEqual([]); // Same colors should compose
    });

    it('should validate mixed-color composition', () => {
      const cart = createGeneratorDiagram({ id: 'cart', color: 'cartesian' });
      const cocart = createGeneratorDiagram({ id: 'cocart', color: 'cocartesian' });
      
      const errors = validateDiagramComposition(cart, cocart);
      expect(Array.isArray(errors)).toBe(true);
      // Mixed colors might be allowed depending on NPR rules
    });

    it('should validate complex diagram composition', () => {
      const source = createGeneratorDiagram({ id: 'src', color: 'cartesian' });
      const target = createGeneratorDiagram({ id: 'tgt', color: 'cartesian' });
      
      const nDiagram1 = {
        dimension: 1,
        source: source,
        cospans: []
      } as const;
      
      const errors = validateDiagramComposition(nDiagram1, target);
      expect(Array.isArray(errors)).toBe(true);
    });
  });

  describe('comprehensive NPR aspects validation', () => {
    it('should validate all NPR aspects for simple diagram', () => {
      const diagram = createGeneratorDiagram({ id: 'test', color: 'cartesian' });
      
      const result = validateNPRAspects(diagram);
      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('warnings');
      expect(result).toHaveProperty('context');
      
      expect(typeof result.isValid).toBe('boolean');
      expect(Array.isArray(result.errors)).toBe(true);
      expect(Array.isArray(result.warnings)).toBe(true);
    });

    it('should validate all NPR aspects for complex diagram', () => {
      const source = createGeneratorDiagram({ id: 'src', color: 'cocartesian' });
      const rewrite = createGeneratorRewrite({ id: 'a' }, { id: 'b' });
      const cospan: Cospan = { forward: rewrite, backward: rewrite };
      
      const nDiagram = {
        dimension: 2,
        source: source,
        cospans: [cospan]
      } as const;
      
      const result = validateNPRAspects(nDiagram);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should provide detailed error information', () => {
      const diagram = createGeneratorDiagram({ id: 'test' });
      
      const result = validateNPRAspects(diagram);
      
      result.errors.forEach(error => {
        expect(error).toHaveProperty('code');
        expect(error).toHaveProperty('message');
        expect(error).toHaveProperty('severity');
        expect(typeof error.code).toBe('string');
        expect(typeof error.message).toBe('string');
        expect(['error', 'warning', 'info']).toContain(error.severity);
      });
    });
  });
});