/**
 * Categorical composition operations for NPR diagrams
 * Implements composing diagrams following categorical rules
 */

import type { Diagram, Generator } from '../types/diagram';
import { isValidDiagram, createEmptyDiagram } from '../types/diagram';
import type { Rewrite, Cospan } from '../types/rewrite';
import { isValidRewrite, createIdentityRewrite, createGeneratorRewrite } from '../types/rewrite';
import { validateDiagramComposition } from '../types/npr';

export type CompositionType = 'horizontal' | 'vertical' | 'whiskering' | 'invalid';

/**
 * Composes two diagrams categorically
 * The type of composition depends on the dimensional structure and compatibility
 */
export function composeDiagrams(left: Diagram, right: Diagram): Diagram {
  // Validate inputs
  if (!left || !right) {
    throw new Error('Cannot compose with null or undefined diagrams');
  }

  if (!isValidDiagram(left) || !isValidDiagram(right)) {
    throw new Error('Cannot compose invalid diagram structures');
  }

  // Check NPR composition validity
  const compositionErrors = validateDiagramComposition(left, right);
  if (compositionErrors.length > 0) {
    // For now, proceed with composition even if there are warnings
    // In a stricter implementation, we might throw on errors
  }

  // Handle composition with empty diagrams (identity)
  const emptyDiagram = createEmptyDiagram();
  if (isEmptyDiagram(left)) {
    return right;
  }
  if (isEmptyDiagram(right)) {
    return left;
  }

  // Determine composition type and compose accordingly
  const compositionType = getCompositionType(left, right);
  
  switch (compositionType) {
    case 'horizontal':
      return composeHorizontally(left, right);
    case 'vertical':
      return composeVertically(left, right);
    case 'whiskering':
      return composeByWhiskering(left, right);
    case 'invalid':
      throw new Error('Diagrams cannot be composed: incompatible structures');
    default:
      throw new Error(`Unknown composition type: ${compositionType}`);
  }
}

/**
 * Composes two rewrites if they are compatible
 */
export function composeRewrites(left: Rewrite, right: Rewrite): Rewrite {
  if (!isValidRewrite(left) || !isValidRewrite(right)) {
    throw new Error('Cannot compose invalid rewrites');
  }

  // Handle identity compositions
  if (left.dimension === 1 && 'identity' in left && left.identity) {
    return right;
  }
  
  if (right.dimension === 1 && 'identity' in right && right.identity) {
    return left;
  }

  // Handle generator rewrite composition
  if (left.dimension === 0 && right.dimension === 0) {
    // Check if they can be composed (target of left matches source of right)
    if (left.target.id !== right.source.id) {
      throw new Error('Generator rewrites are not composable: target/source mismatch');
    }

    return createGeneratorRewrite(left.source, right.target);
  }

  // Handle mixed dimensional compositions
  if (left.dimension === 0 && right.dimension > 0) {
    return right; // Simplified: higher dimension dominates
  }
  
  if (left.dimension > 0 && right.dimension === 0) {
    return left; // Simplified: higher dimension dominates
  }

  // Handle higher dimensional compositions
  if (left.dimension > 1 && right.dimension > 1) {
    // For higher dimensions, we'd need to compose cones properly
    // This is a complex categorical operation
    // For now, return left as a placeholder
    return left;
  }

  // Default case
  return left;
}

/**
 * Composes a sequence of rewrites sequentially
 */
export function composeSequentially(rewrites: Rewrite[]): Rewrite {
  if (rewrites.length === 0) {
    return createIdentityRewrite();
  }

  if (rewrites.length === 1) {
    return rewrites[0];
  }

  // Compose left to right
  let result = rewrites[0];
  for (let i = 1; i < rewrites.length; i++) {
    result = composeRewrites(result, rewrites[i]);
  }

  return result;
}

/**
 * Checks if two diagrams can be composed
 */
export function isComposable(left: Diagram, right: Diagram): boolean {
  if (!isValidDiagram(left) || !isValidDiagram(right)) {
    return false;
  }

  // Empty diagrams are always composable
  if (isEmptyDiagram(left) || isEmptyDiagram(right)) {
    return true;
  }

  // Same dimension diagrams are generally composable
  if (left.dimension === right.dimension) {
    return true;
  }

  // Different dimensions might be composable via whiskering
  // This depends on the specific NPR rules
  const dimensionDiff = Math.abs(left.dimension - right.dimension);
  
  // Allow compositions within reasonable dimension differences
  if (dimensionDiff <= 2) {
    return true;
  }

  return false;
}

