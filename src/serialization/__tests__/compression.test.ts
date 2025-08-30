/**
 * Tests for compression functionality
 * Evaluates compression benefits and implements compression support
 */

import { describe, it, expect } from 'vitest';
import type { Generator } from '../../types/diagram';
import type { Diagram, DiagramN } from '../../types/diagram';
import type { Rewrite, Cospan } from '../../types/rewrite';
import { encodeGenerator, encodeDiagram, encodeWithHeader } from '../encoder';
import { compressData, decompressData } from '../compression';

describe('Compression Evaluation', () => {
  it('should demonstrate compression benefits on repetitive data', () => {
    // Create a large diagram with repetitive structure
    const baseGen: Generator = { id: 'repetitive-base', label: 'R' };
    let current: Diagram = { dimension: 0, generator: baseGen };
    
    // Create many levels with same pattern
    for (let i = 1; i <= 20; i++) {
      current = {
        dimension: i,
        source: current,
        cospans: []
      } as DiagramN;
    }
    
    const uncompressed = encodeDiagram(current);
    
    // This test will fail until compression is implemented
    expect(() => compressData(uncompressed)).not.toThrow();
  });

  it('should handle compression of large strings', () => {
    const generator: Generator = {
      id: 'large-string-test',
      label: 'This is a very long label that repeats many times. '.repeat(100),
      color: 'cartesian'
    };
    
    const uncompressed = encodeGenerator(generator);
    
    console.log('Uncompressed size:', uncompressed.length, 'bytes');
    
    // This will fail until compression is implemented
    expect(() => compressData(uncompressed)).not.toThrow();
  });

  it('should demonstrate size reduction on structured data', () => {
    // Create data with repeated patterns
    const generators = Array.from({ length: 50 }, (_, i) => ({
      id: `gen-${i % 10}`, // Only 10 unique IDs, lots of repetition
      label: `Label ${i % 5}`, // Only 5 unique labels
      color: (i % 2 === 0 ? 'cartesian' : 'cocartesian') as 'cartesian' | 'cocartesian'
    }));
    
    const encodedGenerators = generators.map(gen => encodeGenerator(gen));
    const totalSize = encodedGenerators.reduce((sum, arr) => sum + arr.length, 0);
    
    console.log('Total uncompressed size:', totalSize, 'bytes');
    console.log('Average per generator:', totalSize / generators.length, 'bytes');
    
    // The compression implementation should be able to compress this
    expect(() => {
      for (const encoded of encodedGenerators) {
        compressData(encoded);
      }
    }).not.toThrow();
  });
});

describe('Compression Implementation', () => {
  it('should compress and decompress data correctly', () => {
    const original: Generator = {
      id: 'compression-test',
      label: 'AAAAAAAAAA'.repeat(20), // Highly repetitive string
      color: 'cartesian'
    };
    
    const uncompressed = encodeGenerator(original);
    const compressed = compressData(uncompressed);
    const decompressed = decompressData(compressed);
    
    // Main test: round-trip integrity
    expect(decompressed).toEqual(uncompressed);
    
    // Compression benefit test (might not always compress smaller)
    console.log('Compression ratio:', compressed.length / uncompressed.length);
  });

  it('should handle already compressed data gracefully', () => {
    const generator: Generator = { id: 'abc', label: 'xyz' };
    const uncompressed = encodeGenerator(generator);
    
    // Small data might not compress well
    const compressed = compressData(uncompressed);
    
    // Should still work even if no compression benefit
    const decompressed = decompressData(compressed);
    expect(decompressed).toEqual(uncompressed);
  });

  it('should work with header compression flag', () => {
    const original: Generator = {
      id: 'header-compression-test',
      label: 'BBBBBBBB'.repeat(100), // Very repetitive
      color: 'cocartesian'
    };
    
    const uncompressed = encodeWithHeader(original);
    const compressed = compressData(uncompressed);
    const decompressed = decompressData(compressed);
    
    // Main test: round-trip integrity
    expect(decompressed).toEqual(uncompressed);
    
    console.log('Header compression ratio:', compressed.length / uncompressed.length);
  });

  it('should maintain data integrity under compression', () => {
    // Create complex nested structure
    const baseGen: Generator = { 
      id: 'integrity-test-base',
      label: 'Complex data structure for integrity testing',
      color: 'cartesian'
    };
    
    const base = { dimension: 0, generator: baseGen };
    const level1 = { dimension: 1, source: base, cospans: [] };
    const level2 = { dimension: 2, source: level1, cospans: [] };
    
    const uncompressed = encodeDiagram(level2);
    const compressed = compressData(uncompressed);
    const decompressed = decompressData(compressed);
    
    expect(decompressed).toEqual(uncompressed);
  });
});

describe('Compression Performance', () => {
  it('should only compress when beneficial', () => {
    // Small data that won't benefit from compression
    const smallGen: Generator = { id: 'a' };
    const smallData = encodeGenerator(smallGen);
    
    const result = compressData(smallData);
    
    // Implementation should detect when compression isn't beneficial
    // and either return original data or minimal overhead
    expect(result.length).toBeLessThanOrEqual(smallData.length + 10); // Small overhead allowed
  });

  it('should have reasonable compression ratios', () => {
    // Create highly repetitive data
    const repetitiveGen: Generator = {
      id: 'repetitive',
      label: 'AAAAAAAA'.repeat(100), // 800 A's
      color: 'cartesian'
    };
    
    const uncompressed = encodeGenerator(repetitiveGen);
    const compressed = compressData(uncompressed);
    
    const compressionRatio = compressed.length / uncompressed.length;
    
    // Should achieve at least 50% compression on highly repetitive data
    expect(compressionRatio).toBeLessThan(0.5);
  });

  it('should handle compression of empty data', () => {
    const emptyData = new Uint8Array(0);
    
    expect(() => compressData(emptyData)).not.toThrow();
    
    const compressed = compressData(emptyData);
    const decompressed = decompressData(compressed);
    
    expect(decompressed).toEqual(emptyData);
  });
});

describe('Error Handling', () => {
  it('should handle invalid compressed data', () => {
    const invalidData = new Uint8Array([0xFF, 0xFE, 0xFD, 0xFC]);
    
    expect(() => decompressData(invalidData)).toThrow();
  });

  it('should handle null/undefined input', () => {
    expect(() => compressData(null as any)).toThrow();
    expect(() => compressData(undefined as any)).toThrow();
    expect(() => decompressData(null as any)).toThrow();
    expect(() => decompressData(undefined as any)).toThrow();
  });
});