/**
 * Round-trip integrity tests for NPR serialization
 * Ensures that encode -> decode -> encode produces identical results
 */

import { describe, it, expect } from 'vitest';
import type { Generator } from '../../types/diagram';
import type { Diagram, Diagram0, DiagramN } from '../../types/diagram';
import type { Rewrite, Cospan, Cone } from '../../types/rewrite';
import { 
  encodeGenerator, 
  encodeDiagram, 
  encodeRewrite, 
  encodeCospan, 
  encodeCone,
  encodeWithHeader 
} from '../encoder';
import { 
  decodeGenerator, 
  decodeDiagram, 
  decodeRewrite,
  decodeCospan,
  decodeCone,
  decodeWithHeader 
} from '../decoder';

describe('Generator Round-Trip', () => {
  it('should preserve basic generator without color', () => {
    const original: Generator = {
      id: 'test-gen',
      label: 'T'
    };
    
    const encoded = encodeGenerator(original);
    const decoded = decodeGenerator(encoded);
    
    expect(decoded.success).toBe(true);
    expect(decoded.data).toEqual(original);
    
    // Encode again to ensure consistency
    const reEncoded = encodeGenerator(decoded.data!);
    expect(reEncoded).toEqual(encoded);
  });

  it('should preserve generator with cartesian color', () => {
    const original: Generator = {
      id: 'cart-gen',
      label: 'C',
      color: 'cartesian'
    };
    
    const encoded = encodeGenerator(original);
    const decoded = decodeGenerator(encoded);
    
    expect(decoded.success).toBe(true);
    expect(decoded.data).toEqual(original);
    
    const reEncoded = encodeGenerator(decoded.data!);
    expect(reEncoded).toEqual(encoded);
  });

  it('should preserve generator with cocartesian color', () => {
    const original: Generator = {
      id: 'cocart-gen',
      color: 'cocartesian'
    };
    
    const encoded = encodeGenerator(original);
    const decoded = decodeGenerator(encoded);
    
    expect(decoded.success).toBe(true);
    expect(decoded.data).toEqual(original);
    
    const reEncoded = encodeGenerator(decoded.data!);
    expect(reEncoded).toEqual(encoded);
  });

  it('should preserve generator with minimal data', () => {
    const original: Generator = {
      id: 'minimal'
    };
    
    const encoded = encodeGenerator(original);
    const decoded = decodeGenerator(encoded);
    
    expect(decoded.success).toBe(true);
    expect(decoded.data).toEqual(original);
    
    const reEncoded = encodeGenerator(decoded.data!);
    expect(reEncoded).toEqual(encoded);
  });

  it('should preserve unicode characters', () => {
    const original: Generator = {
      id: 'unicode-test',
      label: '∀x∃y.φ(x,y) → ∃z.ψ(z)'
    };
    
    const encoded = encodeGenerator(original);
    const decoded = decodeGenerator(encoded);
    
    expect(decoded.success).toBe(true);
    expect(decoded.data).toEqual(original);
    
    const reEncoded = encodeGenerator(decoded.data!);
    expect(reEncoded).toEqual(encoded);
  });

  it('should handle empty strings correctly', () => {
    const original: Generator = {
      id: '',
      label: ''
    };
    
    const encoded = encodeGenerator(original);
    const decoded = decodeGenerator(encoded);
    
    expect(decoded.success).toBe(true);
    expect(decoded.data).toEqual(original);
    
    const reEncoded = encodeGenerator(decoded.data!);
    expect(reEncoded).toEqual(encoded);
  });
});

