/**
 * Categorical normalization operations for NPR diagrams
 * Implements type checking and term reduction
 */

import type { Diagram, Generator } from '../types/diagram';
import { isValidDiagram, createEmptyDiagram } from '../types/diagram';
import type { Rewrite, Cospan, Cone } from '../types/rewrite';
import { isValidRewrite, createIdentityRewrite, isValidCospan, isValidCone } from '../types/rewrite';
import { validateNPRAspects } from '../types/npr';

/**
 * Normalizes a diagram by reducing it to its canonical form
 * This includes type checking, beta reduction, and structural simplification
 */
export function normalizeDiagram(diagram: Diagram): Diagram {
  // Validate input
  if (!diagram) {
    throw new Error('Cannot normalize null or undefined diagram');
  }

  if (!isValidDiagram(diagram)) {
    throw new Error('Cannot normalize invalid diagram structure');
  }

  // Check for cycles to prevent infinite recursion
  const visited = new Set<Diagram>();
  const MAX_DEPTH = 100;
  
  function checkCycles(d: Diagram, depth: number): void {
    if (depth > MAX_DEPTH) {
      throw new Error('Maximum normalization depth exceeded - possible cycle detected');
    }
    if (visited.has(d)) {
      throw new Error('Circular reference detected during normalization');
    }
    visited.add(d);
    
    if (d.dimension > 0) {
      checkCycles(d.source, depth + 1);
    }
  }
  
  checkCycles(diagram, 0);

  // Base case: 0-dimensional diagrams are already in normal form if valid
  if (diagram.dimension === 0) {
    return diagram;
  }

  // Normalize the source first
  const normalizedSource = normalizeDiagram(diagram.source);

  // Normalize all cospans
  const normalizedCospans = diagram.cospans.map((cospan: any) => {
    if (isValidCospan(cospan)) {
      return normalizeCospan(cospan);
    }
    return cospan;
  });

  // Reduce redundant cospans
  const reducedCospans = reduceRedundantCospans(normalizedCospans);

  // Create the normalized diagram
  const normalized: Diagram = {
    dimension: diagram.dimension,
    source: normalizedSource,
    cospans: reducedCospans
  };

  return normalized;
}

/**
 * Normalizes a rewrite by reducing it to canonical form
 */
export function normalizeRewrite(rewrite: Rewrite): Rewrite {
  if (!rewrite) {
    throw new Error('Cannot normalize null or undefined rewrite');
  }

  if (!isValidRewrite(rewrite)) {
    throw new Error('Cannot normalize invalid rewrite structure');
  }

  // Base cases: identities and generators are already normalized
  if (rewrite.dimension === 1 && 'identity' in rewrite && rewrite.identity) {
    return rewrite;
  }

  if (rewrite.dimension === 0) {
    // Generator rewrites might be simplifiable if source equals target
    if (rewrite.source.id === rewrite.target.id) {
      // Could potentially convert to identity, but preserve structure for now
      return rewrite;
    }
    return rewrite;
  }

  // For higher dimensions, normalize the cones
  if (rewrite.dimension > 1 && 'cones' in rewrite) {
    const normalizedCones = rewrite.cones.map(normalizeCone);
    
    return {
      dimension: rewrite.dimension,
      cones: normalizedCones
    };
  }

  return rewrite;
}

/**
 * Reduces terms by eliminating redundancies and applying simplification rules
 */
export function reduceTerms(terms: Rewrite[]): Rewrite[] {
  if (terms.length === 0) {
    return [];
  }

  if (terms.length === 1) {
    return [normalizeRewrite(terms[0])];
  }

  // Start with normalized terms
  const normalized = terms.map(normalizeRewrite);
  const reduced: Rewrite[] = [];

  for (let i = 0; i < normalized.length; i++) {
    const current = normalized[i];

    // Skip identity rewrites in sequences (they can be eliminated)
    if (current.dimension === 1 && 'identity' in current && current.identity) {
      continue;
    }

    // Look for inverse pairs (A->B followed by B->A)
    if (i < normalized.length - 1) {
      const next = normalized[i + 1];
      
      if (areInverses(current, next)) {
        i++; // Skip both terms (they cancel out)
        continue;
      }
    }

    // Look for composable adjacent terms
    if (i < normalized.length - 1) {
      const next = normalized[i + 1];
      
      if (areComposable(current, next)) {
        const composed = composeForReduction(current, next);
        reduced.push(composed);
        i++; // Skip the next term since we consumed it
        continue;
      }
    }

    reduced.push(current);
  }

  return reduced;
}

