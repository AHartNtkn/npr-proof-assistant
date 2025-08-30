/**
 * NPR-specific validation and operations
 * Enforces Neo-Peircean Relations axioms and provides validation context
 */

import type { Diagram, Generator } from './diagram';
import { isValidDiagram, isValidGenerator } from './diagram';
import type { Rewrite } from './rewrite';
import { isValidRewrite } from './rewrite';

export interface NPRValidationError {
  code: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  location?: string;
}

export interface NPRAxiom {
  id: string;
  name: string;
  description: string;
  category: 'structural' | 'cartesian' | 'cocartesian';
  validator: (diagram: Diagram) => NPRValidationError[];
}

export interface NPRValidationContext {
  axioms: NPRAxiom[];
  errors: NPRValidationError[];
  warnings: NPRValidationError[];
}

export interface NPRAspectsResult {
  isValid: boolean;
  errors: NPRValidationError[];
  warnings: NPRValidationError[];
  context: NPRValidationContext;
}

/**
 * Creates a new NPR validation context
 */
export function createNPRValidationContext(): NPRValidationContext {
  return {
    axioms: getNPRAxioms(),
    errors: [],
    warnings: []
  };
}

/**
 * Gets the core NPR axioms for validation
 */
export function getNPRAxioms(): NPRAxiom[] {
  return [
    {
      id: 'structural-validity',
      name: 'Structural Validity',
      description: 'Diagram must follow valid zigzag structure',
      category: 'structural',
      validator: (diagram: Diagram) => {
        const errors: NPRValidationError[] = [];
        if (!isValidDiagram(diagram)) {
          errors.push({
            code: 'INVALID_STRUCTURE',
            message: 'Diagram does not follow valid zigzag structure',
            severity: 'error'
          });
        }
        return errors;
      }
    },
    {
      id: 'generator-validity', 
      name: 'Generator Validity',
      description: 'All generators must be valid with proper colors',
      category: 'structural',
      validator: (diagram: Diagram) => {
        const errors: NPRValidationError[] = [];
        
        function checkGenerator(gen: Generator, path: string) {
          if (!isValidGenerator(gen)) {
            errors.push({
              code: 'INVALID_GENERATOR',
              message: `Invalid generator at ${path}`,
              severity: 'error',
              location: path
            });
          }
        }
        
        function traverseDiagram(d: Diagram, path: string) {
          if (d.dimension === 0) {
            checkGenerator(d.generator, path);
          } else {
            traverseDiagram(d.source, `${path}.source`);
            // Check generators in cospans if we had access to them
          }
        }
        
        traverseDiagram(diagram, 'root');
        return errors;
      }
    },
    {
      id: 'cartesian-coherence',
      name: 'Cartesian Coherence',
      description: 'Cartesian structures must satisfy coherence conditions',
      category: 'cartesian',
      validator: (diagram: Diagram) => {
        // Simplified validation - in full implementation would check
        // cartesian product and projection laws
        return [];
      }
    },
    {
      id: 'cocartesian-coherence',
      name: 'Cocartesian Coherence', 
      description: 'Cocartesian structures must satisfy coherence conditions',
      category: 'cocartesian',
      validator: (diagram: Diagram) => {
        // Simplified validation - in full implementation would check
        // cocartesian coproduct and injection laws
        return [];
      }
    }
  ];
}

/**
 * Checks if a diagram is NPR compliant
 */
export function isNPRCompliant(diagram: Diagram): boolean {
  const result = validateNPRAspects(diagram);
  return result.isValid;
}

/**
 * Validates all NPR aspects of a diagram
 */
export function validateNPRAspects(diagram: Diagram): NPRAspectsResult {
  const context = createNPRValidationContext();
  const allErrors: NPRValidationError[] = [];
  const allWarnings: NPRValidationError[] = [];
  
  // Run all axiom validators
  for (const axiom of context.axioms) {
    const errors = axiom.validator(diagram);
    for (const error of errors) {
      if (error.severity === 'error') {
        allErrors.push(error);
      } else if (error.severity === 'warning') {
        allWarnings.push(error);
      }
    }
  }
  
  context.errors.push(...allErrors);
  context.warnings.push(...allWarnings);
  
  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
    context
  };
}

/**
 * Checks cartesian-specific properties of a diagram
 */
export function checkCartesianProperties(diagram: Diagram): NPRValidationError[] {
  const errors: NPRValidationError[] = [];
  
  function checkCartesianGenerator(gen: Generator, path: string) {
    if (gen.color === 'cartesian') {
      // In full implementation, would validate:
      // - Cartesian product laws
      // - Projection morphisms
      // - Universal property satisfaction
      // For now, just ensure basic validity
      if (!isValidGenerator(gen)) {
        errors.push({
          code: 'INVALID_CARTESIAN_GENERATOR',
          message: `Invalid cartesian generator at ${path}`,
          severity: 'error',
          location: path
        });
      }
    }
  }
  
  function traverseForCartesian(d: Diagram, path: string) {
    if (d.dimension === 0) {
      checkCartesianGenerator(d.generator, path);
    } else {
      traverseForCartesian(d.source, `${path}.source`);
      // Would also check cospans for cartesian properties
    }
  }
  
  traverseForCartesian(diagram, 'root');
  return errors;
}

/**
 * Checks cocartesian-specific properties of a diagram
 */
export function checkCocartesianProperties(diagram: Diagram): NPRValidationError[] {
  const errors: NPRValidationError[] = [];
  
  function checkCocartesianGenerator(gen: Generator, path: string) {
    if (gen.color === 'cocartesian') {
      // In full implementation, would validate:
      // - Cocartesian coproduct laws
      // - Injection morphisms  
      // - Universal property satisfaction
      // For now, just ensure basic validity
      if (!isValidGenerator(gen)) {
        errors.push({
          code: 'INVALID_COCARTESIAN_GENERATOR',
          message: `Invalid cocartesian generator at ${path}`,
          severity: 'error',
          location: path
        });
      }
    }
  }
  
  function traverseForCocartesian(d: Diagram, path: string) {
    if (d.dimension === 0) {
      checkCocartesianGenerator(d.generator, path);
    } else {
      traverseForCocartesian(d.source, `${path}.source`);
      // Would also check cospans for cocartesian properties
    }
  }
  
  traverseForCocartesian(diagram, 'root');
  return errors;
}

/**
 * Validates composition of two diagrams according to NPR rules
 */
export function validateDiagramComposition(left: Diagram, right: Diagram): NPRValidationError[] {
  const errors: NPRValidationError[] = [];
  
  // Basic structure validation
  if (!isValidDiagram(left)) {
    errors.push({
      code: 'INVALID_LEFT_DIAGRAM',
      message: 'Left diagram is structurally invalid',
      severity: 'error'
    });
  }
  
  if (!isValidDiagram(right)) {
    errors.push({
      code: 'INVALID_RIGHT_DIAGRAM', 
      message: 'Right diagram is structurally invalid',
      severity: 'error'
    });
  }
  
  // Dimension compatibility check
  if (left.dimension !== right.dimension) {
    // In some contexts, different dimensions might be composable
    // This would depend on the specific NPR composition rules
  }
  
  // Color compatibility checks (simplified)
  if (left.dimension === 0 && right.dimension === 0) {
    const leftColor = left.generator.color;
    const rightColor = right.generator.color;
    
    // Mixed color composition rules would be implemented here
    // For now, we allow all combinations
  }
  
  return errors;
}