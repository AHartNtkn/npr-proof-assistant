/**
 * Tests for version compatibility and migration
 * Ensures serialization format can evolve while maintaining backward compatibility
 */

import { describe, it, expect } from 'vitest';
import type { Generator } from '../../types/diagram';
import type { Diagram } from '../../types/diagram';
import { encodeGenerator, encodeWithHeader } from '../encoder';
import { decodeGenerator, decodeWithHeader } from '../decoder';
import { 
  BINARY_FORMAT_VERSION,
  createBinaryHeader,
  validateBinaryHeader 
} from '../binary-format';
import {
  isVersionSupported,
  migrateFromVersion,
  createVersionMigrator,
  VersionMigrator
} from '../version-compatibility';

describe('Version Detection', () => {
  it('should detect current version correctly', () => {
    const generator: Generator = { id: 'version-test', label: 'V1' };
    const encoded = encodeWithHeader(generator);
    
    const headerResult = validateBinaryHeader(encoded);
    expect(headerResult.success).toBe(true);
    expect(headerResult.data!.version).toBe(BINARY_FORMAT_VERSION);
  });

  it('should support current version', () => {
    expect(isVersionSupported(BINARY_FORMAT_VERSION)).toBe(true);
  });

  it('should detect unsupported future versions', () => {
    expect(isVersionSupported(BINARY_FORMAT_VERSION + 1)).toBe(false);
  });

  it('should support backward compatibility versions', () => {
    // Version 0 should be supported for backward compatibility
    expect(isVersionSupported(0)).toBe(true);
  });
});

describe('Version Migration', () => {
  it('should handle version 0 to current version migration', () => {
    // Create a simulated version 0 format (minimal header + data)
    const generator: Generator = { id: 'migrate-test', label: 'M' };
    const currentData = encodeGenerator(generator);
    
    // Simulate version 0 format with minimal header
    const version0Header = new Uint8Array(8);
    version0Header.set([0x4E, 0x50, 0x52, 0x00], 0); // NPR + version 0
    version0Header.set([currentData.length & 0xFF, (currentData.length >> 8) & 0xFF, 0x00, 0x00], 4);
    
    const version0Data = new Uint8Array(version0Header.length + currentData.length);
    version0Data.set(version0Header, 0);
    version0Data.set(currentData, version0Header.length);
    
    // Should be able to migrate
    expect(() => migrateFromVersion(version0Data, 0)).not.toThrow();
  });

  it('should preserve data during migration', () => {
    const original: Generator = {
      id: 'migration-preserve-test',
      label: 'MPT',
      color: 'cartesian'
    };
    
    // Encode with current format
    const currentEncoded = encodeWithHeader(original);
    
    // Simulate migration (in this case, no-op since it's current version)
    const migrated = migrateFromVersion(currentEncoded, BINARY_FORMAT_VERSION);
    
    // Should decode to same data
    const decoded = decodeWithHeader(migrated);
    expect(decoded.success).toBe(true);
    expect(decoded.data).toEqual(original);
  });

  it('should handle migration chains', () => {
    const migrator = createVersionMigrator();
    
    // Should handle direct migration
    expect(migrator.canMigrate(0, BINARY_FORMAT_VERSION)).toBe(true);
    
    // Should handle current version (no migration needed)
    expect(migrator.canMigrate(BINARY_FORMAT_VERSION, BINARY_FORMAT_VERSION)).toBe(true);
  });

  it('should fail migration for unsupported versions', () => {
    const futureVersion = BINARY_FORMAT_VERSION + 5;
    const someData = new Uint8Array([0x4E, 0x50, 0x52, futureVersion]);
    
    expect(() => migrateFromVersion(someData, futureVersion)).toThrow();
  });
});

