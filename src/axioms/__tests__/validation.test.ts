/**
 * Tests for NPR axiom validation framework
 */

import { describe, it, expect } from 'vitest';
import type { Diagram, Generator } from '../../types/diagram';
import { createGeneratorDiagram } from '../../types/diagram';
import type { Rewrite } from '../../types/rewrite';
import { createGeneratorRewrite } from '../../types/rewrite';
import type { NPRAxiom } from '../../types/npr';
import {
  validateAllAxioms,
  validateAxiomCompatibility,
  createAxiomValidator,
  AxiomRegistry,
  ValidationReport,
  getRuleConflicts,
  isAxiomSetComplete,
  optimizeValidationOrder
} from '../validation';

describe('Validation Framework', () => {
  describe('Axiom Registry', () => {
    it('should create an empty registry', () => {
      const registry = new AxiomRegistry();
      expect(registry.getAllAxioms()).toHaveLength(0);
    });

    it('should register axioms', () => {
      const registry = new AxiomRegistry();
      const axiom: NPRAxiom = {
        id: 'test-axiom',
        name: 'Test Axiom',
        description: 'Test axiom for validation',
        category: 'structural',
        validator: () => []
      };
      
      registry.register(axiom);
      expect(registry.getAllAxioms()).toHaveLength(1);
      expect(registry.getAxiom('test-axiom')).toBe(axiom);
    });

    it('should prevent duplicate registration', () => {
      const registry = new AxiomRegistry();
      const axiom: NPRAxiom = {
        id: 'duplicate-test',
        name: 'Duplicate Test',
        description: 'Test for duplicate prevention',
        category: 'structural',
        validator: () => []
      };
      
      registry.register(axiom);
      expect(() => registry.register(axiom)).toThrow('Axiom duplicate-test is already registered');
    });

    it('should get axioms by category', () => {
      const registry = new AxiomRegistry();
      const structuralAxiom: NPRAxiom = {
        id: 'struct',
        name: 'Structural',
        description: 'Structural axiom',
        category: 'structural',
        validator: () => []
      };
      const cartesianAxiom: NPRAxiom = {
        id: 'cart',
        name: 'Cartesian',
        description: 'Cartesian axiom',
        category: 'cartesian',
        validator: () => []
      };
      
      registry.register(structuralAxiom);
      registry.register(cartesianAxiom);
      
      const structuralAxioms = registry.getAxiomsByCategory('structural');
      const cartesianAxioms = registry.getAxiomsByCategory('cartesian');
      
      expect(structuralAxioms).toHaveLength(1);
      expect(cartesianAxioms).toHaveLength(1);
      expect(structuralAxioms[0].id).toBe('struct');
      expect(cartesianAxioms[0].id).toBe('cart');
    });
  });

  describe('Validation Report', () => {
    it('should create validation reports', () => {
      const generator: Generator = { id: 'test', label: 'T' };
      const diagram = createGeneratorDiagram(generator);
      
      const report = new ValidationReport(diagram);
      expect(report.diagram).toBe(diagram);
      expect(report.getAllErrors()).toHaveLength(0);
      expect(report.getAllWarnings()).toHaveLength(0);
      expect(report.isValid()).toBe(true);
    });

    it('should track axiom results', () => {
      const generator: Generator = { id: 'test', label: 'T' };
      const diagram = createGeneratorDiagram(generator);
      const report = new ValidationReport(diagram);
      
      report.addAxiomResult('test-axiom', [], []);
      expect(report.getAxiomResult('test-axiom')).toBeDefined();
      expect(report.getValidatedAxioms()).toContain('test-axiom');
    });

    it('should aggregate errors and warnings', () => {
      const generator: Generator = { id: 'test', label: 'T' };
      const diagram = createGeneratorDiagram(generator);
      const report = new ValidationReport(diagram);
      
      report.addAxiomResult('axiom1', [
        { code: 'ERROR1', message: 'Error 1', severity: 'error' }
      ], []);
      
      report.addAxiomResult('axiom2', [], [
        { code: 'WARN1', message: 'Warning 1', severity: 'warning' }
      ]);
      
      expect(report.getAllErrors()).toHaveLength(1);
      expect(report.getAllWarnings()).toHaveLength(1);
      expect(report.isValid()).toBe(false);
    });
  });

  describe('Axiom Validation', () => {
    const generator: Generator = { id: 'valid-gen', label: 'V' };
    const diagram = createGeneratorDiagram(generator);

    it('should validate all axioms against a diagram', () => {
      const result = validateAllAxioms(diagram);
      expect(result).toBeDefined();
      expect(result.diagram).toBe(diagram);
      expect(Array.isArray(result.getAllErrors())).toBe(true);
      expect(Array.isArray(result.getAllWarnings())).toBe(true);
      expect(typeof result.isValid()).toBe('boolean');
    });

    it('should handle invalid diagrams', () => {
      const invalidDiagram = { dimension: 0, generator: { id: '' } } as Diagram;
      const result = validateAllAxioms(invalidDiagram);
      
      expect(result.isValid()).toBe(false);
      expect(result.getAllErrors().length).toBeGreaterThan(0);
    });
  });

  describe('Axiom Compatibility', () => {
    it('should check axiom compatibility', () => {
      const axiom1: NPRAxiom = {
        id: 'compat1',
        name: 'Compatible 1',
        description: 'First compatible axiom',
        category: 'structural',
        validator: () => []
      };
      
      const axiom2: NPRAxiom = {
        id: 'compat2',
        name: 'Compatible 2',
        description: 'Second compatible axiom',
        category: 'structural',
        validator: () => []
      };
      
      const generator: Generator = { id: 'test', label: 'T' };
      const diagram = createGeneratorDiagram(generator);
      
      const result = validateAxiomCompatibility([axiom1, axiom2], diagram);
      expect(result).toBeDefined();
      expect(typeof result.isCompatible).toBe('boolean');
      expect(Array.isArray(result.conflicts)).toBe(true);
    });
  });

  describe('Axiom Validator Creation', () => {
    it('should create validators from axioms', () => {
      const axiom: NPRAxiom = {
        id: 'validator-test',
        name: 'Validator Test',
        description: 'Test for validator creation',
        category: 'structural',
        validator: (diagram) => {
          if (!diagram) return [{ code: 'NULL_DIAGRAM', message: 'Diagram is null', severity: 'error' }];
          return [];
        }
      };
      
      const validator = createAxiomValidator(axiom);
      expect(typeof validator).toBe('function');
      
      const generator: Generator = { id: 'test', label: 'T' };
      const diagram = createGeneratorDiagram(generator);
      
      const result = validator(diagram);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('Rule Conflict Detection', () => {
    it('should detect rule conflicts', () => {
      const axiom1: NPRAxiom = {
        id: 'conflict1',
        name: 'Conflicting 1',
        description: 'First conflicting axiom',
        category: 'structural',
        validator: () => []
      };
      
      const axiom2: NPRAxiom = {
        id: 'conflict2',
        name: 'Conflicting 2',
        description: 'Second conflicting axiom',
        category: 'structural',
        validator: () => []
      };
      
      const generator: Generator = { id: 'test', label: 'T' };
      const diagram = createGeneratorDiagram(generator);
      
      const conflicts = getRuleConflicts([axiom1, axiom2], diagram);
      expect(Array.isArray(conflicts)).toBe(true);
    });
  });

  describe('Axiom Set Completeness', () => {
    it('should check if axiom set is complete', () => {
      const axioms: NPRAxiom[] = [
        {
          id: 'complete1',
          name: 'Complete 1',
          description: 'First complete axiom',
          category: 'structural',
          validator: () => []
        }
      ];
      
      const isComplete = isAxiomSetComplete(axioms);
      expect(typeof isComplete).toBe('boolean');
    });
  });

  describe('Validation Optimization', () => {
    it('should optimize validation order', () => {
      const axioms: NPRAxiom[] = [
        {
          id: 'opt1',
          name: 'Optimize 1',
          description: 'First optimization axiom',
          category: 'structural',
          validator: () => []
        },
        {
          id: 'opt2',
          name: 'Optimize 2',
          description: 'Second optimization axiom',
          category: 'cartesian',
          validator: () => []
        }
      ];
      
      const generator: Generator = { id: 'test', label: 'T' };
      const diagram = createGeneratorDiagram(generator);
      
      const optimized = optimizeValidationOrder(axioms, diagram);
      expect(Array.isArray(optimized)).toBe(true);
      expect(optimized.length).toBe(axioms.length);
    });
  });
});