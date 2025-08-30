/**
 * Core diagram types following the homotopy.io zigzag model
 * with NPR-specific extensions for colored nodes
 */

export interface Generator {
  id: string;
  label?: string;
  color?: 'cartesian' | 'cocartesian';
}

export type Diagram = Diagram0 | DiagramN;

export interface Diagram0 {
  dimension: 0;
  generator: Generator;
}

export interface DiagramN {
  dimension: number;
  source: Diagram;
  cospans: any[]; // Will be properly typed when we implement Cospan
}

/**
 * Validates that a Generator has required properties and valid values
 */
export function isValidGenerator(generator: any): generator is Generator {
  if (!generator || typeof generator !== 'object') {
    return false;
  }
  
  if (typeof generator.id !== 'string' || generator.id === '') {
    return false;
  }
  
  if (generator.label !== undefined && typeof generator.label !== 'string') {
    return false;
  }
  
  if (generator.color !== undefined) {
    if (generator.color !== 'cartesian' && generator.color !== 'cocartesian') {
      return false;
    }
  }
  
  return true;
}

/**
 * Validates that a Diagram follows the zigzag structure rules
 */
export function isValidDiagram(diagram: any): diagram is Diagram {
  if (!diagram || typeof diagram !== 'object') {
    return false;
  }
  
  if (typeof diagram.dimension !== 'number') {
    return false;
  }
  
  if (diagram.dimension === 0) {
    // 0-dimensional diagram must have a valid generator
    return isValidGenerator(diagram.generator);
  }
  
  if (diagram.dimension < 0) {
    return false;
  }
  
  // n-dimensional diagram must have valid source and cospans array
  if (!isValidDiagram(diagram.source)) {
    return false;
  }
  
  if (!Array.isArray(diagram.cospans)) {
    return false;
  }
  
  return true;
}

/**
 * Creates an empty diagram (identity element)
 */
export function createEmptyDiagram(): Diagram0 {
  return {
    dimension: 0,
    generator: {
      id: 'empty',
      label: 'ε'
    }
  };
}

/**
 * Creates a 0-dimensional diagram from a generator
 */
export function createGeneratorDiagram(generator: Generator): Diagram0 {
  return {
    dimension: 0,
    generator
  };
}