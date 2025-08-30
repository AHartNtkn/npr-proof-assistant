/**
 * Categorical Operations Engine for NPR Diagrams
 * 
 * This module provides the core categorical operations for the NPR proof assistant,
 * implementing the homotopy.io zigzag model with NPR-specific extensions.
 * 
 * Core Operations:
 * - Contraction: Taking colimits of zigzag diagram parts
 * - Composition: Composing diagrams following categorical rules  
 * - Normalization: Type checking and term reduction
 * - Validation: Well-formedness checking and NPR axiom enforcement
 */

// Contraction operations
export {
  contractDiagram,
  contractCospan,
  findContractibleParts,
  performColimitContraction
} from './contraction';

// Composition operations
export {
  composeDiagrams,
  composeRewrites,
  composeSequentially,
  isComposable,
  getCompositionType,
  type CompositionType
} from './composition';

// Normalization operations
export {
  normalizeDiagram,
  normalizeRewrite,
  reduceTerms,
  checkTypeConsistency,
  performBetaReduction,
  performEtaExpansion,
  isNormalForm
} from './normalization';

// Validation operations
export {
  validateDiagram,
  validateRewrite,
  checkWellFormedness,
  validateCategoricalLaws,
  validateNPRAxioms,
  checkCompositionValidity,
  validateColorConsistency,
  generateValidationReport,
  type ValidationResult,
  type WellFormednessResult,
  type CategoricalLawResult,
  type ValidationReport,
  type ValidationSummary,
  type LawType,
  type NPRAxiomType
} from './validation';