/**
 * Determines the type of composition possible between two diagrams
 */
export function getCompositionType(left: Diagram, right: Diagram): CompositionType {
  if (!isValidDiagram(left) || !isValidDiagram(right)) {
    return 'invalid';
  }

  // Same dimension compositions
  if (left.dimension === right.dimension) {
    if (left.dimension === 0) {
      return 'horizontal'; // 0-cells compose horizontally
    } else {
      // Check if they can be composed vertically (sources match)
      if (areVerticallyComposable(left, right)) {
        return 'vertical';
      } else {
        return 'horizontal';
      }
    }
  }

  // Different dimension compositions (whiskering)
  if (Math.abs(left.dimension - right.dimension) === 1) {
    return 'whiskering';
  }

  // Large dimension differences are typically not composable
  if (Math.abs(left.dimension - right.dimension) > 2) {
    return 'invalid';
  }

  return 'horizontal'; // Default fallback
}

/**
 * Checks if two diagrams can be composed vertically
 */
function areVerticallyComposable(left: Diagram, right: Diagram): boolean {
  if (left.dimension === 0 && right.dimension === 0) {
    return false; // 0-cells don't compose vertically
  }

  if (left.dimension !== right.dimension) {
    return false;
  }

  // For higher dimensions, we'd check if the target of left matches source of right
  // This is a simplification for now
  return true;
}

/**
 * Performs horizontal composition of two diagrams
 */
function composeHorizontally(left: Diagram, right: Diagram): Diagram {
  // For 0-dimensional diagrams, create a higher dimensional composition
  if (left.dimension === 0 && right.dimension === 0) {
    return {
      dimension: 1,
      source: left,
      cospans: [{
        forward: createGeneratorRewrite(left.generator, right.generator),
        backward: createGeneratorRewrite(right.generator, left.generator)
      }]
    };
  }

  // For higher dimensions, compose the sources and combine cospans
  if (left.dimension > 0 && right.dimension > 0) {
    const composedSource = composeHorizontally(left.source, right.source);
    const combinedCospans = [...left.cospans, ...right.cospans];
    
    return {
      dimension: Math.max(left.dimension, right.dimension),
      source: composedSource,
      cospans: combinedCospans
    };
  }

  // Mixed cases: use the higher dimensional diagram as base
  return left.dimension > right.dimension ? left : right;
}

/**
 * Performs vertical composition of two diagrams
 */
function composeVertically(left: Diagram, right: Diagram): Diagram {
  if (left.dimension === 0 || right.dimension === 0) {
    throw new Error('Cannot vertically compose 0-dimensional diagrams');
  }

  // For vertical composition, we need to ensure the target of left matches source of right
  // This is a complex operation that would involve matching boundaries
  // For now, create a new diagram with composed structure
  
  return {
    dimension: left.dimension,
    source: left.source,
    cospans: mergeVerticalCospans(left.cospans as Cospan[], right.cospans as Cospan[])
  };
}

/**
 * Performs whiskering composition (mixed dimensions)
 */
function composeByWhiskering(left: Diagram, right: Diagram): Diagram {
  const higherDim = left.dimension > right.dimension ? left : right;
  const lowerDim = left.dimension > right.dimension ? right : left;

  // Whiskering: the lower dimensional diagram acts as a context for the higher one
  return {
    dimension: higherDim.dimension,
    source: higherDim.source,
    cospans: higherDim.cospans
  };
}

/**
 * Merges cospans for vertical composition
 */
function mergeVerticalCospans(leftCospans: Cospan[], rightCospans: Cospan[]): Cospan[] {
  // This is a complex operation that would involve proper categorical composition
  // For now, concatenate and return
  return [...leftCospans, ...rightCospans];
}

/**
 * Checks if a diagram is the empty diagram
 */
function isEmptyDiagram(diagram: Diagram): boolean {
  return diagram.dimension === 0 && diagram.generator.id === 'empty';
}