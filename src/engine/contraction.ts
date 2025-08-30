/**
 * Categorical contraction operations for NPR diagrams
 * Implements taking colimits of zigzag diagram parts
 */

import type { Diagram, Generator } from '../types/diagram';
import { isValidDiagram } from '../types/diagram';
import type { Cospan, Rewrite, Cone } from '../types/rewrite';
import { createIdentityRewrite, isValidCospan, isValidRewrite } from '../types/rewrite';

/**
 * Contracts a diagram by taking colimits of contractible parts
 * This is a core categorical operation that simplifies zigzag structures
 */
export function contractDiagram(diagram: Diagram): Diagram {
  // Validate input
  if (!isValidDiagram(diagram)) {
    throw new Error('Invalid diagram structure');
  }

  // Handle cyclic references by checking depth
  const MAX_DEPTH = 100;
  const visited = new Set<Diagram>();
  
  function checkCycles(d: Diagram, depth: number): void {
    if (depth > MAX_DEPTH || visited.has(d)) {
      throw new Error('Cyclic reference detected in diagram');
    }
    visited.add(d);
    
    if (d.dimension > 0) {
      checkCycles(d.source, depth + 1);
    }
  }
  
  checkCycles(diagram, 0);

  // Base case: 0-dimensional diagrams contract to themselves
  if (diagram.dimension === 0) {
    return diagram;
  }

  // For higher dimensions, we need to contract the source first
  const contractedSource = contractDiagram(diagram.source);

  // Find and contract any contractible parts in the cospans
  const contractedCospans = diagram.cospans.map((cospan: any) => {
    if (isValidCospan(cospan)) {
      return contractCospan(cospan);
    }
    return cospan;
  });

  return {
    dimension: diagram.dimension,
    source: contractedSource,
    cospans: contractedCospans
  };
}

/**
 * Contracts a cospan by simplifying its forward and backward rewrites
 */
export function contractCospan(cospan: Cospan): Cospan {
  if (!isValidCospan(cospan)) {
    throw new Error('Invalid cospan structure');
  }

  // For identity rewrites, the cospan is already in minimal form
  if (cospan.forward.dimension === 1 && cospan.backward.dimension === 1) {
    return cospan;
  }

  // For generator rewrites, check if they can be simplified
  if (cospan.forward.dimension === 0 && cospan.backward.dimension === 0) {
    // If forward and backward are inverses, we could simplify further
    // For now, return as-is
    return cospan;
  }

  // For higher dimensional rewrites, recursively contract
  return {
    forward: contractRewrite(cospan.forward),
    backward: contractRewrite(cospan.backward)
  };
}

/**
 * Contracts a rewrite by simplifying its structure
 */
function contractRewrite(rewrite: Rewrite): Rewrite {
  if (!isValidRewrite(rewrite)) {
    throw new Error('Invalid rewrite structure');
  }

  // Base cases
  if (rewrite.dimension === 0 || rewrite.dimension === 1) {
    return rewrite;
  }

  // For higher dimensions, contract the cones
  const contractedCones = rewrite.cones.map(contractCone);
  
  return {
    dimension: rewrite.dimension,
    cones: contractedCones
  };
}

/**
 * Contracts a cone by simplifying its structure
 */
function contractCone(cone: Cone): Cone {
  // Contract source cospans
  const contractedSource = cone.source.map(contractCospan);
  
  // Contract target cospan
  const contractedTarget = contractCospan(cone.target);
  
  // Contract slice rewrites
  const contractedSlices = cone.slices.map(contractRewrite);
  
  return {
    index: cone.index,
    source: contractedSource,
    target: contractedTarget,
    slices: contractedSlices
  };
}

/**
 * Finds parts of a diagram that can be contracted via colimits
 * Returns an array of rewrite sequences that represent contractible zigzag parts
 */
export function findContractibleParts(diagram: Diagram): Rewrite[][] {
  if (!isValidDiagram(diagram)) {
    return [];
  }

  const contractibleParts: Rewrite[][] = [];

  // Base case: 0-dimensional diagrams have no contractible parts
  if (diagram.dimension === 0) {
    return [];
  }

  // Recursively find contractible parts in the source
  const sourceParts = findContractibleParts(diagram.source);
  contractibleParts.push(...sourceParts);

  // Look for contractible sequences in the cospans
  const cospanRewrites: Rewrite[] = [];
  for (const cospan of diagram.cospans as Cospan[]) {
    if (isValidCospan(cospan)) {
      cospanRewrites.push(cospan.forward, cospan.backward);
    }
  }

  // Find sequences that can be contracted
  if (cospanRewrites.length >= 2) {
    // Look for adjacent rewrites that can be composed and then contracted
    for (let i = 0; i < cospanRewrites.length - 1; i++) {
      const sequence = cospanRewrites.slice(i, i + 2);
      if (areContractible(sequence)) {
        contractibleParts.push(sequence);
      }
    }
  }

  return contractibleParts;
}

/**
 * Checks if a sequence of rewrites can be contracted
 */
function areContractible(rewrites: Rewrite[]): boolean {
  if (rewrites.length < 2) {
    return false;
  }

  // Simple heuristic: adjacent rewrites of the same dimension can often be contracted
  for (let i = 0; i < rewrites.length - 1; i++) {
    if (rewrites[i].dimension !== rewrites[i + 1].dimension) {
      return false;
    }
  }

  return true;
}

/**
 * Performs colimit contraction on a sequence of zigzag parts
 * This implements the core categorical colimit operation
 */
export function performColimitContraction(parts: Rewrite[]): Rewrite {
  // Handle empty parts
  if (parts.length === 0) {
    return createIdentityRewrite();
  }

  // Handle single part
  if (parts.length === 1) {
    return parts[0];
  }

  // For multiple parts, we need to compute their colimit
  // This is a complex categorical operation that depends on the specific structure
  
  // Start with the first rewrite and compose with others
  let result = parts[0];
  
  for (let i = 1; i < parts.length; i++) {
    result = composeRewrites(result, parts[i]);
  }

  return result;
}

/**
 * Composes two rewrites categorically
 * This is a helper for colimit computation
 */
function composeRewrites(left: Rewrite, right: Rewrite): Rewrite {
  // Handle identity compositions
  if (left.dimension === 1 && 'identity' in left && left.identity) {
    return right;
  }
  
  if (right.dimension === 1 && 'identity' in right && right.identity) {
    return left;
  }

  // Handle generator compositions
  if (left.dimension === 0 && right.dimension === 0) {
    // For generator rewrites, we'd need to check if they can be composed
    // based on their source/target matching
    return left; // Simplified for now
  }

  // For higher dimensions, this becomes quite complex
  // We'd need to handle cone compositions properly
  // For now, return the left rewrite as a placeholder
  return left;
}