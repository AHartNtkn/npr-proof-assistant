/**
 * NPR Axiom Validation Framework
 * Provides comprehensive validation infrastructure for NPR axioms
 */

import type { Diagram } from '../types/diagram';
import { isValidDiagram } from '../types/diagram';
import type { NPRAxiom, NPRValidationError } from '../types/npr';
import { getNPRAxioms } from '../types/npr';
import { nprAssociativityAxiom, nprUnitAxiom, nprInverseAxiom, nprSymmetryAxiom } from './npr-rules';
import { cartesianProductAxiom, cartesianProjectionAxiom, cartesianUniversalPropertyAxiom } from './cartesian';
import { cocartesianCoproductAxiom, cocartesianInjectionAxiom, cocartesianUniversalPropertyAxiom } from './cocartesian';

/**
 * Result of axiom compatibility check
 */
export interface CompatibilityResult {
  isCompatible: boolean;
  conflicts: NPRValidationError[];
}

/**
 * Registry for managing NPR axioms
 */
export class AxiomRegistry {
  private axioms: Map<string, NPRAxiom> = new Map();

  /**
   * Register an axiom in the registry
   */
  register(axiom: NPRAxiom): void {
    if (this.axioms.has(axiom.id)) {
      throw new Error(`Axiom ${axiom.id} is already registered`);
    }
    this.axioms.set(axiom.id, axiom);
  }

  /**
   * Get an axiom by ID
   */
  getAxiom(id: string): NPRAxiom | undefined {
    return this.axioms.get(id);
  }

  /**
   * Get all registered axioms
   */
  getAllAxioms(): NPRAxiom[] {
    return Array.from(this.axioms.values());
  }

  /**
   * Get axioms by category
   */
  getAxiomsByCategory(category: NPRAxiom['category']): NPRAxiom[] {
    return this.getAllAxioms().filter(axiom => axiom.category === category);
  }

  /**
   * Check if an axiom is registered
   */
  hasAxiom(id: string): boolean {
    return this.axioms.has(id);
  }

  /**
   * Unregister an axiom
   */
  unregister(id: string): boolean {
    return this.axioms.delete(id);
  }
}

/**
 * Validation report for a diagram
 */
export class ValidationReport {
  private axiomResults: Map<string, { errors: NPRValidationError[], warnings: NPRValidationError[] }> = new Map();

  constructor(public readonly diagram: Diagram) {}

  /**
   * Add results for an axiom
   */
  addAxiomResult(axiomId: string, errors: NPRValidationError[], warnings: NPRValidationError[]): void {
    this.axiomResults.set(axiomId, { errors, warnings });
  }

  /**
   * Get results for a specific axiom
   */
  getAxiomResult(axiomId: string): { errors: NPRValidationError[], warnings: NPRValidationError[] } | undefined {
    return this.axiomResults.get(axiomId);
  }

  /**
   * Get all validated axiom IDs
   */
  getValidatedAxioms(): string[] {
    return Array.from(this.axiomResults.keys());
  }

  /**
   * Get all errors from all axioms
   */
  getAllErrors(): NPRValidationError[] {
    const errors: NPRValidationError[] = [];
    for (const result of this.axiomResults.values()) {
      errors.push(...result.errors);
    }
    return errors;
  }

  /**
   * Get all warnings from all axioms
   */
  getAllWarnings(): NPRValidationError[] {
    const warnings: NPRValidationError[] = [];
    for (const result of this.axiomResults.values()) {
      warnings.push(...result.warnings);
    }
    return warnings;
  }

  /**
   * Check if the diagram is valid (no errors)
   */
  isValid(): boolean {
    return this.getAllErrors().length === 0;
  }

  /**
   * Get summary statistics
   */
  getSummary(): {
    totalAxioms: number;
    totalErrors: number;
    totalWarnings: number;
    isValid: boolean;
  } {
    return {
      totalAxioms: this.axiomResults.size,
      totalErrors: this.getAllErrors().length,
      totalWarnings: this.getAllWarnings().length,
      isValid: this.isValid()
    };
  }
}

/**
 * Create a default axiom registry with all NPR axioms
 */
function createDefaultRegistry(): AxiomRegistry {
  const registry = new AxiomRegistry();
  
  // Register core NPR axioms
  registry.register(nprAssociativityAxiom());
  registry.register(nprUnitAxiom());
  registry.register(nprInverseAxiom());
  registry.register(nprSymmetryAxiom());
  
  // Register cartesian axioms
  registry.register(cartesianProductAxiom());
  registry.register(cartesianProjectionAxiom());
  registry.register(cartesianUniversalPropertyAxiom());
  
  // Register cocartesian axioms
  registry.register(cocartesianCoproductAxiom());
  registry.register(cocartesianInjectionAxiom());
  registry.register(cocartesianUniversalPropertyAxiom());
  
  return registry;
}

// Default registry instance
const defaultRegistry = createDefaultRegistry();

/**
 * Validate all axioms against a diagram
 */
