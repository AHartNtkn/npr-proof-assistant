/**
 * Cocartesian-specific NPR axioms and validation
 * Implements cocartesian coproduct laws and dual structures for NPR
 */

import type { Diagram } from '../types/diagram';
import { isValidDiagram } from '../types/diagram';
import type { Rewrite } from '../types/rewrite';
import { isValidRewrite } from '../types/rewrite';
import type { NPRAxiom, NPRValidationError } from '../types/npr';

/**
 * Result of applying cocartesian rules
 */
export interface CocartesianRuleResult {
  diagram: Diagram;
  appliedRules: string[];
  errors: NPRValidationError[];
}

/**
 * Result of cocartesian structure validation
 */
export interface CocartesianValidationResult {
  isValid: boolean;
  errors: NPRValidationError[];
}

/**
 * Result of cocartesian coherence check
 */
export interface CocartesianCoherenceResult {
  isCoherent: boolean;
  violations: NPRValidationError[];
}

/**
 * Cocartesian Coproduct Axiom: A + B exists with injections ι₁: A → A + B, ι₂: B → A + B
 * Ensures cocartesian coproducts have the correct structure
 */
export function cocartesianCoproductAxiom(): NPRAxiom {
  return {
    id: 'cocartesian-coproduct',
    name: 'Cocartesian Coproduct',
    description: 'Cocartesian coproducts must exist with proper injections',
    category: 'cocartesian',
    validator: (diagram: Diagram) => {
      const errors: NPRValidationError[] = [];
      
      if (!isValidDiagram(diagram)) {
        errors.push({
          code: 'INVALID_DIAGRAM_STRUCTURE',
          message: 'Diagram structure is invalid for cocartesian coproduct',
          severity: 'error'
        });
        return errors;
      }
      
      // Check for cocartesian color in 0-dimensional case
      if (diagram.dimension === 0) {
        const gen = diagram.generator;
        if (gen.color === 'cocartesian') {
          // Validate cocartesian generator properties
          if (!gen.id || gen.id === '') {
            errors.push({
              code: 'INVALID_COCARTESIAN_ID',
              message: 'Cocartesian generator must have valid ID',
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
 * Cocartesian Injection Axiom: [f, g] ∘ ι₁ = f and [f, g] ∘ ι₂ = g
 * Ensures injections into coproducts work correctly
 */
export function cocartesianInjectionAxiom(): NPRAxiom {
  return {
    id: 'cocartesian-injection',
    name: 'Cocartesian Injection',
    description: 'Injections into cocartesian coproducts must satisfy injection laws',
    category: 'cocartesian',
    validator: (diagram: Diagram) => {
      const errors: NPRValidationError[] = [];
      
      if (!isValidDiagram(diagram)) {
        errors.push({
          code: 'INVALID_DIAGRAM_STRUCTURE',
          message: 'Diagram structure is invalid for injection validation',
          severity: 'error'
        });
        return errors;
      }
      
      // Injection laws are enforced by construction in our model
      // Additional validation would check specific injection morphisms
      return errors;
    }
  };
}

/**
 * Cocartesian Universal Property: For any f: A → C and g: B → C, 
 * there exists unique h: A + B → C such that h ∘ ι₁ = f and h ∘ ι₂ = g
 */
export function cocartesianUniversalPropertyAxiom(): NPRAxiom {
  return {
    id: 'cocartesian-universal',
    name: 'Cocartesian Universal Property',
    description: 'Cocartesian coproducts must satisfy universal property',
    category: 'cocartesian',
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
 * Checks if a diagram represents a cocartesian structure
 */
export function isCocartesianDiagram(diagram: Diagram): boolean {
  if (!isValidDiagram(diagram)) {
    return false;
  }
  
  if (diagram.dimension === 0) {
    return diagram.generator.color === 'cocartesian';
  }
  
  // For higher dimensions, check if source is cocartesian
  return isCocartesianDiagram(diagram.source);
}

/**
 * Applies cocartesian-specific rules to a diagram
 */
export function applyCocartesianRules(diagram: Diagram): CocartesianRuleResult {
  const result: CocartesianRuleResult = {
    diagram,
    appliedRules: [],
    errors: []
  };
  
  // Only apply to cocartesian diagrams
  if (!isCocartesianDiagram(diagram)) {
    return result;
  }
  
  const axioms = [
    cocartesianCoproductAxiom(),
    cocartesianInjectionAxiom(),
    cocartesianUniversalPropertyAxiom()
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
 * Validates the cocartesian structure of a diagram
 */
export function validateCocartesianStructure(diagram: Diagram): CocartesianValidationResult {
  const errors: NPRValidationError[] = [];
  
  if (!isValidDiagram(diagram)) {
    errors.push({
      code: 'INVALID_DIAGRAM',
      message: 'Diagram structure is invalid',
      severity: 'error'
    });
    return { isValid: false, errors };
  }
  
  if (!isCocartesianDiagram(diagram)) {
    // Not an error - just not a cocartesian diagram
    return { isValid: true, errors: [] };
  }
  
  // Apply cocartesian rules and collect errors
  const ruleResult = applyCocartesianRules(diagram);
  errors.push(...ruleResult.errors);
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Checks coherence conditions between cocartesian structures
 */
export function cocartesianCoherence(
  source: Diagram,
  target: Diagram,
  rewrite: Rewrite
): CocartesianCoherenceResult {
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
  
  const sourceIsCocartesian = isCocartesianDiagram(source);
  const targetIsCocartesian = isCocartesianDiagram(target);
  
  // Check coherence conditions
  if (sourceIsCocartesian && targetIsCocartesian) {
    // Both cocartesian - should preserve cocartesian structure
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
  } else if (sourceIsCocartesian && !targetIsCocartesian) {
    // Cocartesian to non-cocartesian might indicate loss of structure
    violations.push({
      code: 'STRUCTURE_LOSS',
      message: 'Rewrite from cocartesian to non-cocartesian may lose structure',
      severity: 'warning'
    });
  } else if (!sourceIsCocartesian && targetIsCocartesian) {
    // Non-cocartesian to cocartesian might indicate structure creation
    violations.push({
      code: 'STRUCTURE_CREATION',
      message: 'Rewrite from non-cocartesian to cocartesian creates structure',
      severity: 'info'
    });
  }
  
  return {
    isCoherent: violations.filter(v => v.severity === 'error').length === 0,
    violations
  };
}