/**
 * Tests for the public serialization API
 */

import { describe, it, expect } from 'vitest';
import type { Generator } from '../../types/diagram';
import type { Diagram, Diagram0 } from '../../types/diagram';
import type { Rewrite } from '../../types/rewrite';
import { 
  serialize, 
  deserialize, 
  estimateSize,
  isSerializable,
  isSerialized,
  serializeBatch,
  deserializeBatch
} from '../index';

describe('Public API', () => {
  it('should serialize and deserialize Generator', () => {
    const generator: Generator = {
      id: 'public-api-test',
      label: 'PAT',
      color: 'cartesian'
    };
    
    const serialized = serialize(generator);
    const deserialized = deserialize<Generator>(serialized);
    
    expect(deserialized).toEqual(generator);
  });

  it('should serialize and deserialize Diagram', () => {
    const generator: Generator = { id: 'diagram-test', color: 'cocartesian' };
    const diagram: Diagram0 = { dimension: 0, generator };
    
    const serialized = serialize(diagram);
    const deserialized = deserialize<Diagram>(serialized);
    
    expect(deserialized).toEqual(diagram);
  });

  it('should serialize and deserialize Rewrite', () => {
    const rewrite: Rewrite = { dimension: 1, identity: true };
    
    const serialized = serialize(rewrite);
    const deserialized = deserialize<Rewrite>(serialized);
    
    expect(deserialized).toEqual(rewrite);
  });

  it('should handle serialization options', () => {
    const generator: Generator = { id: 'options-test' };
    
    const withHeader = serialize(generator, { includeHeader: true });
    const withoutHeader = serialize(generator, { includeHeader: false });
    
    expect(withHeader.length).toBeGreaterThan(withoutHeader.length);
    
    // Both should deserialize to same data
    const decoded1 = deserialize(withHeader);
    const decoded2 = deserialize(withoutHeader);
    
    expect(decoded1).toEqual(generator);
    expect(decoded2).toEqual(generator);
  });

  it('should handle deserialization options', () => {
    const generator: Generator = { id: 'deserialize-options-test', label: 'DOT' };
    const serialized = serialize(generator);
    
    // Should work with default options
    const decoded1 = deserialize(serialized);
    expect(decoded1).toEqual(generator);
    
    // Should work with custom options
    const decoded2 = deserialize(serialized, { 
      autoMigrate: true,
      validateOutput: true 
    });
    expect(decoded2).toEqual(generator);
  });
});

describe('Utility Functions', () => {
  it('should estimate serialization size', () => {
    const generator: Generator = { id: 'size-test' };
    const actualSize = serialize(generator, { includeHeader: false }).length;
    const estimatedSize = estimateSize(generator);
    
    expect(estimatedSize).toBe(actualSize);
  });

  it('should check if data is serializable', () => {
    const validGenerator: Generator = { id: 'valid' };
    const invalidData = { invalid: 'not a generator' };
    
    expect(isSerializable(validGenerator)).toBe(true);
    expect(isSerializable(invalidData)).toBe(false);
    expect(isSerializable(null)).toBe(false);
    expect(isSerializable(undefined)).toBe(false);
  });

  it('should check if data is already serialized', () => {
    const generator: Generator = { id: 'serialized-check' };
    const serialized = serialize(generator);
    
    expect(isSerialized(serialized)).toBe(true);
    expect(isSerialized(generator)).toBe(false);
    expect(isSerialized(new Uint8Array(0))).toBe(false); // Empty array
    expect(isSerialized(null)).toBe(false);
    expect(isSerialized("string")).toBe(false);
  });
});

describe('Batch Operations', () => {
  it('should serialize and deserialize batch data', () => {
    const items = [
      { id: 'batch1', label: 'B1' } as Generator,
      { id: 'batch2', color: 'cartesian' } as Generator,
      { id: 'batch3', label: 'B3', color: 'cocartesian' } as Generator
    ];
    
    const serialized = serializeBatch(items);
    const deserialized = deserializeBatch<Generator>(serialized);
    
    expect(deserialized).toEqual(items);
    expect(deserialized.length).toBe(3);
  });

  it('should handle empty batch', () => {
    const emptyBatch: Generator[] = [];
    
    const serialized = serializeBatch(emptyBatch);
    const deserialized = deserializeBatch<Generator>(serialized);
    
    expect(deserialized).toEqual([]);
  });

  it('should handle single item batch', () => {
    const singleItem = [{ id: 'single', label: 'S' } as Generator];
    
    const serialized = serializeBatch(singleItem);
    const deserialized = deserializeBatch<Generator>(serialized);
    
    expect(deserialized).toEqual(singleItem);
  });

  it('should handle mixed types in batch', () => {
    const diagram: Diagram = { dimension: 0, generator: { id: 'mixed-diagram' } };
    const rewrite: Rewrite = { dimension: 1, identity: true };
    const generator: Generator = { id: 'mixed-generator' };
    
    const items = [diagram, rewrite, generator];
    
    const serialized = serializeBatch(items);
    const deserialized = deserializeBatch(serialized);
    
    expect(deserialized).toEqual(items);
  });
});

describe('Error Handling', () => {
  it('should handle serialization errors', () => {
    expect(() => serialize(null as any)).toThrow();
    expect(() => serialize(undefined as any)).toThrow();
  });

  it('should handle deserialization errors', () => {
    const invalidData = new Uint8Array([0xFF, 0xFF, 0xFF]);
    
    expect(() => deserialize(invalidData)).toThrow();
    expect(() => deserialize(new Uint8Array(0))).toThrow();
    expect(() => deserialize(null as any)).toThrow();
  });

  it('should handle batch errors', () => {
    const truncatedBatch = new Uint8Array([0x01, 0x00]); // Claims 1 item but no data
    
    expect(() => deserializeBatch(truncatedBatch)).toThrow();
    expect(() => deserializeBatch(new Uint8Array(0))).toThrow();
  });
});

describe('Performance', () => {
  it('should handle large data efficiently', () => {
    // Create a generator with large strings
    const largeGenerator: Generator = {
      id: 'large-test',
      label: 'Large Label '.repeat(100), // 1300+ chars
      color: 'cartesian'
    };
    
    const start = Date.now();
    const serialized = serialize(largeGenerator);
    const deserialized = deserialize<Generator>(serialized);
    const elapsed = Date.now() - start;
    
    expect(deserialized).toEqual(largeGenerator);
    expect(elapsed).toBeLessThan(50); // Should be fast
  });

  it('should handle many small items efficiently', () => {
    const items = Array.from({ length: 100 }, (_, i) => ({
      id: `item-${i}`,
      label: `Label ${i}`
    } as Generator));
    
    const start = Date.now();
    const serialized = serializeBatch(items);
    const deserialized = deserializeBatch<Generator>(serialized);
    const elapsed = Date.now() - start;
    
    expect(deserialized).toEqual(items);
    expect(elapsed).toBeLessThan(100); // Should be reasonably fast
  });
});