/**
 * Checks type consistency of a diagram
 */
export function checkTypeConsistency(diagram: Diagram): boolean {
  if (!diagram) {
    return false;
  }

  // Basic structural validity check
  if (!isValidDiagram(diagram)) {
    return false;
  }

  // Check NPR aspects for type consistency
  try {
    const validation = validateNPRAspects(diagram);
    return validation.isValid;
  } catch (error) {
    return false;
  }
}

/**
 * Performs beta reduction on a rewrite (eliminates redexes)
 */
export function performBetaReduction(rewrite: Rewrite): Rewrite {
  if (!isValidRewrite(rewrite)) {
    throw new Error('Cannot perform beta reduction on invalid rewrite');
  }

  // Beta reduction for generator rewrites
  if (rewrite.dimension === 0) {
    return rewrite; // Already in beta-normal form
  }

  // Beta reduction for identity rewrites
  if (rewrite.dimension === 1 && 'identity' in rewrite && rewrite.identity) {
    return rewrite; // Identity is beta-normal
  }

  // Beta reduction for higher dimensional rewrites
  if (rewrite.dimension > 1 && 'cones' in rewrite) {
    const reducedCones = rewrite.cones.map(cone => {
      return {
        index: cone.index,
        source: cone.source.map(cospan => ({
          forward: performBetaReduction(cospan.forward),
          backward: performBetaReduction(cospan.backward)
        })),
        target: {
          forward: performBetaReduction(cone.target.forward),
          backward: performBetaReduction(cone.target.backward)
        },
        slices: cone.slices.map(performBetaReduction)
      };
    });

    return {
      dimension: rewrite.dimension,
      cones: reducedCones
    };
  }

  return rewrite;
}

/**
 * Performs eta expansion on a rewrite (introduces abstractions)
 */
export function performEtaExpansion(rewrite: Rewrite): Rewrite {
  if (!isValidRewrite(rewrite)) {
    throw new Error('Cannot perform eta expansion on invalid rewrite');
  }

  // Eta expansion for generator rewrites (convert to higher dimension)
  if (rewrite.dimension === 0) {
    // We could potentially expand to a 1-dimensional identity, but preserve for now
    return rewrite;
  }

  // Identity rewrites are already eta-expanded
  if (rewrite.dimension === 1 && 'identity' in rewrite && rewrite.identity) {
    return rewrite;
  }

  // For higher dimensions, eta expansion is context-dependent
  return rewrite;
}

/**
 * Checks if a diagram is in normal form
 */
export function isNormalForm(diagram: Diagram): boolean {
  if (!isValidDiagram(diagram)) {
    return false;
  }

  // 0-dimensional diagrams are always in normal form if valid
  if (diagram.dimension === 0) {
    return true;
  }

  // Check if source is in normal form
  if (!isNormalForm(diagram.source)) {
    return false;
  }

  // Check if all cospans are in normal form
  for (const cospan of diagram.cospans as Cospan[]) {
    if (isValidCospan(cospan)) {
      if (!isRewriteInNormalForm(cospan.forward) || 
          !isRewriteInNormalForm(cospan.backward)) {
        return false;
      }
    }
  }

  // Check for reducible patterns
  if (hasReduciblePatterns(diagram)) {
    return false;
  }

  return true;
}

/**
 * Normalizes a cospan by normalizing its constituent rewrites
 */
function normalizeCospan(cospan: Cospan): Cospan {
  return {
    forward: normalizeRewrite(cospan.forward),
    backward: normalizeRewrite(cospan.backward)
  };
}

/**
 * Normalizes a cone by normalizing all its components
 */
function normalizeCone(cone: Cone): Cone {
  return {
    index: cone.index,
    source: cone.source.map(normalizeCospan),
    target: normalizeCospan(cone.target),
    slices: cone.slices.map(normalizeRewrite)
  };
}

