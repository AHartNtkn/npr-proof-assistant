/**
 * Rewrite types for diagram transformations following the homotopy.io model
 * Includes Cospan for bidirectional transformations and Cone for sparse encoding
 */

import type { Generator } from './diagram';
import { isValidGenerator } from './diagram';

export type Rewrite = Rewrite0 | RewriteI | RewriteN;

export interface Rewrite0 {
  dimension: 0;
  source: Generator;
  target: Generator;
}

export interface RewriteI {
  dimension: 1;
  identity: true;
}

export interface RewriteN {
  dimension: number;
  cones: Cone[];
}

export interface Cospan {
  forward: Rewrite;
  backward: Rewrite;
}

export interface Cone {
  index: number;
  source: Cospan[];
  target: Cospan;
  slices: Rewrite[];
}

/**
 * Validates that a Rewrite follows the correct structure
 */
export function isValidRewrite(rewrite: any): rewrite is Rewrite {
  if (!rewrite || typeof rewrite !== 'object') {
    return false;
  }
  
  if (typeof rewrite.dimension !== 'number') {
    return false;
  }
  
  if (rewrite.dimension === 0) {
    // 0-dimensional rewrite must have valid source and target generators
    return isValidGenerator(rewrite.source) && isValidGenerator(rewrite.target);
  }
  
  if (rewrite.dimension === 1) {
    // 1-dimensional rewrite must be identity
    return rewrite.identity === true;
  }
  
  if (rewrite.dimension < 0) {
    return false;
  }
  
  // n-dimensional rewrite must have cones array
  if (!Array.isArray(rewrite.cones)) {
    return false;
  }
  
  // Validate all cones
  return rewrite.cones.every((cone: any) => isValidCone(cone));
}

/**
 * Validates that a Cospan has valid forward and backward rewrites
 */
export function isValidCospan(cospan: any): cospan is Cospan {
  if (!cospan || typeof cospan !== 'object') {
    return false;
  }
  
  return isValidRewrite(cospan.forward) && isValidRewrite(cospan.backward);
}

/**
 * Validates that a Cone follows the sparse encoding rules
 */
export function isValidCone(cone: any): cone is Cone {
  if (!cone || typeof cone !== 'object') {
    return false;
  }
  
  if (typeof cone.index !== 'number' || cone.index < 0) {
    return false;
  }
  
  if (!Array.isArray(cone.source)) {
    return false;
  }
  
  if (!isValidCospan(cone.target)) {
    return false;
  }
  
  if (!Array.isArray(cone.slices)) {
    return false;
  }
  
  // Validate all source cospans
  if (!cone.source.every((cospan: any) => isValidCospan(cospan))) {
    return false;
  }
  
  // Validate all slice rewrites
  return cone.slices.every((rewrite: any) => isValidRewrite(rewrite));
}

/**
 * Creates a 0-dimensional rewrite between generators
 */
export function createGeneratorRewrite(source: Generator, target: Generator): Rewrite0 {
  return {
    dimension: 0,
    source,
    target
  };
}

/**
 * Creates a 1-dimensional identity rewrite
 */
export function createIdentityRewrite(): RewriteI {
  return {
    dimension: 1,
    identity: true
  };
}

/**
 * Creates a cospan from forward and backward rewrites
 */
export function createCospanRewrite(forward: Rewrite, backward: Rewrite): Cospan {
  return {
    forward,
    backward
  };
}