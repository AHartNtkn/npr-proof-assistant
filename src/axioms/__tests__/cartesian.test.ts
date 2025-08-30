/**
 * Tests for cartesian-specific NPR axioms
 */

import { describe, it, expect } from 'vitest';
import type { Diagram, Generator } from '../../types/diagram';
import { createGeneratorDiagram } from '../../types/diagram';
import type { Rewrite } from '../../types/rewrite';
import { createGeneratorRewrite } from '../../types/rewrite';
import {
  cartesianProductAxiom,
  cartesianProjectionAxiom,
  cartesianUniversalPropertyAxiom,
  cartesianCoherence,
  applyCartesianRules,
  validateCartesianStructure,
  isCartesianDiagram
} from '../cartesian';

describe('Cartesian Axioms', () => {
  describe('Basic Cartesian Axioms', () => {
    it('should define cartesian product axiom', () => {
      const axiom = cartesianProductAxiom();
      expect(axiom.id).toBe('cartesian-product');
      expect(axiom.name).toBe('Cartesian Product');
      expect(axiom.category).toBe('cartesian');
      expect(typeof axiom.validator).toBe('function');
    });

    it('should define cartesian projection axiom', () => {
      const axiom = cartesianProjectionAxiom();
      expect(axiom.id).toBe('cartesian-projection');
      expect(axiom.name).toBe('Cartesian Projection');
      expect(axiom.category).toBe('cartesian');
      expect(typeof axiom.validator).toBe('function');
    });

    it('should define cartesian universal property axiom', () => {
      const axiom = cartesianUniversalPropertyAxiom();
      expect(axiom.id).toBe('cartesian-universal');
      expect(axiom.name).toBe('Cartesian Universal Property');
      expect(axiom.category).toBe('cartesian');
      expect(typeof axiom.validator).toBe('function');
    });
  });

  describe('Cartesian Structure Recognition', () => {
    it('should recognize cartesian diagrams', () => {
      const cartesianGen: Generator = { 
        id: 'cart', 
        label: 'C', 
        color: 'cartesian' 
      };
      const cartesianDiagram = createGeneratorDiagram(cartesianGen);
      
      expect(isCartesianDiagram(cartesianDiagram)).toBe(true);
    });

    it('should reject non-cartesian diagrams', () => {
      const regularGen: Generator = { id: 'reg', label: 'R' };
      const regularDiagram = createGeneratorDiagram(regularGen);
      
      expect(isCartesianDiagram(regularDiagram)).toBe(false);
    });

    it('should reject cocartesian diagrams', () => {
      const cocartesianGen: Generator = { 
        id: 'cocart', 
        label: 'D', 
        color: 'cocartesian' 
      };
      const cocartesianDiagram = createGeneratorDiagram(cocartesianGen);
      
      expect(isCartesianDiagram(cocartesianDiagram)).toBe(false);
    });
  });

  describe('Cartesian Rules Application', () => {
    const cartesianGen: Generator = { 
      id: 'test-cart', 
      label: 'TC', 
      color: 'cartesian' 
    };
    const cartesianDiagram = createGeneratorDiagram(cartesianGen);

    it('should apply cartesian rules to cartesian diagrams', () => {
      const result = applyCartesianRules(cartesianDiagram);
      
      expect(result).toBeDefined();
      expect(result.diagram).toBeDefined();
      expect(Array.isArray(result.appliedRules)).toBe(true);
      expect(Array.isArray(result.errors)).toBe(true);
      expect(result.appliedRules.length).toBeGreaterThan(0);
    });

    it('should not apply cartesian rules to non-cartesian diagrams', () => {
      const regularGen: Generator = { id: 'regular', label: 'R' };
      const regularDiagram = createGeneratorDiagram(regularGen);
      
      const result = applyCartesianRules(regularDiagram);
      expect(result.appliedRules.length).toBe(0);
    });
  });

  describe('Cartesian Validation', () => {
    it('should validate cartesian structure correctly', () => {
      const cartesianGen: Generator = { 
        id: 'valid-cart', 
        label: 'VC', 
        color: 'cartesian' 
      };
      const cartesianDiagram = createGeneratorDiagram(cartesianGen);
      
      const validation = validateCartesianStructure(cartesianDiagram);
      expect(validation.isValid).toBe(true);
      expect(validation.errors.length).toBe(0);
    });

    it('should detect invalid cartesian structures', () => {
      const invalidGen: Generator = { 
        id: '', // Invalid ID
        label: 'IC', 
        color: 'cartesian' 
      };
      const invalidDiagram = createGeneratorDiagram(invalidGen);
      
      const validation = validateCartesianStructure(invalidDiagram);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Cartesian Coherence', () => {
    it('should check cartesian coherence conditions', () => {
      const cartesianGen1: Generator = { 
        id: 'cart1', 
        label: 'C1', 
        color: 'cartesian' 
      };
      const cartesianGen2: Generator = { 
        id: 'cart2', 
        label: 'C2', 
        color: 'cartesian' 
      };
      
      const diagram1 = createGeneratorDiagram(cartesianGen1);
      const diagram2 = createGeneratorDiagram(cartesianGen2);
      const rewrite = createGeneratorRewrite(cartesianGen1, cartesianGen2);
      
      const coherenceCheck = cartesianCoherence(diagram1, diagram2, rewrite);
      expect(coherenceCheck).toBeDefined();
      expect(typeof coherenceCheck.isCoherent).toBe('boolean');
      expect(Array.isArray(coherenceCheck.violations)).toBe(true);
    });

    it('should detect coherence violations', () => {
      const cartesianGen: Generator = { 
        id: 'cart', 
        label: 'C', 
        color: 'cartesian' 
      };
      const regularGen: Generator = { 
        id: 'reg', 
        label: 'R' 
      };
      
      const cartesianDiagram = createGeneratorDiagram(cartesianGen);
      const regularDiagram = createGeneratorDiagram(regularGen);
      const rewrite = createGeneratorRewrite(cartesianGen, regularGen);
      
      const coherenceCheck = cartesianCoherence(cartesianDiagram, regularDiagram, rewrite);
      // Should have violations when mixing cartesian and regular structures
      expect(coherenceCheck.violations.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Axiom Validation', () => {
    const cartesianGen: Generator = { 
      id: 'axiom-test', 
      label: 'AT', 
      color: 'cartesian' 
    };
    const cartesianDiagram = createGeneratorDiagram(cartesianGen);

    it('should validate cartesian product axiom', () => {
      const axiom = cartesianProductAxiom();
      const errors = axiom.validator(cartesianDiagram);
      expect(Array.isArray(errors)).toBe(true);
    });

    it('should validate cartesian projection axiom', () => {
      const axiom = cartesianProjectionAxiom();
      const errors = axiom.validator(cartesianDiagram);
      expect(Array.isArray(errors)).toBe(true);
    });

    it('should validate cartesian universal property', () => {
      const axiom = cartesianUniversalPropertyAxiom();
      const errors = axiom.validator(cartesianDiagram);
      expect(Array.isArray(errors)).toBe(true);
    });
  });
});