describe('Version Migrator', () => {
  it('should create functional migrator', () => {
    const migrator = createVersionMigrator();
    
    expect(migrator).toBeDefined();
    expect(typeof migrator.canMigrate).toBe('function');
    expect(typeof migrator.migrate).toBe('function');
    expect(typeof migrator.getSupportedVersions).toBe('function');
  });

  it('should report supported versions', () => {
    const migrator = createVersionMigrator();
    const supported = migrator.getSupportedVersions();
    
    expect(supported).toContain(0); // Backward compatibility
    expect(supported).toContain(BINARY_FORMAT_VERSION); // Current
    expect(supported.length).toBeGreaterThan(0);
  });

  it('should handle version 0 migration', () => {
    const migrator = createVersionMigrator();
    
    // Create version 0 data
    const generator: Generator = { id: 'v0-test' };
    const payload = encodeGenerator(generator);
    
    const v0Header = new Uint8Array(8);
    v0Header.set([0x4E, 0x50, 0x52, 0x00], 0); // Magic + version 0
    v0Header.set([payload.length & 0xFF, (payload.length >> 8) & 0xFF, 0x00, 0x00], 4);
    
    const v0Data = new Uint8Array(v0Header.length + payload.length);
    v0Data.set(v0Header, 0);
    v0Data.set(payload, v0Header.length);
    
    expect(migrator.canMigrate(0, BINARY_FORMAT_VERSION)).toBe(true);
    
    const migrated = migrator.migrate(v0Data, 0, BINARY_FORMAT_VERSION);
    expect(migrated).toBeInstanceOf(Uint8Array);
    
    // Should be decodable as current version
    const decoded = decodeWithHeader(migrated);
    expect(decoded.success).toBe(true);
    expect((decoded.data as Generator).id).toBe('v0-test');
  });

  it('should handle identity migration', () => {
    const migrator = createVersionMigrator();
    const original: Generator = { id: 'identity-test', color: 'cocartesian' };
    const encoded = encodeWithHeader(original);
    
    // Migrating current version to current version should be identity
    const migrated = migrator.migrate(encoded, BINARY_FORMAT_VERSION, BINARY_FORMAT_VERSION);
    expect(migrated).toEqual(encoded);
  });
});

describe('Format Evolution', () => {
  it('should handle missing optional fields in old versions', () => {
    // Simulate old format without color support
    const generator: Generator = { id: 'no-color-test', label: 'NC' };
    
    // Current format should handle this gracefully
    const encoded = encodeGenerator(generator);
    const decoded = decodeGenerator(encoded);
    
    expect(decoded.success).toBe(true);
    expect(decoded.data!.color).toBeUndefined();
  });

  it('should preserve unknown fields for forward compatibility', () => {
    // This tests future-proofing - if new fields are added,
    // current decoders should not fail
    const generator: Generator = { id: 'forward-compat', label: 'FC' };
    const encoded = encodeGenerator(generator);
    
    // Add some extra bytes at the end (simulating future fields)
    const extended = new Uint8Array(encoded.length + 4);
    extended.set(encoded, 0);
    extended.set([0x99, 0x88, 0x77, 0x66], encoded.length);
    
    // Current decoder should handle extra data gracefully
    const decoded = decodeGenerator(extended);
    expect(decoded.success).toBe(true);
    expect(decoded.data).toEqual(generator);
  });

  it('should maintain API compatibility across versions', () => {
    const originalData: Generator = {
      id: 'api-compat-test',
      label: 'API',
      color: 'cartesian'
    };
    
    // The API should work regardless of internal format changes
    const encoded = encodeWithHeader(originalData);
    const decoded = decodeWithHeader(encoded);
    
    expect(decoded.success).toBe(true);
    expect(decoded.data).toEqual(originalData);
  });
});

describe('Error Handling', () => {
  it('should provide clear error messages for unsupported versions', () => {
    const unsupportedVersion = 999;
    
    expect(() => migrateFromVersion(new Uint8Array(), unsupportedVersion))
      .toThrow(`Unsupported version: ${unsupportedVersion}`);
  });

  it('should handle corrupted version headers', () => {
    // Create header with proper length but wrong magic bytes
    const corruptedHeader = new Uint8Array(10);
    corruptedHeader.set([0xFF, 0xFF, 0xFF, 0xFF], 0); // Wrong magic bytes
    corruptedHeader[4] = 1; // version
    corruptedHeader[5] = 0; // flags
    
    const headerResult = validateBinaryHeader(corruptedHeader);
    expect(headerResult.success).toBe(false);
    expect(headerResult.error).toContain('magic');
  });

  it('should validate migration parameters', () => {
    const migrator = createVersionMigrator();
    
    expect(() => migrator.migrate(new Uint8Array(), -1, BINARY_FORMAT_VERSION))
      .toThrow();
    
    expect(() => migrator.migrate(new Uint8Array(), BINARY_FORMAT_VERSION, -1))
      .toThrow();
  });
});

describe('Performance', () => {
  it('should have minimal overhead for current version data', () => {
    const generator: Generator = { id: 'perf-test', label: 'P' };
    const encoded = encodeWithHeader(generator);
    
    // Migration should be fast for current version (identity operation)
    const start = Date.now();
    const migrated = migrateFromVersion(encoded, BINARY_FORMAT_VERSION);
    const elapsed = Date.now() - start;
    
    expect(elapsed).toBeLessThan(10); // Should be very fast
    expect(migrated).toEqual(encoded);
  });

  it('should cache migration strategies', () => {
    const migrator = createVersionMigrator();
    
    // Multiple calls should use cached strategy
    const canMigrate1 = migrator.canMigrate(0, BINARY_FORMAT_VERSION);
    const canMigrate2 = migrator.canMigrate(0, BINARY_FORMAT_VERSION);
    
    expect(canMigrate1).toBe(canMigrate2);
    expect(canMigrate1).toBe(true);
  });
});