/**
 * Tests for axiom system exports and integration
 */

import { describe, it, expect } from 'vitest';
import type { Diagram, Generator } from '../../types/diagram';
import { createGeneratorDiagram } from '../../types/diagram';
import {
  createCompleteNPRSystem,
  validateWithCompleteSystem,
  getAllNPRAxioms,
  satisfiesAllNPRLaws,
  AxiomRegistry,
  ValidationReport
} from '../index';

describe('Axiom System Integration', () => {
  describe('Complete NPR System', () => {
    it('should create a complete NPR system', () => {
      const system = createCompleteNPRSystem();
      expect(system).toBeInstanceOf(AxiomRegistry);
      
      const axioms = system.getAllAxioms();
      expect(axioms.length).toBeGreaterThan(0);
      
      // Should have axioms from all categories
      const categories = new Set(axioms.map(a => a.category));
      expect(categories.has('structural')).toBe(true);
      expect(categories.has('cartesian')).toBe(true);
      expect(categories.has('cocartesian')).toBe(true);
    });

    it('should validate with complete system', () => {
      const generator: Generator = { id: 'test', label: 'T' };
      const diagram = createGeneratorDiagram(generator);
      
      const report = validateWithCompleteSystem(diagram);
      expect(report).toBeInstanceOf(ValidationReport);
      expect(report.diagram).toBe(diagram);
      expect(typeof report.isValid()).toBe('boolean');
    });

    it('should get all NPR axioms', () => {
      const axioms = getAllNPRAxioms();
      expect(Array.isArray(axioms)).toBe(true);
      expect(axioms.length).toBeGreaterThan(0);
      
      // Check that we have the expected core axioms
      const axiomIds = axioms.map(a => a.id);
      expect(axiomIds).toContain('npr-associativity');
      expect(axiomIds).toContain('npr-unit');
      expect(axiomIds).toContain('npr-inverse');
      expect(axiomIds).toContain('npr-symmetry');
    });

    it('should check NPR law satisfaction', () => {
      const generator: Generator = { id: 'valid', label: 'V' };
      const diagram = createGeneratorDiagram(generator);
      
      const satisfies = satisfiesAllNPRLaws(diagram);
      expect(typeof satisfies).toBe('boolean');
    });
  });

  describe('Integration with Colored Structures', () => {
    it('should handle cartesian structures correctly', () => {
      const cartesianGen: Generator = { 
        id: 'cart', 
        label: 'C', 
        color: 'cartesian' 
      };
      const diagram = createGeneratorDiagram(cartesianGen);
      
      const report = validateWithCompleteSystem(diagram);
      expect(report.isValid()).toBe(true);
      
      // Should have validated cartesian axioms
      const validatedAxioms = report.getValidatedAxioms();
      expect(validatedAxioms).toContain('cartesian-product');
      expect(validatedAxioms).toContain('cartesian-projection');
      expect(validatedAxioms).toContain('cartesian-universal');
    });

    it('should handle cocartesian structures correctly', () => {
      const cocartesianGen: Generator = { 
        id: 'cocart', 
        label: 'D', 
        color: 'cocartesian' 
      };
      const diagram = createGeneratorDiagram(cocartesianGen);
      
      const report = validateWithCompleteSystem(diagram);
      expect(report.isValid()).toBe(true);
      
      // Should have validated cocartesian axioms
      const validatedAxioms = report.getValidatedAxioms();
      expect(validatedAxioms).toContain('cocartesian-coproduct');
      expect(validatedAxioms).toContain('cocartesian-injection');
      expect(validatedAxioms).toContain('cocartesian-universal');
    });
  });

  describe('Invalid Structure Handling', () => {
    it('should detect invalid diagrams', () => {
      const invalidDiagram = { 
        dimension: 0, 
        generator: { id: '' } // Invalid empty ID
      } as Diagram;
      
      const satisfies = satisfiesAllNPRLaws(invalidDiagram);
      expect(satisfies).toBe(false);
      
      const report = validateWithCompleteSystem(invalidDiagram);
      expect(report.isValid()).toBe(false);
      expect(report.getAllErrors().length).toBeGreaterThan(0);
    });
  });
});