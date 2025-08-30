/**
 * Tests for binary decoder functionality
 */

import { describe, it, expect } from 'vitest';
import type { Generator } from '../../types/diagram';
import type { Diagram, Diagram0, DiagramN } from '../../types/diagram';
import type { Rewrite, Cospan, Cone } from '../../types/rewrite';
import { encodeGenerator, encodeDiagram, encodeRewrite, encodeCospan, encodeCone, encodeWithHeader } from '../encoder';
import { 
  decodeGenerator, 
  decodeDiagram, 
  decodeRewrite,
  decodeCospan,
  decodeCone,
  decodeWithHeader 
} from '../decoder';

describe('Generator Decoding', () => {
  it('should decode basic generator without color', () => {
    const original: Generator = {
      id: 'test-gen',
      label: 'T'
    };
    
    const encoded = encodeGenerator(original);
    const decoded = decodeGenerator(encoded);
    
    expect(decoded.success).toBe(true);
    expect(decoded.data).toEqual(original);
  });

  it('should decode generator with cartesian color', () => {
    const original: Generator = {
      id: 'cart-gen',
      label: 'C',
      color: 'cartesian'
    };
    
    const encoded = encodeGenerator(original);
    const decoded = decodeGenerator(encoded);
    
    expect(decoded.success).toBe(true);
    expect(decoded.data).toEqual(original);
  });

  it('should decode generator with cocartesian color', () => {
    const original: Generator = {
      id: 'cocart-gen',
      color: 'cocartesian'
    };
    
    const encoded = encodeGenerator(original);
    const decoded = decodeGenerator(encoded);
    
    expect(decoded.success).toBe(true);
    expect(decoded.data).toEqual(original);
    expect(decoded.data!.label).toBeUndefined();
  });

  it('should decode generator with minimal data', () => {
    const original: Generator = {
      id: 'min'
    };
    
    const encoded = encodeGenerator(original);
    const decoded = decodeGenerator(encoded);
    
    expect(decoded.success).toBe(true);
    expect(decoded.data).toEqual(original);
  });

  it('should handle unicode in generator labels', () => {
    const original: Generator = {
      id: 'unicode-gen',
      label: '∀x∃y'
    };
    
    const encoded = encodeGenerator(original);
    const decoded = decodeGenerator(encoded);
    
    expect(decoded.success).toBe(true);
    expect(decoded.data).toEqual(original);
  });

  it('should reject malformed generator data', () => {
    const malformedData = new Uint8Array([0xFF, 0x42]); // Wrong type code
    const result = decodeGenerator(malformedData);
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('Expected Generator type code');
  });
});

