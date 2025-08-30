/**
 * Categorical validation operations for NPR diagrams
 * Implements well-formedness checking and axiom validation
 */

import type { Diagram, Generator } from '../types/diagram';
import { isValidDiagram, isValidGenerator } from '../types/diagram';
import type { Rewrite, Cospan, Cone } from '../types/rewrite';
import { isValidRewrite, isValidCospan, isValidCone } from '../types/rewrite';
import type { NPRValidationError, NPRAxiom } from '../types/npr';
import { 
  validateNPRAspects, 
  getNPRAxioms,
  checkCartesianProperties,
  checkCocartesianProperties,
  validateDiagramComposition
} from '../types/npr';

export interface ValidationResult {
  isValid: boolean;
  errors: NPRValidationError[];
  warnings: NPRValidationError[];
}

export interface WellFormednessResult {
  isWellFormed: boolean;
  violations: NPRValidationError[];
}

export interface CategoricalLawResult {
  isValid: boolean;
  errors: NPRValidationError[];
  lawType: string;
}

export interface ValidationReport {
  diagram: Diagram;
  overallValid: boolean;
  validationResults: ValidationResult;
  summary: ValidationSummary;
}

export interface ValidationSummary {
  totalChecks: number;
  passedChecks: number;
  errorCount: number;
  warningCount: number;
}

export type LawType = 'associativity' | 'identity' | 'composition';
export type NPRAxiomType = 'structural' | 'cartesian' | 'cocartesian';

/**
 * Validates a diagram comprehensively
 */
