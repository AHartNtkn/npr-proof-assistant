/**
 * Tests for NPR core axioms and rules
 */

import { describe, it, expect } from 'vitest';
import type { Diagram, Generator } from '../../types/diagram';
import { createGeneratorDiagram } from '../../types/diagram';
import type { Rewrite } from '../../types/rewrite';
import { 
  nprAssociativityAxiom,
  nprUnitAxiom,
  nprInverseAxiom,
  nprSymmetryAxiom,
  applyCoreNPRRules,
  isNPRAxiomApplicable,
  validateNPRRuleApplication
} from '../npr-rules';

describe('NPR Core Rules', () => {
  describe('Basic Axioms', () => {
    it('should define associativity axiom', () => {
      const axiom = nprAssociativityAxiom();
      expect(axiom.id).toBe('npr-associativity');
      expect(axiom.name).toBe('NPR Associativity');
      expect(axiom.category).toBe('structural');
      expect(typeof axiom.validator).toBe('function');
    });

    it('should define unit axiom', () => {
      const axiom = nprUnitAxiom();
      expect(axiom.id).toBe('npr-unit');
      expect(axiom.name).toBe('NPR Unit');
      expect(axiom.category).toBe('structural');
      expect(typeof axiom.validator).toBe('function');
    });

    it('should define inverse axiom', () => {
      const axiom = nprInverseAxiom();
      expect(axiom.id).toBe('npr-inverse');
      expect(axiom.name).toBe('NPR Inverse');
      expect(axiom.category).toBe('structural');
      expect(typeof axiom.validator).toBe('function');
    });

    it('should define symmetry axiom', () => {
      const axiom = nprSymmetryAxiom();
      expect(axiom.id).toBe('npr-symmetry');
      expect(axiom.name).toBe('NPR Symmetry');
      expect(axiom.category).toBe('structural');
      expect(typeof axiom.validator).toBe('function');
    });
  });

  describe('Axiom Application', () => {
    const simpleGenerator: Generator = { id: 'test', label: 'T' };
    const simpleDiagram = createGeneratorDiagram(simpleGenerator);

    it('should validate axiom applicability', () => {
      const axiom = nprAssociativityAxiom();
      const isApplicable = isNPRAxiomApplicable(axiom, simpleDiagram);
      expect(typeof isApplicable).toBe('boolean');
    });

    it('should apply core NPR rules to a diagram', () => {
      const result = applyCoreNPRRules(simpleDiagram);
      expect(result).toBeDefined();
      expect(result.diagram).toBeDefined();
      expect(Array.isArray(result.appliedRules)).toBe(true);
      expect(Array.isArray(result.errors)).toBe(true);
    });

    it('should validate NPR rule application', () => {
      const axiom = nprUnitAxiom();
      const rewrite: Rewrite = {
        dimension: 0,
        source: simpleGenerator,
        target: simpleGenerator
      };
      
      const validation = validateNPRRuleApplication(axiom, simpleDiagram, rewrite);
      expect(validation).toBeDefined();
      expect(typeof validation.isValid).toBe('boolean');
      expect(Array.isArray(validation.errors)).toBe(true);
    });
  });

  describe('Structural Validation', () => {
    it('should validate associativity constraint', () => {
      const axiom = nprAssociativityAxiom();
      const generator: Generator = { id: 'assoc-test', label: 'A' };
      const diagram = createGeneratorDiagram(generator);
      
      const errors = axiom.validator(diagram);
      expect(Array.isArray(errors)).toBe(true);
    });

    it('should validate unit constraint', () => {
      const axiom = nprUnitAxiom();
      const generator: Generator = { id: 'unit-test', label: 'U' };
      const diagram = createGeneratorDiagram(generator);
      
      const errors = axiom.validator(diagram);
      expect(Array.isArray(errors)).toBe(true);
    });

    it('should detect invalid structures', () => {
      const axiom = nprInverseAxiom();
      const invalidDiagram = { dimension: 0, generator: { id: '' } } as Diagram;
      
      const errors = axiom.validator(invalidDiagram);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].severity).toBe('error');
    });
  });
});