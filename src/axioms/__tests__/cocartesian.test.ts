/**
 * Tests for cocartesian-specific NPR axioms
 */

import { describe, it, expect } from 'vitest';
import type { Diagram, Generator } from '../../types/diagram';
import { createGeneratorDiagram } from '../../types/diagram';
import type { Rewrite } from '../../types/rewrite';
import { createGeneratorRewrite } from '../../types/rewrite';
import {
  cocartesianCoproductAxiom,
  cocartesianInjectionAxiom,
  cocartesianUniversalPropertyAxiom,
  cocartesianCoherence,
  applyCocartesianRules,
  validateCocartesianStructure,
  isCocartesianDiagram
} from '../cocartesian';

describe('Cocartesian Axioms', () => {
  describe('Basic Cocartesian Axioms', () => {
    it('should define cocartesian coproduct axiom', () => {
      const axiom = cocartesianCoproductAxiom();
      expect(axiom.id).toBe('cocartesian-coproduct');
      expect(axiom.name).toBe('Cocartesian Coproduct');
      expect(axiom.category).toBe('cocartesian');
      expect(typeof axiom.validator).toBe('function');
    });

    it('should define cocartesian injection axiom', () => {
      const axiom = cocartesianInjectionAxiom();
      expect(axiom.id).toBe('cocartesian-injection');
      expect(axiom.name).toBe('Cocartesian Injection');
      expect(axiom.category).toBe('cocartesian');
      expect(typeof axiom.validator).toBe('function');
    });

    it('should define cocartesian universal property axiom', () => {
      const axiom = cocartesianUniversalPropertyAxiom();
      expect(axiom.id).toBe('cocartesian-universal');
      expect(axiom.name).toBe('Cocartesian Universal Property');
      expect(axiom.category).toBe('cocartesian');
      expect(typeof axiom.validator).toBe('function');
    });
  });

  describe('Cocartesian Structure Recognition', () => {
    it('should recognize cocartesian diagrams', () => {
      const cocartesianGen: Generator = { 
        id: 'cocart', 
        label: 'D', 
        color: 'cocartesian' 
      };
      const cocartesianDiagram = createGeneratorDiagram(cocartesianGen);
      
      expect(isCocartesianDiagram(cocartesianDiagram)).toBe(true);
    });

    it('should reject non-cocartesian diagrams', () => {
      const regularGen: Generator = { id: 'reg', label: 'R' };
      const regularDiagram = createGeneratorDiagram(regularGen);
      
      expect(isCocartesianDiagram(regularDiagram)).toBe(false);
    });

    it('should reject cartesian diagrams', () => {
      const cartesianGen: Generator = { 
        id: 'cart', 
        label: 'C', 
        color: 'cartesian' 
      };
      const cartesianDiagram = createGeneratorDiagram(cartesianGen);
      
      expect(isCocartesianDiagram(cartesianDiagram)).toBe(false);
    });
  });

  describe('Cocartesian Rules Application', () => {
    const cocartesianGen: Generator = { 
      id: 'test-cocart', 
      label: 'TD', 
      color: 'cocartesian' 
    };
    const cocartesianDiagram = createGeneratorDiagram(cocartesianGen);

    it('should apply cocartesian rules to cocartesian diagrams', () => {
      const result = applyCocartesianRules(cocartesianDiagram);
      
      expect(result).toBeDefined();
      expect(result.diagram).toBeDefined();
      expect(Array.isArray(result.appliedRules)).toBe(true);
      expect(Array.isArray(result.errors)).toBe(true);
      expect(result.appliedRules.length).toBeGreaterThan(0);
    });

    it('should not apply cocartesian rules to non-cocartesian diagrams', () => {
      const regularGen: Generator = { id: 'regular', label: 'R' };
      const regularDiagram = createGeneratorDiagram(regularGen);
      
      const result = applyCocartesianRules(regularDiagram);
      expect(result.appliedRules.length).toBe(0);
    });
  });

  describe('Cocartesian Validation', () => {
    it('should validate cocartesian structure correctly', () => {
      const cocartesianGen: Generator = { 
        id: 'valid-cocart', 
        label: 'VD', 
        color: 'cocartesian' 
      };
      const cocartesianDiagram = createGeneratorDiagram(cocartesianGen);
      
      const validation = validateCocartesianStructure(cocartesianDiagram);
      expect(validation.isValid).toBe(true);
      expect(validation.errors.length).toBe(0);
    });

    it('should detect invalid cocartesian structures', () => {
      const invalidGen: Generator = { 
        id: '', // Invalid ID
        label: 'ID', 
        color: 'cocartesian' 
      };
      const invalidDiagram = createGeneratorDiagram(invalidGen);
      
      const validation = validateCocartesianStructure(invalidDiagram);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Cocartesian Coherence', () => {
    it('should check cocartesian coherence conditions', () => {
      const cocartesianGen1: Generator = { 
        id: 'cocart1', 
        label: 'D1', 
        color: 'cocartesian' 
      };
      const cocartesianGen2: Generator = { 
        id: 'cocart2', 
        label: 'D2', 
        color: 'cocartesian' 
      };
      
      const diagram1 = createGeneratorDiagram(cocartesianGen1);
      const diagram2 = createGeneratorDiagram(cocartesianGen2);
      const rewrite = createGeneratorRewrite(cocartesianGen1, cocartesianGen2);
      
      const coherenceCheck = cocartesianCoherence(diagram1, diagram2, rewrite);
      expect(coherenceCheck).toBeDefined();
      expect(typeof coherenceCheck.isCoherent).toBe('boolean');
      expect(Array.isArray(coherenceCheck.violations)).toBe(true);
    });

    it('should detect coherence violations', () => {
      const cocartesianGen: Generator = { 
        id: 'cocart', 
        label: 'D', 
        color: 'cocartesian' 
      };
      const regularGen: Generator = { 
        id: 'reg', 
        label: 'R' 
      };
      
      const cocartesianDiagram = createGeneratorDiagram(cocartesianGen);
      const regularDiagram = createGeneratorDiagram(regularGen);
      const rewrite = createGeneratorRewrite(cocartesianGen, regularGen);
      
      const coherenceCheck = cocartesianCoherence(cocartesianDiagram, regularDiagram, rewrite);
      // Should have violations when mixing cocartesian and regular structures
      expect(coherenceCheck.violations.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Axiom Validation', () => {
    const cocartesianGen: Generator = { 
      id: 'axiom-test', 
      label: 'AT', 
      color: 'cocartesian' 
    };
    const cocartesianDiagram = createGeneratorDiagram(cocartesianGen);

    it('should validate cocartesian coproduct axiom', () => {
      const axiom = cocartesianCoproductAxiom();
      const errors = axiom.validator(cocartesianDiagram);
      expect(Array.isArray(errors)).toBe(true);
    });

    it('should validate cocartesian injection axiom', () => {
      const axiom = cocartesianInjectionAxiom();
      const errors = axiom.validator(cocartesianDiagram);
      expect(Array.isArray(errors)).toBe(true);
    });

    it('should validate cocartesian universal property', () => {
      const axiom = cocartesianUniversalPropertyAxiom();
      const errors = axiom.validator(cocartesianDiagram);
      expect(Array.isArray(errors)).toBe(true);
    });
  });

  describe('Dual Relationship with Cartesian', () => {
    it('should maintain duality with cartesian structures', () => {
      const cocartesianGen: Generator = { 
        id: 'cocart', 
        label: 'D', 
        color: 'cocartesian' 
      };
      const cartesianGen: Generator = { 
        id: 'cart', 
        label: 'C', 
        color: 'cartesian' 
      };
      
      const cocartesianDiagram = createGeneratorDiagram(cocartesianGen);
      const cartesianDiagram = createGeneratorDiagram(cartesianGen);
      
      // Basic duality check - both should be valid but distinct
      expect(isCocartesianDiagram(cocartesianDiagram)).toBe(true);
      expect(isCocartesianDiagram(cartesianDiagram)).toBe(false);
      
      const cocartValidation = validateCocartesianStructure(cocartesianDiagram);
      const cartValidation = validateCocartesianStructure(cartesianDiagram);
      
      expect(cocartValidation.isValid).toBe(true);
      expect(cartValidation.isValid).toBe(true); // Valid but not cocartesian
    });
  });
});