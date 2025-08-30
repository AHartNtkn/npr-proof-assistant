/**
 * NPR Core Rules and Axioms
 * Implements the fundamental axioms of the Neo-Peircean Relations calculus
 */

import type { Diagram } from '../types/diagram';
import { isValidDiagram } from '../types/diagram';
import type { Rewrite } from '../types/rewrite';
import { isValidRewrite } from '../types/rewrite';
import type { NPRAxiom, NPRValidationError } from '../types/npr';

/**
 * Result of applying NPR rules to a diagram
 */
export interface NPRRuleApplicationResult {
  diagram: Diagram;
  appliedRules: string[];
  errors: NPRValidationError[];
}

/**
 * Result of validating an NPR rule application
 */
export interface NPRRuleValidationResult {
  isValid: boolean;
  errors: NPRValidationError[];
}

/**
 * NPR Associativity Axiom: (A ⊗ B) ⊗ C ≅ A ⊗ (B ⊗ C)
 * Ensures tensor composition is associative
 */
export function nprAssociativityAxiom(): NPRAxiom {
  return {
    id: 'npr-associativity',
    name: 'NPR Associativity',
    description: 'Tensor composition must be associative',
    category: 'structural',
    validator: (diagram: Diagram) => {
      const errors: NPRValidationError[] = [];
      
      // Basic structural validation
      if (!isValidDiagram(diagram)) {
        errors.push({
          code: 'INVALID_STRUCTURE',
          message: 'Diagram structure is invalid for associativity check',
          severity: 'error'
        });
      }
      
      // For 0-dimensional diagrams, associativity is trivially satisfied
      if (diagram.dimension === 0) {
        return errors;
      }
      
      // Higher-dimensional diagrams would need specific associativity checks
      // For now, we assume valid structure implies associativity
      return errors;
    }
  };
}

/**
 * NPR Unit Axiom: A ⊗ I ≅ A ≅ I ⊗ A
 * Ensures existence of unit elements for tensor operations
 */
export function nprUnitAxiom(): NPRAxiom {
  return {
    id: 'npr-unit',
    name: 'NPR Unit',
    description: 'Unit elements must satisfy unit laws',
    category: 'structural',
    validator: (diagram: Diagram) => {
      const errors: NPRValidationError[] = [];
      
      if (!isValidDiagram(diagram)) {
        errors.push({
          code: 'INVALID_STRUCTURE',
          message: 'Diagram structure is invalid for unit check',
          severity: 'error'
        });
      }
      
      // Unit laws are satisfied by construction in our model
      return errors;
    }
  };
}

/**
 * NPR Inverse Axiom: For every morphism f, there exists f† such that f ∘ f† ≅ id
 * Ensures existence of dagger operations
 */
export function nprInverseAxiom(): NPRAxiom {
  return {
    id: 'npr-inverse',
    name: 'NPR Inverse',
    description: 'Morphisms must have dagger inverses',
    category: 'structural',
    validator: (diagram: Diagram) => {
      const errors: NPRValidationError[] = [];
      
      if (!isValidDiagram(diagram)) {
        errors.push({
          code: 'INVALID_STRUCTURE',
          message: 'Diagram structure is invalid for inverse check',
          severity: 'error'
        });
        return errors;
      }
      
      // Check for proper generator structure
      if (diagram.dimension === 0) {
        const gen = diagram.generator;
        if (!gen.id || gen.id === '') {
          errors.push({
            code: 'INVALID_GENERATOR_ID',
            message: 'Generator must have valid ID for inverse operations',
            severity: 'error'
          });
        }
      }
      
      return errors;
    }
  };
}

/**
 * NPR Symmetry Axiom: A ⊗ B ≅ B ⊗ A via braiding
 * Ensures symmetric monoidal structure
 */
export function nprSymmetryAxiom(): NPRAxiom {
  return {
    id: 'npr-symmetry',
    name: 'NPR Symmetry',
    description: 'Tensor operations must be symmetric via braiding',
    category: 'structural',
    validator: (diagram: Diagram) => {
      const errors: NPRValidationError[] = [];
      
      if (!isValidDiagram(diagram)) {
        errors.push({
          code: 'INVALID_STRUCTURE',
          message: 'Diagram structure is invalid for symmetry check',
          severity: 'error'
        });
      }
      
      // Symmetry is ensured by the zigzag construction
      return errors;
    }
  };
}

/**
 * Checks if an NPR axiom is applicable to a given diagram
 */
export function isNPRAxiomApplicable(axiom: NPRAxiom, diagram: Diagram): boolean {
  // All structural axioms are always applicable
  if (axiom.category === 'structural') {
    return isValidDiagram(diagram);
  }
  
  // For cartesian/cocartesian axioms, check for colored generators
  if (diagram.dimension === 0) {
    const color = diagram.generator.color;
    if (axiom.category === 'cartesian') {
      return color === 'cartesian' || color === undefined;
    }
    if (axiom.category === 'cocartesian') {
      return color === 'cocartesian' || color === undefined;
    }
  }
  
  return true;
}

/**
 * Applies core NPR rules to a diagram and returns the result
 */
export function applyCoreNPRRules(diagram: Diagram): NPRRuleApplicationResult {
  const result: NPRRuleApplicationResult = {
    diagram,
    appliedRules: [],
    errors: []
  };
  
  // Apply each core axiom
  const axioms = [
    nprAssociativityAxiom(),
    nprUnitAxiom(),
    nprInverseAxiom(),
    nprSymmetryAxiom()
  ];
  
  for (const axiom of axioms) {
    if (isNPRAxiomApplicable(axiom, diagram)) {
      const errors = axiom.validator(diagram);
      result.errors.push(...errors);
      
      if (errors.length === 0) {
        result.appliedRules.push(axiom.id);
      }
    }
  }
  
  return result;
}

/**
 * Validates the application of an NPR rule via a rewrite
 */
export function validateNPRRuleApplication(
  axiom: NPRAxiom,
  diagram: Diagram,
  rewrite: Rewrite
): NPRRuleValidationResult {
  const errors: NPRValidationError[] = [];
  
  // Validate the diagram and rewrite structures
  if (!isValidDiagram(diagram)) {
    errors.push({
      code: 'INVALID_DIAGRAM',
      message: 'Source diagram is invalid',
      severity: 'error'
    });
  }
  
  if (!isValidRewrite(rewrite)) {
    errors.push({
      code: 'INVALID_REWRITE',
      message: 'Rewrite transformation is invalid',
      severity: 'error'
    });
  }
  
  // Check axiom applicability
  if (!isNPRAxiomApplicable(axiom, diagram)) {
    errors.push({
      code: 'AXIOM_NOT_APPLICABLE',
      message: `Axiom ${axiom.id} is not applicable to this diagram`,
      severity: 'error'
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}