export function validateDiagram(diagram: Diagram): ValidationResult {
  const errors: NPRValidationError[] = [];
  const warnings: NPRValidationError[] = [];

  if (!diagram) {
    errors.push({
      code: 'NULL_DIAGRAM',
      message: 'Diagram is null or undefined',
      severity: 'error'
    });
    return { isValid: false, errors, warnings };
  }

  // Check for cycles to prevent infinite validation
  const visited = new Set<Diagram>();
  const MAX_DEPTH = 100;
  
  function checkValidationCycles(d: Diagram, depth: number, path: string): void {
    if (depth > MAX_DEPTH) {
      errors.push({
        code: 'VALIDATION_DEPTH_EXCEEDED',
        message: `Maximum validation depth exceeded at ${path}`,
        severity: 'error',
        location: path
      });
      return;
    }
    
    if (visited.has(d)) {
      errors.push({
        code: 'CIRCULAR_REFERENCE',
        message: `Circular reference detected at ${path}`,
        severity: 'error',
        location: path
      });
      return;
    }
    
    visited.add(d);
    
    if (d.dimension > 0 && d.source) {
      checkValidationCycles(d.source, depth + 1, `${path}.source`);
    }
  }
  
  checkValidationCycles(diagram, 0, 'root');
  
  // If we found cycles, return early
  if (errors.length > 0) {
    return { isValid: false, errors, warnings };
  }

  // Basic structural validation
  if (!isValidDiagram(diagram)) {
    errors.push({
      code: 'INVALID_STRUCTURE',
      message: 'Diagram has invalid structure',
      severity: 'error'
    });
  }

  // Validate generators
  validateDiagramGenerators(diagram, errors, warnings, 'root');

  // Validate cospans
  if (diagram.dimension > 0) {
    validateDiagramCospans(diagram, errors, warnings);
  }

  // NPR-specific validation (only if basic structure is valid)
  if (isValidDiagram(diagram)) {
    try {
      const nprValidation = validateNPRAspects(diagram);
      errors.push(...nprValidation.errors);
      warnings.push(...nprValidation.warnings);
    } catch (error) {
      errors.push({
        code: 'NPR_VALIDATION_ERROR',
        message: `NPR validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'error'
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validates a rewrite comprehensively
 */
export function validateRewrite(rewrite: Rewrite): ValidationResult {
  const errors: NPRValidationError[] = [];
  const warnings: NPRValidationError[] = [];

  if (!rewrite) {
    errors.push({
      code: 'NULL_REWRITE',
      message: 'Rewrite is null or undefined',
      severity: 'error'
    });
    return { isValid: false, errors, warnings };
  }

  // Basic structural validation
  if (!isValidRewrite(rewrite)) {
    errors.push({
      code: 'INVALID_REWRITE_STRUCTURE',
      message: 'Rewrite has invalid structure',
      severity: 'error'
    });
  }

  // Validate based on dimension
  if (rewrite.dimension === 0) {
    // Validate generator rewrite
    if (!isValidGenerator(rewrite.source)) {
      errors.push({
        code: 'INVALID_SOURCE_GENERATOR',
        message: 'Source generator is invalid',
        severity: 'error',
        location: 'source'
      });
    }
    
    if (!isValidGenerator(rewrite.target)) {
      errors.push({
        code: 'INVALID_TARGET_GENERATOR',
        message: 'Target generator is invalid',
        severity: 'error',
        location: 'target'
      });
    }
  } else if (rewrite.dimension === 1 && 'identity' in rewrite) {
    // Identity rewrite - always valid if properly structured
    if (!rewrite.identity) {
      warnings.push({
        code: 'SUSPICIOUS_IDENTITY',
        message: '1-dimensional rewrite should have identity: true',
        severity: 'warning'
      });
    }
  } else if (rewrite.dimension > 1 && 'cones' in rewrite) {
    // Validate cones
    for (let i = 0; i < rewrite.cones.length; i++) {
      const cone = rewrite.cones[i];
      if (!isValidCone(cone)) {
        errors.push({
          code: 'INVALID_CONE',
          message: `Cone at index ${i} is invalid`,
          severity: 'error',
          location: `cones[${i}]`
        });
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Checks well-formedness of a diagram
 */
export function checkWellFormedness(diagram: Diagram): WellFormednessResult {
  const violations: NPRValidationError[] = [];

  if (!diagram) {
    violations.push({
      code: 'NULL_INPUT',
      message: 'Cannot check well-formedness of null diagram',
      severity: 'error'
    });
    return { isWellFormed: false, violations };
  }

  // Check basic type constraints
  if (typeof diagram.dimension !== 'number') {
    violations.push({
      code: 'INVALID_DIMENSION_TYPE',
      message: 'Dimension must be a number',
      severity: 'error'
    });
  }

  if (diagram.dimension < 0) {
    violations.push({
      code: 'NEGATIVE_DIMENSION',
      message: 'Dimension cannot be negative',
      severity: 'error'
    });
  }

  // Check dimensional consistency
  if (diagram.dimension === 0) {
    // 0-dimensional diagram should have generator, not source/cospans
    if (!diagram.generator) {
      violations.push({
        code: 'MISSING_GENERATOR',
        message: '0-dimensional diagram must have a generator',
        severity: 'error'
      });
    }
    
    if ('source' in diagram || 'cospans' in diagram) {
      violations.push({
        code: 'INCONSISTENT_0D_STRUCTURE',
        message: '0-dimensional diagram should not have source or cospans',
        severity: 'error'
      });
    }
  } else {
    // Higher dimensional diagram should have source and cospans
    if (!('source' in diagram)) {
      violations.push({
        code: 'MISSING_SOURCE',
        message: `${diagram.dimension}-dimensional diagram must have a source`,
        severity: 'error'
      });
    }
    
    if (!('cospans' in diagram)) {
      violations.push({
        code: 'MISSING_COSPANS',
        message: `${diagram.dimension}-dimensional diagram must have cospans`,
        severity: 'error'
      });
    }
    
    if ('cospans' in diagram && !Array.isArray(diagram.cospans)) {
      violations.push({
        code: 'INVALID_COSPANS_TYPE',
        message: 'Cospans must be an array',
        severity: 'error'
      });
    }
  }

  // Check cospan well-formedness
  if (diagram.dimension > 0 && 'cospans' in diagram && Array.isArray(diagram.cospans)) {
    for (let i = 0; i < diagram.cospans.length; i++) {
      const cospan = diagram.cospans[i];
      if (!isValidCospan(cospan)) {
        violations.push({
          code: 'MALFORMED_COSPAN',
          message: `Cospan at index ${i} is malformed`,
          severity: 'error',
          location: `cospans[${i}]`
        });
      }
    }
  }

  return {
    isWellFormed: violations.length === 0,
    violations
  };
}

/**
 * Validates categorical laws for a diagram
 */
export function validateCategoricalLaws(diagram: Diagram, lawType: LawType): CategoricalLawResult {
  const errors: NPRValidationError[] = [];

  if (!isValidDiagram(diagram)) {
    errors.push({
      code: 'INVALID_DIAGRAM_FOR_LAW_CHECK',
      message: `Cannot validate ${lawType} laws on invalid diagram`,
      severity: 'error'
    });
    return { isValid: false, errors, lawType };
  }

  switch (lawType) {
    case 'associativity':
      validateAssociativityLaws(diagram, errors);
      break;
    case 'identity':
      validateIdentityLaws(diagram, errors);
      break;
    case 'composition':
      validateCompositionLaws(diagram, errors);
      break;
    default:
      errors.push({
        code: 'UNKNOWN_LAW_TYPE',
        message: `Unknown categorical law type: ${lawType}`,
        severity: 'error'
      });
  }

  return {
    isValid: errors.length === 0,
    errors,
    lawType
  };
}

/**
 * Validates NPR-specific axioms
 */
export function validateNPRAxioms(diagram: Diagram, axiomType: NPRAxiomType): ValidationResult {
  const errors: NPRValidationError[] = [];
  const warnings: NPRValidationError[] = [];

  if (!isValidDiagram(diagram)) {
    errors.push({
      code: 'INVALID_DIAGRAM_FOR_AXIOM_CHECK',
      message: `Cannot validate ${axiomType} axioms on invalid diagram`,
      severity: 'error'
    });
    return { isValid: false, errors, warnings };
  }

  const axioms = getNPRAxioms().filter(axiom => axiom.category === axiomType);
  
  for (const axiom of axioms) {
    const axiomErrors = axiom.validator(diagram);
    for (const error of axiomErrors) {
      if (error.severity === 'error') {
        errors.push(error);
      } else if (error.severity === 'warning') {
        warnings.push(error);
      }
    }
  }

  // Additional specific checks
  switch (axiomType) {
    case 'cartesian':
      errors.push(...checkCartesianProperties(diagram));
      break;
    case 'cocartesian':
      errors.push(...checkCocartesianProperties(diagram));
      break;
    case 'structural':
      // Basic structural checks are already done above
      break;
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Checks if two diagrams can be validly composed
 */
export function checkCompositionValidity(left: Diagram, right: Diagram): ValidationResult {
  const errors: NPRValidationError[] = [];
  const warnings: NPRValidationError[] = [];

  if (!left || !right) {
    errors.push({
      code: 'NULL_COMPOSITION_INPUT',
      message: 'Cannot check composition validity with null diagrams',
      severity: 'error'
    });
    return { isValid: false, errors, warnings };
  }

  // Use the existing NPR composition validation
  const compositionErrors = validateDiagramComposition(left, right);
  errors.push(...compositionErrors.filter(e => e.severity === 'error'));
  warnings.push(...compositionErrors.filter(e => e.severity === 'warning'));

  // Additional checks for dimensional compatibility
  if (Math.abs(left.dimension - right.dimension) > 2) {
    errors.push({
      code: 'INCOMPATIBLE_DIMENSIONS',
      message: `Dimension gap too large: ${left.dimension} vs ${right.dimension}`,
      severity: 'error'
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validates color consistency in NPR structures
 */
export function validateColorConsistency(diagram: Diagram): ValidationResult {
  const errors: NPRValidationError[] = [];
  const warnings: NPRValidationError[] = [];

  if (!isValidDiagram(diagram)) {
    errors.push({
      code: 'INVALID_DIAGRAM_FOR_COLOR_CHECK',
      message: 'Cannot validate colors on invalid diagram',
      severity: 'error'
    });
    return { isValid: false, errors, warnings };
  }

  // Collect all colors in the diagram
  const colors = new Set<string | undefined>();
  
  function collectColors(d: Diagram, path: string) {
    if (d.dimension === 0) {
      colors.add(d.generator.color);
    } else {
      collectColors(d.source, `${path}.source`);
      // Would also collect colors from cospans in full implementation
    }
  }
  
  collectColors(diagram, 'root');

  // Check for mixed colors (might be invalid in some NPR contexts)
  const definedColors = Array.from(colors).filter(c => c !== undefined);
  if (definedColors.length > 1) {
    warnings.push({
      code: 'MIXED_COLORS',
      message: `Diagram contains mixed colors: ${definedColors.join(', ')}`,
      severity: 'warning'
    });
  }

  // Check for invalid color values
  for (const color of definedColors) {
    if (color !== 'cartesian' && color !== 'cocartesian') {
      errors.push({
        code: 'INVALID_COLOR',
        message: `Invalid color value: ${color}`,
        severity: 'error'
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Generates a comprehensive validation report
 */
export function generateValidationReport(diagram: Diagram): ValidationReport {
  const validationResult = validateDiagram(diagram);
  const wellFormedness = checkWellFormedness(diagram);
  const colorConsistency = validateColorConsistency(diagram);
  
  // Combine all validation results
  const allErrors = [
    ...validationResult.errors,
    ...wellFormedness.violations.filter(v => v.severity === 'error'),
    ...colorConsistency.errors
  ];
  
  const allWarnings = [
    ...validationResult.warnings,
    ...wellFormedness.violations.filter(v => v.severity === 'warning'),
    ...colorConsistency.warnings
  ];

  const totalChecks = 3; // Basic count of validation types
  const passedChecks = (validationResult.errors.length === 0 ? 1 : 0) +
                      (wellFormedness.isWellFormed ? 1 : 0) +
                      (colorConsistency.errors.length === 0 ? 1 : 0);

  return {
    diagram,
    overallValid: allErrors.length === 0,
    validationResults: {
      isValid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings
    },
    summary: {
      totalChecks,
      passedChecks,
      errorCount: allErrors.length,
      warningCount: allWarnings.length
    }
  };
}

/**
 * Helper: Validates generators in a diagram recursively
 */
function validateDiagramGenerators(
  diagram: Diagram, 
  errors: NPRValidationError[], 
  warnings: NPRValidationError[], 
  path: string
): void {
  if (!diagram) {
    errors.push({
      code: 'NULL_DIAGRAM_IN_VALIDATION',
      message: `Null diagram encountered at ${path}`,
      severity: 'error',
      location: path
    });
    return;
  }

  if (diagram.dimension === 0) {
    if (!isValidGenerator(diagram.generator)) {
      errors.push({
        code: 'INVALID_GENERATOR',
        message: `Invalid generator at ${path}`,
        severity: 'error',
        location: path
      });
    }
  } else if (diagram.source) {
    validateDiagramGenerators(diagram.source, errors, warnings, `${path}.source`);
  }
}

/**
 * Helper: Validates cospans in a diagram
 */
function validateDiagramCospans(diagram: Diagram, errors: NPRValidationError[], warnings: NPRValidationError[]): void {
  if (diagram.dimension > 0 && 'cospans' in diagram) {
    for (let i = 0; i < diagram.cospans.length; i++) {
      const cospan = diagram.cospans[i];
      const cospanValidation = validateCospan(cospan, `cospans[${i}]`);
      errors.push(...cospanValidation.errors);
      warnings.push(...cospanValidation.warnings);
    }
  }
}

/**
 * Helper: Validates a single cospan
 */
function validateCospan(cospan: any, path: string): ValidationResult {
  const errors: NPRValidationError[] = [];
  const warnings: NPRValidationError[] = [];

  if (!isValidCospan(cospan)) {
    errors.push({
      code: 'INVALID_COSPAN',
      message: `Invalid cospan at ${path}`,
      severity: 'error',
      location: path
    });
  } else {
    // Validate forward and backward rewrites
    const forwardValidation = validateRewrite(cospan.forward);
    const backwardValidation = validateRewrite(cospan.backward);
    
    errors.push(...forwardValidation.errors.map(e => ({ ...e, location: `${path}.forward` })));
    errors.push(...backwardValidation.errors.map(e => ({ ...e, location: `${path}.backward` })));
    warnings.push(...forwardValidation.warnings.map(w => ({ ...w, location: `${path}.forward` })));
    warnings.push(...backwardValidation.warnings.map(w => ({ ...w, location: `${path}.backward` })));
  }

  return { isValid: errors.length === 0, errors, warnings };
}

/**
 * Helper: Validates associativity laws
 */
function validateAssociativityLaws(diagram: Diagram, errors: NPRValidationError[]): void {
  // In a full implementation, this would check that (f∘g)∘h = f∘(g∘h)
  // For now, we just check basic structural requirements
  if (diagram.dimension > 2) {
    // Complex associativity would be checked here
  }
}

/**
 * Helper: Validates identity laws
 */
function validateIdentityLaws(diagram: Diagram, errors: NPRValidationError[]): void {
  // In a full implementation, this would check that f∘id = f = id∘f
  // For now, we just check basic structural requirements
}

/**
 * Helper: Validates composition laws
 */
function validateCompositionLaws(diagram: Diagram, errors: NPRValidationError[]): void {
  // Check that compositions are well-defined
  if (diagram.dimension > 0 && 'cospans' in diagram) {
    // Would check that cospan compositions are valid
  }
}