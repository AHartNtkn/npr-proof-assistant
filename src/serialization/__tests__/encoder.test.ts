/**
 * Tests for NPR data structure encoding
 */

import { describe, it, expect } from 'vitest';
import type { Generator } from '../../types/diagram';
import type { Diagram, Diagram0, DiagramN } from '../../types/diagram';
import type { Rewrite, Cospan, Cone } from '../../types/rewrite';
import { encodeGenerator, encodeDiagram, encodeRewrite } from '../encoder';

describe('Generator Encoding', () => {
  it('should encode basic generator without color', () => {
    const generator: Generator = {
      id: 'test-gen',
      label: 'T'
    };
    
    const encoded = encodeGenerator(generator);
    
    expect(encoded).toBeInstanceOf(Uint8Array);
    expect(encoded.length).toBeGreaterThan(0);
    
    // Should start with Generator type code
    expect(encoded[0]).toBe(0x10); // TypeCode.GENERATOR
  });

  it('should encode generator with cartesian color', () => {
    const generator: Generator = {
      id: 'cart-gen',
      label: 'C', 
      color: 'cartesian'
    };
    
    const encoded = encodeGenerator(generator);
    expect(encoded).toBeInstanceOf(Uint8Array);
    expect(encoded[0]).toBe(0x10); // TypeCode.GENERATOR
  });

  it('should encode generator with cocartesian color', () => {
    const generator: Generator = {
      id: 'cocart-gen',
      color: 'cocartesian'
    };
    
    const encoded = encodeGenerator(generator);
    expect(encoded).toBeInstanceOf(Uint8Array);
    expect(encoded[0]).toBe(0x10); // TypeCode.GENERATOR
  });

  it('should encode generator with minimal data', () => {
    const generator: Generator = {
      id: 'min'
    };
    
    const encoded = encodeGenerator(generator);
    expect(encoded).toBeInstanceOf(Uint8Array);
    expect(encoded[0]).toBe(0x10);
  });

  it('should handle empty id', () => {
    const generator: Generator = {
      id: ''
    };
    
    const encoded = encodeGenerator(generator);
    expect(encoded).toBeInstanceOf(Uint8Array);
  });

  it('should handle unicode in generator labels', () => {
    const generator: Generator = {
      id: 'unicode-gen',
      label: '∀x∃y'
    };
    
    const encoded = encodeGenerator(generator);
    expect(encoded).toBeInstanceOf(Uint8Array);
  });
});

describe('Diagram Encoding', () => {
  it('should encode 0-dimensional diagram', () => {
    const generator: Generator = {
      id: 'base-gen',
      label: 'B'
    };
    
    const diagram: Diagram0 = {
      dimension: 0,
      generator
    };
    
    const encoded = encodeDiagram(diagram);
    
    expect(encoded).toBeInstanceOf(Uint8Array);
    expect(encoded.length).toBeGreaterThan(0);
    expect(encoded[0]).toBe(0x20); // TypeCode.DIAGRAM_0D
  });

  it('should encode n-dimensional diagram with empty cospans', () => {
    const sourceGen: Generator = {
      id: 'source-gen',
      label: 'S'
    };
    
    const source: Diagram0 = {
      dimension: 0,
      generator: sourceGen
    };
    
    const diagram: DiagramN = {
      dimension: 1,
      source,
      cospans: []
    };
    
    const encoded = encodeDiagram(diagram);
    
    expect(encoded).toBeInstanceOf(Uint8Array);
    expect(encoded[0]).toBe(0x21); // TypeCode.DIAGRAM_ND
  });

  it('should handle deeply nested diagrams', () => {
    const baseGen: Generator = { id: 'base' };
    const base: Diagram0 = { dimension: 0, generator: baseGen };
    
    const level1: DiagramN = { dimension: 1, source: base, cospans: [] };
    const level2: DiagramN = { dimension: 2, source: level1, cospans: [] };
    
    const encoded = encodeDiagram(level2);
    expect(encoded).toBeInstanceOf(Uint8Array);
  });
});

describe('Rewrite Encoding', () => {
  it('should encode 0-dimensional rewrite', () => {
    const source: Generator = { id: 'from', label: 'F' };
    const target: Generator = { id: 'to', label: 'T' };
    
    const rewrite: Rewrite = {
      dimension: 0,
      source,
      target
    };
    
    const encoded = encodeRewrite(rewrite);
    
    expect(encoded).toBeInstanceOf(Uint8Array);
    expect(encoded[0]).toBe(0x30); // TypeCode.REWRITE_0D
  });

  it('should encode 1-dimensional identity rewrite', () => {
    const rewrite: Rewrite = {
      dimension: 1,
      identity: true
    };
    
    const encoded = encodeRewrite(rewrite);
    
    expect(encoded).toBeInstanceOf(Uint8Array);
    expect(encoded[0]).toBe(0x31); // TypeCode.REWRITE_1D_IDENTITY
  });

  it('should encode n-dimensional rewrite with empty cones', () => {
    const rewrite: Rewrite = {
      dimension: 2,
      cones: []
    };
    
    const encoded = encodeRewrite(rewrite);
    
    expect(encoded).toBeInstanceOf(Uint8Array);
    expect(encoded[0]).toBe(0x32); // TypeCode.REWRITE_ND
  });

  it('should encode complex rewrite with cones', () => {
    // Create a minimal cospan for the cone
    const identityRewrite: Rewrite = { dimension: 1, identity: true };
    const testCospan: Cospan = {
      forward: identityRewrite,
      backward: identityRewrite
    };
    
    const cone: Cone = {
      index: 0,
      source: [],
      target: testCospan,
      slices: []
    };
    
    const rewrite: Rewrite = {
      dimension: 2,
      cones: [cone]
    };
    
    const encoded = encodeRewrite(rewrite);
    expect(encoded).toBeInstanceOf(Uint8Array);
  });
});

describe('Error Handling', () => {
  it('should handle null generator', () => {
    expect(() => encodeGenerator(null as any)).toThrow();
  });

  it('should handle undefined diagram', () => {
    expect(() => encodeDiagram(undefined as any)).toThrow();
  });

  it('should handle invalid rewrite', () => {
    const invalidRewrite = { dimension: -1 };
    expect(() => encodeRewrite(invalidRewrite as any)).toThrow();
  });

  it('should handle diagram with invalid dimension', () => {
    const invalidDiagram = { dimension: -5, generator: { id: 'test' } };
    expect(() => encodeDiagram(invalidDiagram as any)).toThrow();
  });
});