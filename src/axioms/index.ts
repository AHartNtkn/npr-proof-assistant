/**
 * NPR Axiom System - Main Export Module
 * Provides comprehensive axiom system for Neo-Peircean Relations calculus
 */

// Core NPR rules and axioms
export {
  nprAssociativityAxiom,
  nprUnitAxiom,
  nprInverseAxiom,
  nprSymmetryAxiom,
  applyCoreNPRRules,
  isNPRAxiomApplicable,
  validateNPRRuleApplication,
  type NPRRuleApplicationResult,
  type NPRRuleValidationResult
} from './npr-rules';

// Cartesian-specific axioms
export {
  cartesianProductAxiom,
  cartesianProjectionAxiom,
  cartesianUniversalPropertyAxiom,
  cartesianCoherence,
  applyCartesianRules,
  validateCartesianStructure,
  isCartesianDiagram,
  type CartesianRuleResult,
  type CartesianValidationResult,
  type CartesianCoherenceResult
} from './cartesian';

// Cocartesian-specific axioms
export {
  cocartesianCoproductAxiom,
  cocartesianInjectionAxiom,
  cocartesianUniversalPropertyAxiom,
  cocartesianCoherence,
  applyCocartesianRules,
  validateCocartesianStructure,
  isCocartesianDiagram,
  type CocartesianRuleResult,
  type CocartesianValidationResult,
  type CocartesianCoherenceResult
} from './cocartesian';

// Validation framework
export {
  validateAllAxioms,
  validateAxiomCompatibility,
  createAxiomValidator,
  AxiomRegistry,
  ValidationReport,
  getRuleConflicts,
  isAxiomSetComplete,
  optimizeValidationOrder,
  type CompatibilityResult
} from './validation';

// Re-export NPR types for convenience
export type { 
  NPRAxiom, 
  NPRValidationError, 
  NPRValidationContext,
  NPRAspectsResult
} from '../types/npr';

/**
 * Create a complete NPR axiom system with all rules
 */
export function createCompleteNPRSystem(): AxiomRegistry {
  const registry = new AxiomRegistry();
  
  // Core NPR axioms
  registry.register(nprAssociativityAxiom());
  registry.register(nprUnitAxiom());
  registry.register(nprInverseAxiom());
  registry.register(nprSymmetryAxiom());
  
  // Cartesian axioms
  registry.register(cartesianProductAxiom());
  registry.register(cartesianProjectionAxiom());
  registry.register(cartesianUniversalPropertyAxiom());
  
  // Cocartesian axioms
  registry.register(cocartesianCoproductAxiom());
  registry.register(cocartesianInjectionAxiom());
  registry.register(cocartesianUniversalPropertyAxiom());
  
  return registry;
}

/**
 * Validate a diagram against the complete NPR axiom system
 */
export function validateWithCompleteSystem(diagram: Diagram): ValidationReport {
  const system = createCompleteNPRSystem();
  return validateAllAxioms(diagram, system);
}

/**
 * Get all core NPR axioms
 */
export function getAllNPRAxioms(): NPRAxiom[] {
  return createCompleteNPRSystem().getAllAxioms();
}

/**
 * Check if a diagram satisfies all NPR laws
 */
export function satisfiesAllNPRLaws(diagram: Diagram): boolean {
  const report = validateWithCompleteSystem(diagram);
  return report.isValid();
}

// Import types that we need for the exports above
import type { Diagram } from '../types/diagram';
import type { NPRAxiom } from '../types/npr';
import { 
  AxiomRegistry, 
  ValidationReport, 
  validateAllAxioms 
} from './validation';
import {
  nprAssociativityAxiom,
  nprUnitAxiom,
  nprInverseAxiom,
  nprSymmetryAxiom
} from './npr-rules';
import {
  cartesianProductAxiom,
  cartesianProjectionAxiom,
  cartesianUniversalPropertyAxiom
} from './cartesian';
import {
  cocartesianCoproductAxiom,
  cocartesianInjectionAxiom,
  cocartesianUniversalPropertyAxiom
} from './cocartesian';