export function validateAllAxioms(diagram: Diagram, registry: AxiomRegistry = defaultRegistry): ValidationReport {
  const report = new ValidationReport(diagram);
  
  // Basic structure validation first
  if (!isValidDiagram(diagram)) {
    report.addAxiomResult('basic-structure', [
      {
        code: 'INVALID_DIAGRAM_STRUCTURE',
        message: 'Diagram does not follow valid zigzag structure',
        severity: 'error'
      }
    ], []);
    return report;
  }
  
  // Validate against all registered axioms
  for (const axiom of registry.getAllAxioms()) {
    const errors: NPRValidationError[] = [];
    const warnings: NPRValidationError[] = [];
    
    try {
      const validationResults = axiom.validator(diagram);
      
      for (const result of validationResults) {
        if (result.severity === 'error') {
          errors.push(result);
        } else if (result.severity === 'warning') {
          warnings.push(result);
        }
      }
    } catch (error) {
      errors.push({
        code: 'AXIOM_VALIDATION_ERROR',
        message: `Error validating axiom ${axiom.id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'error'
      });
    }
    
    report.addAxiomResult(axiom.id, errors, warnings);
  }
  
  return report;
}

/**
 * Check if a set of axioms is compatible
 */
export function validateAxiomCompatibility(axioms: NPRAxiom[], diagram: Diagram): CompatibilityResult {
  const conflicts: NPRValidationError[] = [];
  
  // Basic compatibility check - no duplicate IDs
  const ids = new Set<string>();
  for (const axiom of axioms) {
    if (ids.has(axiom.id)) {
      conflicts.push({
        code: 'DUPLICATE_AXIOM_ID',
        message: `Duplicate axiom ID: ${axiom.id}`,
        severity: 'error'
      });
    }
    ids.add(axiom.id);
  }
  
  // Category-based compatibility checks
  const categories = axioms.map(a => a.category);
  const hasCartesian = categories.includes('cartesian');
  const hasCocartesian = categories.includes('cocartesian');
  
  // Check for potential conflicts between cartesian and cocartesian
  if (hasCartesian && hasCocartesian && diagram.dimension === 0) {
    const gen = diagram.generator;
    if (gen.color === 'cartesian') {
      // Warn if applying cocartesian axioms to cartesian structure
      const cocartesianAxioms = axioms.filter(a => a.category === 'cocartesian');
      if (cocartesianAxioms.length > 0) {
        conflicts.push({
          code: 'CATEGORY_MISMATCH',
          message: 'Applying cocartesian axioms to cartesian structure',
          severity: 'warning'
        });
      }
    } else if (gen.color === 'cocartesian') {
      // Warn if applying cartesian axioms to cocartesian structure
      const cartesianAxioms = axioms.filter(a => a.category === 'cartesian');
      if (cartesianAxioms.length > 0) {
        conflicts.push({
          code: 'CATEGORY_MISMATCH',
          message: 'Applying cartesian axioms to cocartesian structure',
          severity: 'warning'
        });
      }
    }
  }
  
  return {
    isCompatible: conflicts.filter(c => c.severity === 'error').length === 0,
    conflicts
  };
}

/**
 * Create a validator function from an axiom
 */
export function createAxiomValidator(axiom: NPRAxiom): (diagram: Diagram) => NPRValidationError[] {
  return (diagram: Diagram) => {
    try {
      return axiom.validator(diagram);
    } catch (error) {
      return [{
        code: 'VALIDATOR_ERROR',
        message: `Error in axiom ${axiom.id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'error'
      }];
    }
  };
}

/**
 * Detect conflicts between rules
 */
export function getRuleConflicts(axioms: NPRAxiom[], diagram: Diagram): NPRValidationError[] {
  const conflicts: NPRValidationError[] = [];
  
  // Simple conflict detection - check for axioms that produce contradictory results
  const validationResults = new Map<string, NPRValidationError[]>();
  
  for (const axiom of axioms) {
    const errors = axiom.validator(diagram);
    validationResults.set(axiom.id, errors);
  }
  
  // Look for axioms that both pass and fail on similar conditions
  const passedAxioms = Array.from(validationResults.entries())
    .filter(([_, errors]) => errors.length === 0)
    .map(([id]) => id);
    
  const failedAxioms = Array.from(validationResults.entries())
    .filter(([_, errors]) => errors.length > 0)
    .map(([id]) => id);
  
  // This is a simplified conflict detection
  // In a full implementation, we would analyze the specific error codes and conditions
  
  return conflicts;
}

/**
 * Check if an axiom set is complete (covers all necessary aspects)
 */
export function isAxiomSetComplete(axioms: NPRAxiom[]): boolean {
  const categories = new Set(axioms.map(a => a.category));
  
  // For NPR, we need at least structural axioms
  if (!categories.has('structural')) {
    return false;
  }
  
  // Check for essential structural axioms
  const axiomIds = new Set(axioms.map(a => a.id));
  const essentialStructural = [
    'npr-associativity',
    'npr-unit',
    'npr-inverse',
    'npr-symmetry'
  ];
  
  return essentialStructural.every(id => axiomIds.has(id));
}

/**
 * Optimize the order of axiom validation for efficiency
 */
export function optimizeValidationOrder(axioms: NPRAxiom[], diagram: Diagram): NPRAxiom[] {
  // Simple optimization: structural axioms first, then specific categories
  const structural = axioms.filter(a => a.category === 'structural');
  const cartesian = axioms.filter(a => a.category === 'cartesian');
  const cocartesian = axioms.filter(a => a.category === 'cocartesian');
  
  // Determine which category is more relevant for this diagram
  let primaryCategory: NPRAxiom[] = [];
  let secondaryCategory: NPRAxiom[] = [];
  
  if (diagram.dimension === 0) {
    const color = diagram.generator.color;
    if (color === 'cartesian') {
      primaryCategory = cartesian;
      secondaryCategory = cocartesian;
    } else if (color === 'cocartesian') {
      primaryCategory = cocartesian;
      secondaryCategory = cartesian;
    } else {
      // No color preference, use original order
      primaryCategory = cartesian;
      secondaryCategory = cocartesian;
    }
  } else {
    // For higher dimensions, both categories might be relevant
    primaryCategory = cartesian;
    secondaryCategory = cocartesian;
  }
  
  return [...structural, ...primaryCategory, ...secondaryCategory];
}