describe('Diagram Round-Trip', () => {
  it('should preserve 0-dimensional diagram', () => {
    const generator: Generator = {
      id: 'base-gen',
      label: 'B',
      color: 'cartesian'
    };
    
    const original: Diagram0 = {
      dimension: 0,
      generator
    };
    
    const encoded = encodeDiagram(original);
    const decoded = decodeDiagram(encoded);
    
    expect(decoded.success).toBe(true);
    expect(decoded.data).toEqual(original);
    
    const reEncoded = encodeDiagram(decoded.data!);
    expect(reEncoded).toEqual(encoded);
  });

  it('should preserve n-dimensional diagram with empty cospans', () => {
    const sourceGen: Generator = {
      id: 'source-gen',
      label: 'S',
      color: 'cocartesian'
    };
    
    const source: Diagram0 = {
      dimension: 0,
      generator: sourceGen
    };
    
    const original: DiagramN = {
      dimension: 2,
      source,
      cospans: []
    };
    
    const encoded = encodeDiagram(original);
    const decoded = decodeDiagram(encoded);
    
    expect(decoded.success).toBe(true);
    expect(decoded.data).toEqual(original);
    
    const reEncoded = encodeDiagram(decoded.data!);
    expect(reEncoded).toEqual(encoded);
  });

  it('should preserve deeply nested diagram structure', () => {
    const baseGen: Generator = { id: 'base', color: 'cartesian' };
    const base: Diagram0 = { dimension: 0, generator: baseGen };
    
    const level1: DiagramN = { dimension: 1, source: base, cospans: [] };
    const level2: DiagramN = { dimension: 2, source: level1, cospans: [] };
    const level3: DiagramN = { dimension: 3, source: level2, cospans: [] };
    
    const encoded = encodeDiagram(level3);
    const decoded = decodeDiagram(encoded);
    
    expect(decoded.success).toBe(true);
    expect(decoded.data).toEqual(level3);
    
    const reEncoded = encodeDiagram(decoded.data!);
    expect(reEncoded).toEqual(encoded);
  });
});

describe('Rewrite Round-Trip', () => {
  it('should preserve 0-dimensional rewrite', () => {
    const source: Generator = { id: 'from', label: 'F', color: 'cartesian' };
    const target: Generator = { id: 'to', label: 'T', color: 'cocartesian' };
    
    const original: Rewrite = {
      dimension: 0,
      source,
      target
    };
    
    const encoded = encodeRewrite(original);
    const decoded = decodeRewrite(encoded);
    
    expect(decoded.success).toBe(true);
    expect(decoded.data).toEqual(original);
    
    const reEncoded = encodeRewrite(decoded.data!);
    expect(reEncoded).toEqual(encoded);
  });

  it('should preserve 1-dimensional identity rewrite', () => {
    const original: Rewrite = {
      dimension: 1,
      identity: true
    };
    
    const encoded = encodeRewrite(original);
    const decoded = decodeRewrite(encoded);
    
    expect(decoded.success).toBe(true);
    expect(decoded.data).toEqual(original);
    
    const reEncoded = encodeRewrite(decoded.data!);
    expect(reEncoded).toEqual(encoded);
  });

  it('should preserve n-dimensional rewrite with empty cones', () => {
    const original: Rewrite = {
      dimension: 5,
      cones: []
    };
    
    const encoded = encodeRewrite(original);
    const decoded = decodeRewrite(encoded);
    
    expect(decoded.success).toBe(true);
    expect(decoded.data).toEqual(original);
    
    const reEncoded = encodeRewrite(decoded.data!);
    expect(reEncoded).toEqual(encoded);
  });
});

describe('Complex Structure Round-Trip', () => {
  it('should preserve cospan with different rewrites', () => {
    const gen1: Generator = { id: 'g1', color: 'cartesian' };
    const gen2: Generator = { id: 'g2', color: 'cocartesian' };
    const gen3: Generator = { id: 'g3' };
    
    const forward: Rewrite = { dimension: 0, source: gen1, target: gen2 };
    const backward: Rewrite = { dimension: 0, source: gen2, target: gen3 };
    
    const original: Cospan = {
      forward,
      backward
    };
    
    const encoded = encodeCospan(original);
    const decoded = decodeCospan(encoded);
    
    expect(decoded.success).toBe(true);
    expect(decoded.data).toEqual(original);
    
    const reEncoded = encodeCospan(decoded.data!);
    expect(reEncoded).toEqual(encoded);
  });

  it('should preserve cone with complex structure', () => {
    const identity: Rewrite = { dimension: 1, identity: true };
    
    const testCospan1: Cospan = {
      forward: identity,
      backward: identity
    };
    
    const testCospan2: Cospan = {
      forward: identity,
      backward: identity
    };
    
    const original: Cone = {
      index: 42,
      source: [testCospan1, testCospan2],
      target: testCospan1,
      slices: [identity, identity]
    };
    
    const encoded = encodeCone(original);
    const decoded = decodeCone(encoded);
    
    expect(decoded.success).toBe(true);
    expect(decoded.data).toEqual(original);
    
    const reEncoded = encodeCone(decoded.data!);
    expect(reEncoded).toEqual(encoded);
  });
});

