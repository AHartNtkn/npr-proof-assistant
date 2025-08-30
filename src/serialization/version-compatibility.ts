/**
 * Version compatibility and migration support for NPR binary format
 * Handles backward compatibility and format evolution
 */

import { 
  BINARY_FORMAT_VERSION, 
  MAGIC_BYTES,
  createBinaryHeader,
  validateBinaryHeader,
  FormatFlags
} from './binary-format';

/**
 * Supported version numbers for backward compatibility
 */
export const SUPPORTED_VERSIONS = [0, 1] as const;

/**
 * Type for supported version numbers
 */
export type SupportedVersion = typeof SUPPORTED_VERSIONS[number];

/**
 * Version migration function signature
 */
export type MigrationFunction = (data: Uint8Array) => Uint8Array;

/**
 * Version migrator interface
 */
export interface VersionMigrator {
  canMigrate(fromVersion: number, toVersion: number): boolean;
  migrate(data: Uint8Array, fromVersion: number, toVersion: number): Uint8Array;
  getSupportedVersions(): number[];
}

/**
 * Checks if a version is supported
 */
export function isVersionSupported(version: number): boolean {
  return SUPPORTED_VERSIONS.includes(version as SupportedVersion);
}

/**
 * Migrates data from an old version to the current version
 */
export function migrateFromVersion(data: Uint8Array, fromVersion: number): Uint8Array {
  if (!isVersionSupported(fromVersion)) {
    throw new Error(`Unsupported version: ${fromVersion}`);
  }

  // Current version needs no migration
  if (fromVersion === BINARY_FORMAT_VERSION) {
    return data;
  }

  // Migrate from version 0 to current
  if (fromVersion === 0) {
    return migrateFromV0(data);
  }

  throw new Error(`No migration path from version ${fromVersion} to ${BINARY_FORMAT_VERSION}`);
}

/**
 * Migrates data from version 0 to current version
 */
function migrateFromV0(data: Uint8Array): Uint8Array {
  if (data.length < 8) {
    throw new Error('Version 0 data too short');
  }

  // Version 0 format: [NPR\x00][size:4][payload]
  // Check magic bytes (first 3 bytes should be NPR, 4th should be 0)
  if (data[0] !== MAGIC_BYTES[0] || 
      data[1] !== MAGIC_BYTES[1] || 
      data[2] !== MAGIC_BYTES[2] || 
      data[3] !== 0) {
    throw new Error('Invalid version 0 format');
  }

  // Extract size (little-endian, 4 bytes)
  const payloadSize = data[4] | (data[5] << 8) | (data[6] << 16) | (data[7] << 24);
  
  if (data.length < 8 + payloadSize) {
    throw new Error('Version 0 data truncated');
  }

  // Extract payload
  const payload = data.slice(8, 8 + payloadSize);

  // Create current version header
  const currentHeader = createBinaryHeader(payload.length, FormatFlags.NONE);

  // Combine new header with old payload
  const result = new Uint8Array(currentHeader.length + payload.length);
  result.set(currentHeader, 0);
  result.set(payload, currentHeader.length);

  return result;
}

/**
 * Creates a version migrator with full functionality
 */
export function createVersionMigrator(): VersionMigrator {
  const migrations = new Map<string, MigrationFunction>();
  
  // Register migration from version 0 to current
  const v0Key = `0->${BINARY_FORMAT_VERSION}`;
  migrations.set(v0Key, migrateFromV0);

  return {
    canMigrate(fromVersion: number, toVersion: number): boolean {
      // Identity migration always possible
      if (fromVersion === toVersion) {
        return true;
      }

      // Check if both versions are supported
      if (!isVersionSupported(fromVersion) || !isVersionSupported(toVersion)) {
        return false;
      }

      // For now, only support migration to current version
      if (toVersion !== BINARY_FORMAT_VERSION) {
        return false;
      }

      // Check if migration function exists
      const key = `${fromVersion}->${toVersion}`;
      return migrations.has(key) || fromVersion === toVersion;
    },

    migrate(data: Uint8Array, fromVersion: number, toVersion: number): Uint8Array {
      if (fromVersion < 0 || toVersion < 0) {
        throw new Error('Version numbers must be non-negative');
      }

      // Identity migration
      if (fromVersion === toVersion) {
        return data;
      }

      if (!this.canMigrate(fromVersion, toVersion)) {
        throw new Error(`Cannot migrate from version ${fromVersion} to ${toVersion}`);
      }

      const key = `${fromVersion}->${toVersion}`;
      const migrationFn = migrations.get(key);
      
      if (!migrationFn) {
        throw new Error(`Migration function not found for ${key}`);
      }

      return migrationFn(data);
    },

    getSupportedVersions(): number[] {
      return [...SUPPORTED_VERSIONS];
    }
  };
}

/**
 * Detects the version of binary data
 */
export function detectVersion(data: Uint8Array): number {
  if (data.length < 4) {
    throw new Error('Data too short to detect version');
  }

  // Check for current format magic bytes
  if (data[0] === MAGIC_BYTES[0] && 
      data[1] === MAGIC_BYTES[1] && 
      data[2] === MAGIC_BYTES[2]) {
    
    if (data[3] === MAGIC_BYTES[3]) {
      // Current format: NPR\x01
      if (data.length >= 5) {
        return data[4]; // Version byte
      }
    } else if (data[3] === 0x00) {
      // Version 0 format: NPR\x00
      return 0;
    }
  }

  throw new Error('Unknown or corrupted data format');
}

/**
 * Auto-migrates data to current version if needed
 */
export function autoMigrate(data: Uint8Array): Uint8Array {
  const version = detectVersion(data);
  
  if (version === BINARY_FORMAT_VERSION) {
    return data; // Already current version
  }

  return migrateFromVersion(data, version);
}

/**
 * Validates that data can be safely migrated
 */
export function validateMigration(data: Uint8Array): boolean {
  try {
    const version = detectVersion(data);
    return isVersionSupported(version);
  } catch {
    return false;
  }
}

/**
 * Migration strategy configuration
 */
export interface MigrationStrategy {
  preserveUnknownFields: boolean;
  validateAfterMigration: boolean;
  allowDataLoss: boolean;
}

/**
 * Default migration strategy
 */
export const DEFAULT_MIGRATION_STRATEGY: MigrationStrategy = {
  preserveUnknownFields: true,
  validateAfterMigration: true,  
  allowDataLoss: false
};

/**
 * Advanced migration with custom strategy
 */
export function migrateWithStrategy(
  data: Uint8Array, 
  strategy: Partial<MigrationStrategy> = {}
): Uint8Array {
  const fullStrategy = { ...DEFAULT_MIGRATION_STRATEGY, ...strategy };
  
  const version = detectVersion(data);
  
  if (version === BINARY_FORMAT_VERSION) {
    return data;
  }

  const migrated = migrateFromVersion(data, version);

  if (fullStrategy.validateAfterMigration) {
    const validation = validateBinaryHeader(migrated);
    if (!validation.success) {
      throw new Error(`Migration validation failed: ${validation.error}`);
    }
  }

  return migrated;
}