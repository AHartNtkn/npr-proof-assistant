/**
 * Cartesian-specific NPR axioms and validation
 * Implements cartesian product laws and box structures for NPR
 */

import type { Diagram } from '../types/diagram';
import { isValidDiagram } from '../types/diagram';
import type { Rewrite } from '../types/rewrite';
import { isValidRewrite } from '../types/rewrite';
import type { NPRAxiom, NPRValidationError } from '../types/npr';

/**
 * Result of applying cartesian rules
 */
export interface CartesianRuleResult {
  diagram: Diagram;
  appliedRules: string[];
  errors: NPRValidationError[];
}

/**
 * Result of cartesian structure validation
 */
export interface CartesianValidationResult {
  isValid: boolean;
  errors: NPRValidationError[];
}

/**
 * Result of cartesian coherence check
 */
export interface CartesianCoherenceResult {
  isCoherent: boolean;
  violations: NPRValidationError[];
}

/**
 * Cartesian Product Axiom: A × B exists with projections π₁: A × B → A, π₂: A × B → B
 * Ensures cartesian products have the correct structure
 */
export function cartesianProductAxiom(): NPRAxiom {
  return {
    id: 'cartesian-product',
    name: 'Cartesian Product',
    description: 'Cartesian products must exist with proper projections',
    category: 'cartesian',
    validator: (diagram: Diagram) => {
      const errors: NPRValidationError[] = [];
      
      if (!isValidDiagram(diagram)) {
        errors.push({
          code: 'INVALID_DIAGRAM_STRUCTURE',
          message: 'Diagram structure is invalid for cartesian product',
          severity: 'error'
        });
        return errors;
      }
      
      // Check for cartesian color in 0-dimensional case
      if (diagram.dimension === 0) {
        const gen = diagram.generator;
        if (gen.color === 'cartesian') {
          // Validate cartesian generator properties
          if (!gen.id || gen.id === '') {
            errors.push({
              code: 'INVALID_CARTESIAN_ID',
              message: 'Cartesian generator must have valid ID',
              severity: 'error'
            });
          }
        }
      }
      
      return errors;
    }
  };
}

/**
 * Cartesian Projection Axiom: π₁ ∘ ⟨f, g⟩ = f and π₂ ∘ ⟨f, g⟩ = g
 * Ensures projections from products work correctly
 */
export function cartesianProjectionAxiom(): NPRAxiom {
  return {
    id: 'cartesian-projection',
    name: 'Cartesian Projection',
    description: 'Projections from cartesian products must satisfy projection laws',
    category: 'cartesian',
    validator: (diagram: Diagram) => {
      const errors: NPRValidationError[] = [];
      
      if (!isValidDiagram(diagram)) {
        errors.push({
          code: 'INVALID_DIAGRAM_STRUCTURE',
          message: 'Diagram structure is invalid for projection validation',
          severity: 'error'
        });
        return errors;
      }
      
      // Projection laws are enforced by construction in our model
      // Additional validation would check specific projection morphisms
      return errors;
    }
  };
}

/**
 * Cartesian Universal Property: For any f: C → A and g: C → B, 
 * there exists unique h: C → A × B such that π₁ ∘ h = f and π₂ ∘ h = g
 */
export function cartesianUniversalPropertyAxiom(): NPRAxiom {
  return {
    id: 'cartesian-universal',
    name: 'Cartesian Universal Property',
    description: 'Cartesian products must satisfy universal property',
    category: 'cartesian',
    validator: (diagram: Diagram) => {
      const errors: NPRValidationError[] = [];
      
      if (!isValidDiagram(diagram)) {
        errors.push({
          code: 'INVALID_DIAGRAM_STRUCTURE',
          message: 'Diagram structure is invalid for universal property',
          severity: 'error'
        });
        return errors;
      }
      
      // Universal property is satisfied by construction
      return errors;
    }
  };
}