describe('Header Round-Trip', () => {
  it('should preserve data with header', () => {
    const original: Generator = {
      id: 'header-test',
      label: 'Ħ',
      color: 'cartesian'
    };
    
    const encoded = encodeWithHeader(original);
    const decoded = decodeWithHeader(encoded);
    
    expect(decoded.success).toBe(true);
    expect(decoded.data).toEqual(original);
    
    const reEncoded = encodeWithHeader(decoded.data as Generator);
    expect(reEncoded).toEqual(encoded);
  });

  it('should preserve complex diagram with header', () => {
    const baseGen: Generator = { id: 'complex', label: '⊕' };
    const base: Diagram0 = { dimension: 0, generator: baseGen };
    const complex: DiagramN = { dimension: 2, source: base, cospans: [] };
    
    const encoded = encodeWithHeader(complex);
    const decoded = decodeWithHeader(encoded);
    
    expect(decoded.success).toBe(true);
    expect(decoded.data).toEqual(complex);
    
    const reEncoded = encodeWithHeader(decoded.data as Diagram);
    expect(reEncoded).toEqual(encoded);
  });
});

describe('Stress Tests', () => {
  it('should handle large generators with long strings', () => {
    const longId = 'x'.repeat(1000);
    const longLabel = '∀'.repeat(500) + '∃'.repeat(500);
    
    const original: Generator = {
      id: longId,
      label: longLabel,
      color: 'cartesian'
    };
    
    const encoded = encodeGenerator(original);
    const decoded = decodeGenerator(encoded);
    
    expect(decoded.success).toBe(true);
    expect(decoded.data).toEqual(original);
    
    const reEncoded = encodeGenerator(decoded.data!);
    expect(reEncoded).toEqual(encoded);
  });

  it('should handle deeply nested diagrams', () => {
    const baseGen: Generator = { id: 'deep' };
    let current: Diagram = { dimension: 0, generator: baseGen };
    
    // Create 10 levels of nesting
    for (let i = 1; i <= 10; i++) {
      current = {
        dimension: i,
        source: current,
        cospans: []
      } as DiagramN;
    }
    
    const encoded = encodeDiagram(current);
    const decoded = decodeDiagram(encoded);
    
    expect(decoded.success).toBe(true);
    expect(decoded.data).toEqual(current);
    
    const reEncoded = encodeDiagram(decoded.data!);
    expect(reEncoded).toEqual(encoded);
  });

  it('should preserve data integrity over multiple round trips', () => {
    const original: Generator = {
      id: 'multi-trip',
      label: '♠♦♣♥',
      color: 'cocartesian'
    };
    
    let current = original;
    
    // Perform 10 round trips
    for (let i = 0; i < 10; i++) {
      const encoded = encodeGenerator(current);
      const decoded = decodeGenerator(encoded);
      
      expect(decoded.success).toBe(true);
      expect(decoded.data).toEqual(original);
      
      current = decoded.data!;
    }
  });
});

describe('Binary Integrity', () => {
  it('should produce identical bytes for identical data', () => {
    const data1: Generator = { id: 'test', color: 'cartesian' };
    const data2: Generator = { id: 'test', color: 'cartesian' };
    
    const encoded1 = encodeGenerator(data1);
    const encoded2 = encodeGenerator(data2);
    
    expect(encoded1).toEqual(encoded2);
  });

  it('should produce different bytes for different data', () => {
    const data1: Generator = { id: 'test1', color: 'cartesian' };
    const data2: Generator = { id: 'test2', color: 'cartesian' };
    
    const encoded1 = encodeGenerator(data1);
    const encoded2 = encodeGenerator(data2);
    
    expect(encoded1).not.toEqual(encoded2);
  });

  it('should be deterministic across multiple encodings', () => {
    const original: Generator = { id: 'deterministic', label: 'Det' };
    
    const encoded1 = encodeGenerator(original);
    const encoded2 = encodeGenerator(original);
    const encoded3 = encodeGenerator(original);
    
    expect(encoded1).toEqual(encoded2);
    expect(encoded2).toEqual(encoded3);
  });
});