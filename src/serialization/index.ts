/**
 * NPR Binary Serialization
 * 
 * High-performance binary serialization for Neo-Peircean Relations diagrams.
 * Provides efficient storage and transmission of zigzag data structures.
 * 
 * Features:
 * - Compact binary encoding for all NPR types (Generator, Diagram, Rewrite, Cospan, Cone)
 * - Version compatibility and automatic migration
 * - Round-trip integrity guarantees
 * - Optional compression support (future enhancement)
 * - TypeScript type safety
 * 
 * @example
 * ```typescript
 * import { serialize, deserialize } from '@/serialization';
 * 
 * const diagram = { dimension: 0, generator: { id: 'test' } };
 * const binary = serialize(diagram);
 * const restored = deserialize(binary);
 * ```
 */

// Core encoding/decoding functions
export {
  encodeGenerator,
  encodeDiagram, 
  encodeRewrite,
  encodeCospan,
  encodeCone,
  encodeWithHeader
} from './encoder';

export {
  decodeGenerator,
  decodeDiagram,
  decodeRewrite,
  decodeCospan,
  decodeCone,
  decodeWithHeader
} from './decoder';

// Binary format utilities
export {
  BINARY_FORMAT_VERSION,
  MAGIC_BYTES,
  TypeCode,
  ColorCode,
  FormatFlags,
  BinaryWriter,
  BinaryReader,
  createBinaryHeader,
  validateBinaryHeader
} from './binary-format';

export type {
  BinaryResult,
  BinaryHeader
} from './binary-format';

// Version compatibility
export {
  isVersionSupported,
  migrateFromVersion,
  createVersionMigrator,
  detectVersion,
  autoMigrate,
  validateMigration,
  migrateWithStrategy,
  DEFAULT_MIGRATION_STRATEGY,
  SUPPORTED_VERSIONS
} from './version-compatibility';

export type {
  SupportedVersion,
  VersionMigrator,
  MigrationStrategy
} from './version-compatibility';

// Type imports for convenience
import type { Generator } from '../types/diagram';
import type { Diagram } from '../types/diagram';
import type { Rewrite, Cospan, Cone } from '../types/rewrite';

// Internal imports for implementation
import { BINARY_FORMAT_VERSION, TypeCode, ColorCode, FormatFlags, MAGIC_BYTES } from './binary-format';
import { encodeWithHeader, encodeGenerator, encodeDiagram, encodeRewrite, encodeCospan, encodeCone } from './encoder';
import { decodeWithHeader, decodeGenerator, decodeDiagram, decodeRewrite, decodeCospan, decodeCone } from './decoder';
import { autoMigrate } from './version-compatibility';

/**
 * Union type for all serializable NPR data structures
 */
export type SerializableData = Generator | Diagram | Rewrite | Cospan | Cone;

/**
 * Serialization options
 */
export interface SerializationOptions {
  /** Include binary header with version info (default: true) */
  includeHeader?: boolean;
  /** Validate data before encoding (default: true) */
  validateInput?: boolean;
  /** Compress data if beneficial (default: false) */
  compress?: boolean;
  /** Version to use for encoding (default: current) */
  version?: number;
}

/**
 * Deserialization options  
 */
export interface DeserializationOptions {
  /** Auto-migrate old versions (default: true) */
  autoMigrate?: boolean;
  /** Validate output after decoding (default: true) */
  validateOutput?: boolean;
  /** Allow partial decoding on errors (default: false) */
  allowPartialDecoding?: boolean;
}

/**
 * High-level serialize function with options
 */
