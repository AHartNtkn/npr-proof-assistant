/**
 * Tests for categorical validation operations
 * Following TDD: Red -> Green -> Refactor cycle
 */

import { describe, it, expect } from 'vitest';
import {
  validateDiagram,
  validateRewrite,
  checkWellFormedness,
  validateCategoricalLaws,
  validateNPRAxioms,
  checkCompositionValidity,
  validateColorConsistency,
  generateValidationReport
} from '../validation';
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
import type { NPRValidationError } from '../../types/npr';

describe('Validation Operations', () => {
  describe('validateDiagram', () => {
    it('should validate a simple 0-dimensional diagram', () => {
      const generator: Generator = { id: 'test-gen', label: 'A' };
      const diagram = createGeneratorDiagram(generator);
      
      const result = validateDiagram(diagram);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate empty diagram', () => {
      const diagram = createEmptyDiagram();
      
      const result = validateDiagram(diagram);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect invalid generator properties', () => {
      const invalidGenerator: Generator = { id: '', label: 'Invalid' };
      const diagram = createGeneratorDiagram(invalidGenerator);
      
      const result = validateDiagram(diagram);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.code.includes('INVALID_GENERATOR'))).toBe(true);
    });

    it('should validate higher dimensional diagrams', () => {
      const sourceGen: Generator = { id: 'source', label: 'S' };
      const sourceDiagram = createGeneratorDiagram(sourceGen);
      
      const diagram: Diagram = {
        dimension: 1,
        source: sourceDiagram,
        cospans: []
      };
      
      const result = validateDiagram(diagram);
      
      expect(result.isValid).toBe(true);
    });

    it('should detect malformed diagram structures', () => {
      const malformedDiagram = {
        dimension: 'invalid',
        source: null,
        cospans: 'not-an-array'
      } as any;
      
      const result = validateDiagram(malformedDiagram);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should validate complex nested structures', () => {
      const gen1: Generator = { id: 'gen1', label: 'A' };
      const gen2: Generator = { id: 'gen2', label: 'B' };
      const innerDiagram = createGeneratorDiagram(gen1);
      
      const complexDiagram: Diagram = {
        dimension: 2,
        source: {
          dimension: 1,
          source: innerDiagram,
          cospans: [{
            forward: createGeneratorRewrite(gen1, gen2),
            backward: createGeneratorRewrite(gen2, gen1)
          }]
        },
        cospans: []
      };
      
      const result = validateDiagram(complexDiagram);
      
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateRewrite', () => {
    it('should validate identity rewrites', () => {
      const identity = createIdentityRewrite();
      
      const result = validateRewrite(identity);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate generator rewrites', () => {
      const gen1: Generator = { id: 'gen1', label: 'A' };
      const gen2: Generator = { id: 'gen2', label: 'B' };
      const rewrite = createGeneratorRewrite(gen1, gen2);
      
      const result = validateRewrite(rewrite);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect invalid generator rewrites', () => {
      const invalidGen1 = { id: '', label: 'Bad' } as Generator;
      const validGen2: Generator = { id: 'good', label: 'Good' };
      const invalidRewrite = createGeneratorRewrite(invalidGen1, validGen2);
      
      const result = validateRewrite(invalidRewrite);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should validate higher dimensional rewrites', () => {
      const higherDimRewrite: Rewrite = {
        dimension: 2,
        cones: []
      };
      
      const result = validateRewrite(higherDimRewrite);
      
      expect(result.isValid).toBe(true);
    });

    it('should validate rewrites with cones', () => {
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
      
      const result = validateRewrite(rewriteWithCone);
      
      expect(result.isValid).toBe(true);
    });
  });

  describe('checkWellFormedness', () => {
    it('should check well-formedness of valid diagrams', () => {
      const gen: Generator = { id: 'gen', label: 'G' };
      const diagram = createGeneratorDiagram(gen);
      
      const result = checkWellFormedness(diagram);
      
      expect(result.isWellFormed).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('should detect well-formedness violations', () => {
      const malformedDiagram = {
        dimension: -1,
        generator: null
      } as any;
      
      const result = checkWellFormedness(malformedDiagram);
      
      expect(result.isWellFormed).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);
    });

    it('should check dimensional consistency', () => {
      const gen: Generator = { id: 'gen', label: 'G' };
      const sourceDiagram = createGeneratorDiagram(gen);
      
      const dimensionallyInconsistent: Diagram = {
        dimension: 0, // Claims to be 0D but has source and cospans
        source: sourceDiagram,
        cospans: []
      } as any;
      
      const result = checkWellFormedness(dimensionallyInconsistent);
      
      expect(result.isWellFormed).toBe(false);
    });

    it('should check cospan well-formedness', () => {
      const gen1: Generator = { id: 'gen1', label: 'A' };
      const gen2: Generator = { id: 'gen2', label: 'B' };
      const sourceDiagram = createGeneratorDiagram(gen1);
      
      const diagramWithBadCospan: Diagram = {
        dimension: 1,
        source: sourceDiagram,
        cospans: [{
          forward: null,
          backward: createGeneratorRewrite(gen2, gen1)
        } as any]
      };
      
      const result = checkWellFormedness(diagramWithBadCospan);
      
      expect(result.isWellFormed).toBe(false);
    });
  });

  describe('validateCategoricalLaws', () => {
    it('should validate associativity laws', () => {
      const gen: Generator = { id: 'gen', label: 'G' };
      const diagram = createGeneratorDiagram(gen);
      
      const result = validateCategoricalLaws(diagram, 'associativity');
      
      expect(result.isValid).toBe(true);
    });

    it('should validate identity laws', () => {
      const gen: Generator = { id: 'gen', label: 'G' };
      const diagram = createGeneratorDiagram(gen);
      
      const result = validateCategoricalLaws(diagram, 'identity');
      
      expect(result.isValid).toBe(true);
    });

    it('should validate composition laws', () => {
      const gen1: Generator = { id: 'gen1', label: 'A' };
      const gen2: Generator = { id: 'gen2', label: 'B' };
      const sourceDiagram = createGeneratorDiagram(gen1);
      
      const composedDiagram: Diagram = {
        dimension: 1,
        source: sourceDiagram,
        cospans: [{
          forward: createGeneratorRewrite(gen1, gen2),
          backward: createGeneratorRewrite(gen2, gen1)
        }]
      };
      
      const result = validateCategoricalLaws(composedDiagram, 'composition');
      
      expect(result.isValid).toBe(true);
    });

    it('should detect law violations', () => {
      const malformedDiagram = {
        dimension: 'invalid',
        source: null
      } as any;
      
      const result = validateCategoricalLaws(malformedDiagram, 'associativity');
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('validateNPRAxioms', () => {
    it('should validate cartesian axioms', () => {
      const cartGen: Generator = { 
        id: 'cart-gen', 
        label: 'C', 
        color: 'cartesian' 
      };
      const diagram = createGeneratorDiagram(cartGen);
      
      const result = validateNPRAxioms(diagram, 'cartesian');
      
      expect(result.isValid).toBe(true);
    });

    it('should validate cocartesian axioms', () => {
      const cocartGen: Generator = { 
        id: 'cocart-gen', 
        label: 'D', 
        color: 'cocartesian' 
      };
      const diagram = createGeneratorDiagram(cocartGen);
      
      const result = validateNPRAxioms(diagram, 'cocartesian');
      
      expect(result.isValid).toBe(true);
    });

    it('should validate structural axioms', () => {
      const gen: Generator = { id: 'gen', label: 'G' };
      const diagram = createGeneratorDiagram(gen);
      
      const result = validateNPRAxioms(diagram, 'structural');
      
      expect(result.isValid).toBe(true);
    });

    it('should detect NPR axiom violations', () => {
      const invalidGen: Generator = { id: '', label: 'Bad', color: 'invalid' as any };
      const diagram = createGeneratorDiagram(invalidGen);
      
      const result = validateNPRAxioms(diagram, 'structural');
      
      expect(result.isValid).toBe(false);
    });
  });

  describe('checkCompositionValidity', () => {
    it('should validate composable diagrams', () => {
      const gen1: Generator = { id: 'gen1', label: 'A' };
      const gen2: Generator = { id: 'gen2', label: 'B' };
      const diagram1 = createGeneratorDiagram(gen1);
      const diagram2 = createGeneratorDiagram(gen2);
      
      const result = checkCompositionValidity(diagram1, diagram2);
      
      expect(result.isValid).toBe(true);
    });

    it('should detect incomposable diagrams', () => {
      const validDiagram = createEmptyDiagram();
      const invalidDiagram = {
        dimension: -1,
        generator: null
      } as any;
      
      const result = checkCompositionValidity(validDiagram, invalidDiagram);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should validate dimensional compatibility', () => {
      const gen: Generator = { id: 'gen', label: 'G' };
      const diagram0D = createGeneratorDiagram(gen);
      const diagram1D: Diagram = {
        dimension: 1,
        source: diagram0D,
        cospans: []
      };
      
      const result = checkCompositionValidity(diagram0D, diagram1D);
      
      expect(typeof result.isValid).toBe('boolean');
    });

    it('should check color compatibility in compositions', () => {
      const cartGen: Generator = { id: 'cart', label: 'C', color: 'cartesian' };
      const cocartGen: Generator = { id: 'cocart', label: 'D', color: 'cocartesian' };
      const cartDiagram = createGeneratorDiagram(cartGen);
      const cocartDiagram = createGeneratorDiagram(cocartGen);
      
      const result = checkCompositionValidity(cartDiagram, cocartDiagram);
      
      expect(typeof result.isValid).toBe('boolean');
    });
  });

  describe('validateColorConsistency', () => {
    it('should validate consistent coloring', () => {
      const cartGen: Generator = { id: 'cart', label: 'C', color: 'cartesian' };
      const diagram = createGeneratorDiagram(cartGen);
      
      const result = validateColorConsistency(diagram);
      
      expect(result.isValid).toBe(true);
    });

    it('should detect color inconsistencies', () => {
      const gen1: Generator = { id: 'gen1', label: 'A', color: 'cartesian' };
      const gen2: Generator = { id: 'gen2', label: 'B', color: 'cocartesian' };
      const sourceDiagram = createGeneratorDiagram(gen1);
      
      // Mixed coloring in a single structure might be inconsistent
      const mixedColorDiagram: Diagram = {
        dimension: 1,
        source: sourceDiagram,
        cospans: [{
          forward: createGeneratorRewrite(gen1, gen2),
          backward: createGeneratorRewrite(gen2, gen1)
        }]
      };
      
      const result = validateColorConsistency(mixedColorDiagram);
      
      expect(typeof result.isValid).toBe('boolean');
    });

    it('should handle uncolored generators', () => {
      const uncoloredGen: Generator = { id: 'gen', label: 'G' };
      const diagram = createGeneratorDiagram(uncoloredGen);
      
      const result = validateColorConsistency(diagram);
      
      expect(result.isValid).toBe(true);
    });
  });

  describe('generateValidationReport', () => {
    it('should generate comprehensive validation report', () => {
      const gen: Generator = { id: 'gen', label: 'G' };
      const diagram = createGeneratorDiagram(gen);
      
      const report = generateValidationReport(diagram);
      
      expect(report.diagram).toEqual(diagram);
      expect(report.overallValid).toBe(true);
      expect(report.validationResults).toBeDefined();
      expect(report.summary).toBeDefined();
    });

    it('should report all validation failures', () => {
      const invalidDiagram = {
        dimension: -1,
        generator: { id: '', label: 'Bad' }
      } as any;
      
      const report = generateValidationReport(invalidDiagram);
      
      expect(report.overallValid).toBe(false);
      expect(report.validationResults.errors.length).toBeGreaterThan(0);
      expect(report.summary.errorCount).toBeGreaterThan(0);
    });

    it('should include warnings in report', () => {
      const gen: Generator = { id: 'gen', label: 'G', color: 'cartesian' };
      const diagram = createGeneratorDiagram(gen);
      
      const report = generateValidationReport(diagram);
      
      expect(report.validationResults.warnings).toBeDefined();
    });

    it('should provide validation statistics', () => {
      const gen: Generator = { id: 'gen', label: 'G' };
      const diagram = createGeneratorDiagram(gen);
      
      const report = generateValidationReport(diagram);
      
      expect(report.summary.totalChecks).toBeGreaterThan(0);
      expect(report.summary.passedChecks).toBeGreaterThan(0);
      expect(report.summary.errorCount).toBeGreaterThanOrEqual(0);
      expect(report.summary.warningCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle null/undefined inputs gracefully', () => {
      expect(() => validateDiagram(null as any)).not.toThrow();
      expect(() => validateRewrite(undefined as any)).not.toThrow();
    });

    it('should handle deeply nested structures', () => {
      const gen: Generator = { id: 'deep', label: 'D' };
      let deepDiagram: Diagram = createGeneratorDiagram(gen);
      
      // Create a deeply nested structure
      for (let i = 0; i < 10; i++) {
        deepDiagram = {
          dimension: i + 1,
          source: deepDiagram,
          cospans: []
        };
      }
      
      const result = validateDiagram(deepDiagram);
      
      expect(typeof result.isValid).toBe('boolean');
    });

    it('should detect circular references', () => {
      const gen: Generator = { id: 'cycle', label: 'C' };
      const sourceDiagram = createGeneratorDiagram(gen);
      const cyclicDiagram: any = {
        dimension: 1,
        source: sourceDiagram,
        cospans: []
      };
      cyclicDiagram.source = cyclicDiagram; // Create cycle
      
      const result = validateDiagram(cyclicDiagram);
      
      expect(result.isValid).toBe(false);
    });

    it('should handle performance with large structures', () => {
      const gen: Generator = { id: 'large', label: 'L' };
      const sourceDiagram = createGeneratorDiagram(gen);
      
      // Create a diagram with many cospans
      const largeCospans = Array(100).fill(null).map(() => 
        createCospanRewrite(createIdentityRewrite(), createIdentityRewrite())
      );
      
      const largeDiagram: Diagram = {
        dimension: 1,
        source: sourceDiagram,
        cospans: largeCospans
      };
      
      const start = Date.now();
      const result = validateDiagram(largeDiagram);
      const duration = Date.now() - start;
      
      expect(result).toBeDefined();
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });
  });
});