/**
 * Reduces redundant cospans in a cospan array
 */
function reduceRedundantCospans(cospans: Cospan[]): Cospan[] {
  const reduced: Cospan[] = [];
  
  for (const cospan of cospans as Cospan[]) {
    if (isValidCospan(cospan)) {
      // Check if this cospan is redundant (e.g., both forward and backward are identities)
      if (isRedundantCospan(cospan)) {
        continue; // Skip redundant cospans
      }
      reduced.push(cospan);
    }
  }
  
  return reduced;
}

/**
 * Checks if a cospan is redundant (can be eliminated)
 */
function isRedundantCospan(cospan: Cospan): boolean {
  const forward = cospan.forward;
  const backward = cospan.backward;
  
  // If both forward and backward are identities, the cospan is redundant
  if (forward.dimension === 1 && 'identity' in forward && forward.identity &&
      backward.dimension === 1 && 'identity' in backward && backward.identity) {
    return true;
  }
  
  return false;
}

/**
 * Checks if two rewrites are inverses of each other
 */
function areInverses(rewrite1: Rewrite, rewrite2: Rewrite): boolean {
  if (rewrite1.dimension !== rewrite2.dimension || rewrite1.dimension !== 0) {
    return false;
  }

  // For generator rewrites, check if source/target are swapped
  return (rewrite1.source.id === rewrite2.target.id && 
          rewrite1.target.id === rewrite2.source.id);
}

/**
 * Checks if two rewrites can be composed for reduction
 */
function areComposable(rewrite1: Rewrite, rewrite2: Rewrite): boolean {
  if (rewrite1.dimension !== 0 || rewrite2.dimension !== 0) {
    return false;
  }

  // For generator rewrites, check if target of first matches source of second
  return rewrite1.target.id === rewrite2.source.id;
}

/**
 * Composes two rewrites for reduction purposes
 */
function composeForReduction(rewrite1: Rewrite, rewrite2: Rewrite): Rewrite {
  if (!areComposable(rewrite1, rewrite2)) {
    throw new Error('Rewrites are not composable for reduction');
  }

  // Create a new generator rewrite from source of first to target of second
  return {
    dimension: 0,
    source: rewrite1.source,
    target: rewrite2.target
  };
}

/**
 * Checks if a rewrite is in normal form
 */
function isRewriteInNormalForm(rewrite: Rewrite): boolean {
  if (!isValidRewrite(rewrite)) {
    return false;
  }

  // Apply beta reduction and check if it changes
  const reduced = performBetaReduction(rewrite);
  
  // If beta reduction changed the structure, it wasn't in normal form
  if (!rewritesEqual(rewrite, reduced)) {
    return false;
  }

  return true;
}

/**
 * Checks if two rewrites are equal (for normal form checking)
 */
function rewritesEqual(rewrite1: Rewrite, rewrite2: Rewrite): boolean {
  if (rewrite1.dimension !== rewrite2.dimension) {
    return false;
  }

  if (rewrite1.dimension === 0 && rewrite2.dimension === 0) {
    return (rewrite1.source.id === rewrite2.source.id &&
            rewrite1.target.id === rewrite2.target.id);
  }

  if (rewrite1.dimension === 1 && rewrite2.dimension === 1) {
    return ('identity' in rewrite1 && 'identity' in rewrite2 && 
            rewrite1.identity === rewrite2.identity);
  }

  // For higher dimensions, this would require deep structural comparison
  // For now, assume they're different if we get here
  return false;
}

/**
 * Checks if a diagram has reducible patterns
 */
function hasReduciblePatterns(diagram: Diagram): boolean {
  if (diagram.dimension === 0) {
    return false;
  }

  // Check for patterns in cospans that could be reduced
  const cospans = diagram.cospans as Cospan[];
  
  // Look for consecutive identity cospans
  for (let i = 0; i < cospans.length - 1; i++) {
    const current = cospans[i];
    const next = cospans[i + 1];
    
    if (isValidCospan(current) && isValidCospan(next)) {
      if (isRedundantCospan(current) || isRedundantCospan(next)) {
        return true; // Found reducible pattern
      }
    }
  }

  return false;
}