export function serialize(
  data: SerializableData,
  options: SerializationOptions = {}
): Uint8Array {
  const opts = {
    includeHeader: true,
    validateInput: true,
    compress: false,
    version: BINARY_FORMAT_VERSION,
    ...options
  };

  // Input validation
  if (opts.validateInput) {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid data: must be a non-null object');
    }
  }

  // Choose encoding function based on data type
  let encoded: Uint8Array;
  
  if (opts.includeHeader) {
    encoded = encodeWithHeader(data);
  } else {
    // Determine data type and encode accordingly
    if ('generator' in data || ('dimension' in data && typeof data.dimension === 'number' && !('target' in data))) {
      // It's a Diagram (has dimension but not target, or has generator)
      encoded = encodeDiagram(data as Diagram);
    } else if ('forward' in data && 'backward' in data) {
      // It's a Cospan
      encoded = encodeCospan(data as Cospan);
    } else if ('index' in data && 'slices' in data) {
      // It's a Cone
      encoded = encodeCone(data as Cone);
    } else if ('cones' in data) {
      // It's a RewriteN
      encoded = encodeRewrite(data as Rewrite);
    } else if ('identity' in data) {
      // It's a RewriteI
      encoded = encodeRewrite(data as Rewrite);
    } else if ('source' in data && 'target' in data) {
      // It's a Rewrite0  
      encoded = encodeRewrite(data as Rewrite);
    } else {
      // It's a Generator
      encoded = encodeGenerator(data as Generator);
    }
  }

  // TODO: Compression support
  // if (opts.compress) {
  //   encoded = compressData(encoded);
  // }

  return encoded;
}

/**
 * High-level deserialize function with options
 */
export function deserialize<T extends SerializableData = SerializableData>(
  data: Uint8Array,
  options: DeserializationOptions = {}
): T {
  const opts = {
    autoMigrate: true,
    validateOutput: true,
    allowPartialDecoding: false,
    ...options
  };

  if (!data || data.length === 0) {
    throw new Error('Invalid data: empty or null');
  }

  let processedData = data;

  // Auto-migration (only if data looks like it has a header)
  if (opts.autoMigrate && data.length >= 10 && 
      data[0] === MAGIC_BYTES[0] && data[1] === MAGIC_BYTES[1] && 
      data[2] === MAGIC_BYTES[2]) {
    try {
      processedData = autoMigrate(processedData);
    } catch (error) {
      if (!opts.allowPartialDecoding) {
        throw new Error(`Migration failed: ${error}`);
      }
      console.warn('Migration failed, attempting direct decode:', error);
    }
  }

  // Decode with header validation or direct decode
  let result;
  
  // If data has header signature, try header decode
  if (processedData.length >= 10 && 
      processedData[0] === MAGIC_BYTES[0] && 
      processedData[1] === MAGIC_BYTES[1] && 
      processedData[2] === MAGIC_BYTES[2]) {
    result = decodeWithHeader(processedData);
  } else {
    // Try direct decode without header
    result = tryDirectDecode(processedData);
  }
  
  if (!result.success) {
    if (opts.allowPartialDecoding && processedData.length >= 4) {
      console.warn('Primary decode failed, trying fallback:', result.error);
      // Try alternate decoding approach
      const fallbackResult = processedData.length >= 10 ? 
        tryDirectDecode(processedData) : 
        decodeWithHeader(processedData);
        
      if (fallbackResult.success) {
        return fallbackResult.data as T;
      }
    }
    throw new Error(`Deserialization failed: ${result.error}`);
  }

  // Output validation
  if (opts.validateOutput) {
    if (!result.data || typeof result.data !== 'object') {
      throw new Error('Invalid decoded data: not an object');
    }
  }

  return result.data as T;
}

/**
 * Attempts to decode data without header (fallback)
 */
function tryDirectDecode(data: Uint8Array) {
  // Try different decode functions based on first byte (type code)
  const typeCode = data[0];
  
  try {
    switch (typeCode) {
      case TypeCode.GENERATOR:
        return decodeGenerator(data);
      case TypeCode.DIAGRAM_0D:
      case TypeCode.DIAGRAM_ND:
        return decodeDiagram(data);
      case TypeCode.REWRITE_0D:
      case TypeCode.REWRITE_1D_IDENTITY:
      case TypeCode.REWRITE_ND:
        return decodeRewrite(data);
      case TypeCode.COSPAN:
        return decodeCospan(data);
      case TypeCode.CONE:
        return decodeCone(data);
      default:
        return { success: false, error: `Unknown type code: ${typeCode}` };
    }
  } catch (error) {
    return { success: false, error: `Direct decode failed: ${error}` };
  }
}