describe('Diagram Decoding', () => {
  it('should decode 0-dimensional diagram', () => {
    const generator: Generator = {
      id: 'base-gen',
      label: 'B'
    };
    
    const original: Diagram0 = {
      dimension: 0,
      generator
    };
    
    const encoded = encodeDiagram(original);
    const decoded = decodeDiagram(encoded);
    
    expect(decoded.success).toBe(true);
    expect(decoded.data).toEqual(original);
  });

  it('should decode n-dimensional diagram with empty cospans', () => {
    const sourceGen: Generator = {
      id: 'source-gen',
      label: 'S'
    };
    
    const source: Diagram0 = {
      dimension: 0,
      generator: sourceGen
    };
    
    const original: DiagramN = {
      dimension: 1,
      source,
      cospans: []
    };
    
    const encoded = encodeDiagram(original);
    const decoded = decodeDiagram(encoded);
    
    expect(decoded.success).toBe(true);
    expect(decoded.data).toEqual(original);
  });

  it('should handle deeply nested diagrams', () => {
    const baseGen: Generator = { id: 'base' };
    const base: Diagram0 = { dimension: 0, generator: baseGen };
    
    const level1: DiagramN = { dimension: 1, source: base, cospans: [] };
    const level2: DiagramN = { dimension: 2, source: level1, cospans: [] };
    
    const encoded = encodeDiagram(level2);
    const decoded = decodeDiagram(encoded);
    
    expect(decoded.success).toBe(true);
    expect(decoded.data).toEqual(level2);
  });

  it('should reject malformed diagram data', () => {
    const malformedData = new Uint8Array([0xFF, 0x01]); // Wrong type code
    const result = decodeDiagram(malformedData);
    
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});

describe('Rewrite Decoding', () => {
  it('should decode 0-dimensional rewrite', () => {
    const source: Generator = { id: 'from', label: 'F' };
    const target: Generator = { id: 'to', label: 'T' };
    
    const original: Rewrite = {
      dimension: 0,
      source,
      target
    };
    
    const encoded = encodeRewrite(original);
    const decoded = decodeRewrite(encoded);
    
    expect(decoded.success).toBe(true);
    expect(decoded.data).toEqual(original);
  });

  it('should decode 1-dimensional identity rewrite', () => {
    const original: Rewrite = {
      dimension: 1,
      identity: true
    };
    
    const encoded = encodeRewrite(original);
    const decoded = decodeRewrite(encoded);
    
    expect(decoded.success).toBe(true);
    expect(decoded.data).toEqual(original);
  });

  it('should decode n-dimensional rewrite with empty cones', () => {
    const original: Rewrite = {
      dimension: 2,
      cones: []
    };
    
    const encoded = encodeRewrite(original);
    const decoded = decodeRewrite(encoded);
    
    expect(decoded.success).toBe(true);
    expect(decoded.data).toEqual(original);
  });
});

describe('Cospan and Cone Decoding', () => {
  it('should decode basic cospan', () => {
    const identityRewrite: Rewrite = { dimension: 1, identity: true };
    const original: Cospan = {
      forward: identityRewrite,
      backward: identityRewrite
    };
    
    const encoded = encodeCospan(original);
    const decoded = decodeCospan(encoded);
    
    expect(decoded.success).toBe(true);
    expect(decoded.data).toEqual(original);
  });

  it('should decode basic cone', () => {
    const identityRewrite: Rewrite = { dimension: 1, identity: true };
    const testCospan: Cospan = {
      forward: identityRewrite,
      backward: identityRewrite
    };
    
    const original: Cone = {
      index: 42,
      source: [testCospan],
      target: testCospan,
      slices: [identityRewrite]
    };
    
    const encoded = encodeCone(original);
    const decoded = decodeCone(encoded);
    
    expect(decoded.success).toBe(true);
    expect(decoded.data).toEqual(original);
  });
});

describe('Header Decoding', () => {
  it('should decode data with header', () => {
    const original: Generator = {
      id: 'header-test',
      label: 'H'
    };
    
    // Use encodeWithHeader from encoder
    const encoded = encodeWithHeader(original);
    const decoded = decodeWithHeader(encoded);
    
    expect(decoded.success).toBe(true);
    expect(decoded.data).toEqual(original);
  });

  it('should reject invalid header', () => {
    // Create a properly sized header with wrong magic bytes
    const badHeader = new Uint8Array(10);
    badHeader.set([0x42, 0x41, 0x44, 0x00], 0); // Wrong magic bytes
    badHeader[4] = 1; // version
    badHeader[5] = 0; // flags
    // data size = 0
    badHeader[6] = 0;
    badHeader[7] = 0;
    badHeader[8] = 0;
    badHeader[9] = 0;
    
    const result = decodeWithHeader(badHeader);
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('magic');
  });
});

describe('Error Handling', () => {
  it('should handle truncated data', () => {
    const truncatedData = new Uint8Array([0x10]); // Just type code, no data
    const result = decodeGenerator(truncatedData);
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('Unexpected end of data');
  });

  it('should handle null input', () => {
    expect(() => decodeGenerator(null as any)).toThrow();
  });

  it('should handle empty input', () => {
    const emptyData = new Uint8Array(0);
    const result = decodeGenerator(emptyData);
    
    expect(result.success).toBe(false);
  });

  it('should provide meaningful error messages', () => {
    const wrongTypeData = new Uint8Array([0x99]); // Invalid type code
    const result = decodeGenerator(wrongTypeData);
    
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(typeof result.error).toBe('string');
    expect(result.error!.length).toBeGreaterThan(0);
  });
});

describe('Metadata Tracking', () => {
  it('should track bytes read during decoding', () => {
    const generator: Generator = { id: 'test' };
    const encoded = encodeGenerator(generator);
    const decoded = decodeGenerator(encoded);
    
    expect(decoded.success).toBe(true);
    expect(decoded.bytesRead).toBe(encoded.length);
  });

  it('should handle partial reads correctly', () => {
    const generator: Generator = { id: 'partial-test', label: 'PT' };
    const encoded = encodeGenerator(generator);
    
    // Add extra bytes at the end
    const extendedData = new Uint8Array(encoded.length + 5);
    extendedData.set(encoded, 0);
    extendedData.fill(0xFF, encoded.length);
    
    const decoded = decodeGenerator(extendedData);
    
    expect(decoded.success).toBe(true);
    expect(decoded.bytesRead).toBe(encoded.length);
  });
});