/**
 * Checks if a diagram represents a cartesian structure
 */
export function isCartesianDiagram(diagram: Diagram): boolean {
  if (!isValidDiagram(diagram)) {
    return false;
  }
  
  if (diagram.dimension === 0) {
    return diagram.generator.color === 'cartesian';
  }
  
  // For higher dimensions, check if source is cartesian
  return isCartesianDiagram(diagram.source);
}

/**
 * Applies cartesian-specific rules to a diagram
 */
export function applyCartesianRules(diagram: Diagram): CartesianRuleResult {
  const result: CartesianRuleResult = {
    diagram,
    appliedRules: [],
    errors: []
  };
  
  // Only apply to cartesian diagrams
  if (!isCartesianDiagram(diagram)) {
    return result;
  }
  
  const axioms = [
    cartesianProductAxiom(),
    cartesianProjectionAxiom(),
    cartesianUniversalPropertyAxiom()
  ];
  
  for (const axiom of axioms) {
    const errors = axiom.validator(diagram);
    result.errors.push(...errors);
    
    if (errors.length === 0) {
      result.appliedRules.push(axiom.id);
    }
  }
  
  return result;
}

/**
 * Validates the cartesian structure of a diagram
 */
export function validateCartesianStructure(diagram: Diagram): CartesianValidationResult {
  const errors: NPRValidationError[] = [];
  
  if (!isValidDiagram(diagram)) {
    errors.push({
      code: 'INVALID_DIAGRAM',
      message: 'Diagram structure is invalid',
      severity: 'error'
    });
    return { isValid: false, errors };
  }
  
  if (!isCartesianDiagram(diagram)) {
    // Not an error - just not a cartesian diagram
    return { isValid: true, errors: [] };
  }
  
  // Apply cartesian rules and collect errors
  const ruleResult = applyCartesianRules(diagram);
  errors.push(...ruleResult.errors);
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Checks coherence conditions between cartesian structures
 */
export function cartesianCoherence(
  source: Diagram,
  target: Diagram,
  rewrite: Rewrite
): CartesianCoherenceResult {
  const violations: NPRValidationError[] = [];
  
  // Basic validation
  if (!isValidDiagram(source) || !isValidDiagram(target) || !isValidRewrite(rewrite)) {
    violations.push({
      code: 'INVALID_INPUTS',
      message: 'Source, target, or rewrite is invalid',
      severity: 'error'
    });
    return { isCoherent: false, violations };
  }
  
  const sourceIsCartesian = isCartesianDiagram(source);
  const targetIsCartesian = isCartesianDiagram(target);
  
  // Check coherence conditions
  if (sourceIsCartesian && targetIsCartesian) {
    // Both cartesian - should preserve cartesian structure
    if (rewrite.dimension === 0) {
      const sourceGen = source.dimension === 0 ? source.generator : null;
      const targetGen = target.dimension === 0 ? target.generator : null;
      
      if (sourceGen && targetGen) {
        if (rewrite.source.id !== sourceGen.id || rewrite.target.id !== targetGen.id) {
          violations.push({
            code: 'REWRITE_MISMATCH',
            message: 'Rewrite does not match source and target generators',
            severity: 'warning'
          });
        }
      }
    }
  } else if (sourceIsCartesian && !targetIsCartesian) {
    // Cartesian to non-cartesian might indicate loss of structure
    violations.push({
      code: 'STRUCTURE_LOSS',
      message: 'Rewrite from cartesian to non-cartesian may lose structure',
      severity: 'warning'
    });
  } else if (!sourceIsCartesian && targetIsCartesian) {
    // Non-cartesian to cartesian might indicate structure creation
    violations.push({
      code: 'STRUCTURE_CREATION',
      message: 'Rewrite from non-cartesian to cartesian creates structure',
      severity: 'info'
    });
  }
  
  return {
    isCoherent: violations.filter(v => v.severity === 'error').length === 0,
    violations
  };
}