/**
 * Utility function to estimate serialized size
 */
export function estimateSize(data: SerializableData): number {
  try {
    return serialize(data, { includeHeader: false }).length;
  } catch {
    return -1; // Error estimating
  }
}

/**
 * Utility function to validate serializable data
 */
export function isSerializable(data: any): data is SerializableData {
  if (!data || typeof data !== 'object') {
    return false;
  }

  // Check for Generator structure
  if ('id' in data && typeof data.id === 'string') {
    return true; // Likely a Generator
  }

  // Check for Diagram structure
  if ('dimension' in data && typeof data.dimension === 'number') {
    return true; // Likely a Diagram
  }

  // Check for Rewrite structures
  if ('identity' in data || 'cones' in data || 
      ('source' in data && 'target' in data)) {
    return true; // Likely a Rewrite
  }

  // Check for Cospan structure
  if ('forward' in data && 'backward' in data) {
    return true; // Likely a Cospan
  }

  // Check for Cone structure
  if ('index' in data && 'slices' in data) {
    return true; // Likely a Cone
  }

  return false;
}

/**
 * Utility to check if data is already serialized (binary)
 */
export function isSerialized(data: any): data is Uint8Array {
  return data instanceof Uint8Array && data.length > 0;
}

/**
 * Batch serialization for multiple items
 */
export function serializeBatch(
  items: SerializableData[],
  options: SerializationOptions = {}
): Uint8Array {
  const serialized = items.map(item => serialize(item, options));
  
  // Create batch format: [count:4][size1:4][data1][size2:4][data2]...
  const totalSize = serialized.reduce((sum, data) => sum + 4 + data.length, 4);
  const result = new Uint8Array(totalSize);
  
  let offset = 0;
  
  // Write count
  result[offset++] = items.length & 0xFF;
  result[offset++] = (items.length >> 8) & 0xFF;
  result[offset++] = (items.length >> 16) & 0xFF;
  result[offset++] = (items.length >> 24) & 0xFF;
  
  // Write items
  for (const data of serialized) {
    // Write size
    result[offset++] = data.length & 0xFF;
    result[offset++] = (data.length >> 8) & 0xFF;
    result[offset++] = (data.length >> 16) & 0xFF;
    result[offset++] = (data.length >> 24) & 0xFF;
    
    // Write data
    result.set(data, offset);
    offset += data.length;
  }
  
  return result;
}

/**
 * Batch deserialization for multiple items
 */
export function deserializeBatch<T extends SerializableData = SerializableData>(
  data: Uint8Array,
  options: DeserializationOptions = {}
): T[] {
  if (data.length < 4) {
    throw new Error('Batch data too short');
  }
  
  let offset = 0;
  
  // Read count
  const count = data[offset++] | (data[offset++] << 8) | (data[offset++] << 16) | (data[offset++] << 24);
  
  const results: T[] = [];
  
  for (let i = 0; i < count; i++) {
    if (offset + 4 > data.length) {
      throw new Error(`Batch item ${i}: insufficient data for size`);
    }
    
    // Read size
    const size = data[offset++] | (data[offset++] << 8) | (data[offset++] << 16) | (data[offset++] << 24);
    
    if (offset + size > data.length) {
      throw new Error(`Batch item ${i}: insufficient data for payload`);
    }
    
    // Read and deserialize item
    const itemData = data.slice(offset, offset + size);
    const item = deserialize<T>(itemData, options);
    results.push(item);
    
    offset += size;
  }
  
  return results;
}