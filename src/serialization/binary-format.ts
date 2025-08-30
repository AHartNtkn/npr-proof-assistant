/**
 * Binary serialization format specification for NPR diagrams
 * Efficient compact format for storing zigzag structures
 */

/**
 * Binary format version for compatibility tracking
 */
export const BINARY_FORMAT_VERSION = 1;

/**
 * Magic bytes to identify NPR binary format: 'NPR\x01'
 */
export const MAGIC_BYTES = new Uint8Array([0x4E, 0x50, 0x52, 0x01]);

/**
 * Type codes for different data structures
 */
export enum TypeCode {
  // Basic types
  GENERATOR = 0x10,
  DIAGRAM_0D = 0x20,
  DIAGRAM_ND = 0x21,
  
  // Rewrite types
  REWRITE_0D = 0x30,
  REWRITE_1D_IDENTITY = 0x31,
  REWRITE_ND = 0x32,
  
  // Cospan and Cone types
  COSPAN = 0x40,
  CONE = 0x50,
  
  // String types
  STRING_SHORT = 0x60,  // Length <= 255
  STRING_LONG = 0x61,   // Length > 255
  
  // Array types
  ARRAY_EMPTY = 0x70,
  ARRAY_SHORT = 0x71,   // Length <= 255  
  ARRAY_LONG = 0x72,    // Length > 255
  
  // Special values
  NULL = 0x00,
  UNDEFINED = 0x01,
}

/**
 * Color codes for generator colors
 */
export enum ColorCode {
  NONE = 0x00,
  CARTESIAN = 0x01,
  COCARTESIAN = 0x02,
}

/**
 * Binary format header structure
 */
export interface BinaryHeader {
  magic: Uint8Array;      // Magic bytes for format identification
  version: number;        // Format version
  flags: number;          // Compression and other flags
  totalSize: number;      // Total size of the binary data
}

/**
 * Flags for binary format options
 */
export enum FormatFlags {
  NONE = 0x00,
  COMPRESSED = 0x01,      // Data is compressed
  CHECKSUMMED = 0x02,     // Data includes checksum
}

/**
 * Binary format encoding/decoding result
 */
export interface BinaryResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  bytesRead?: number;
  bytesWritten?: number;
}

/**
 * Validates magic bytes and version of binary data
 */
export function validateBinaryHeader(data: Uint8Array): BinaryResult<BinaryHeader> {
  if (data.length < 10) {
    return {
      success: false,
      error: 'Data too short for header'
    };
  }
  
  // Check magic bytes
  for (let i = 0; i < MAGIC_BYTES.length; i++) {
    if (data[i] !== MAGIC_BYTES[i]) {
      return {
        success: false,
        error: `Invalid magic bytes at position ${i}`
      };
    }
  }
  
  // Read version (1 byte at offset 4)
  const version = data[4];
  if (version !== BINARY_FORMAT_VERSION) {
    return {
      success: false,
      error: `Unsupported version ${version}, expected ${BINARY_FORMAT_VERSION}`
    };
  }
  
  // Read flags (1 byte at offset 5)
  const flags = data[5];
  
  // Read total size (4 bytes at offset 6-9, little-endian)
  const totalSize = (data[6]) | (data[7] << 8) | (data[8] << 16) | (data[9] << 24);
  
  return {
    success: true,
    data: {
      magic: data.slice(0, 4),
      version,
      flags,
      totalSize
    },
    bytesRead: 10
  };
}

/**
 * Creates a binary header for the given data size
 */
export function createBinaryHeader(dataSize: number, flags: FormatFlags = FormatFlags.NONE): Uint8Array {
  const header = new Uint8Array(10);
  
  // Magic bytes
  header.set(MAGIC_BYTES, 0);
  
  // Version
  header[4] = BINARY_FORMAT_VERSION;
  
  // Flags
  header[5] = flags;
  
  // Total size (little-endian)
  header[6] = dataSize & 0xFF;
  header[7] = (dataSize >> 8) & 0xFF;
  header[8] = (dataSize >> 16) & 0xFF;
  header[9] = (dataSize >> 24) & 0xFF;
  
  return header;
}

/**
 * Utility class for writing binary data
 */
export class BinaryWriter {
  private buffer: number[] = [];
  
  writeByte(value: number): void {
    this.buffer.push(value & 0xFF);
  }
  
  writeBytes(bytes: Uint8Array): void {
    for (const byte of bytes) {
      this.buffer.push(byte);
    }
  }
  
  writeUint32(value: number): void {
    this.buffer.push(value & 0xFF);
    this.buffer.push((value >> 8) & 0xFF);
    this.buffer.push((value >> 16) & 0xFF);
    this.buffer.push((value >> 24) & 0xFF);
  }
  
  writeString(str: string): void {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(str);
    
    if (bytes.length <= 255) {
      this.writeByte(TypeCode.STRING_SHORT);
      this.writeByte(bytes.length);
    } else {
      this.writeByte(TypeCode.STRING_LONG);
      this.writeUint32(bytes.length);
    }
    this.writeBytes(bytes);
  }
  
  writeArrayLength(length: number): void {
    if (length === 0) {
      this.writeByte(TypeCode.ARRAY_EMPTY);
    } else if (length <= 255) {
      this.writeByte(TypeCode.ARRAY_SHORT);
      this.writeByte(length);
    } else {
      this.writeByte(TypeCode.ARRAY_LONG);
      this.writeUint32(length);
    }
  }
  
  toUint8Array(): Uint8Array {
    return new Uint8Array(this.buffer);
  }
  
  get size(): number {
    return this.buffer.length;
  }
}

/**
 * Utility class for reading binary data
 */
export class BinaryReader {
  private data: Uint8Array;
  private position: number = 0;
  
  constructor(data: Uint8Array) {
    this.data = data;
  }
  
  readByte(): number {
    if (this.position >= this.data.length) {
      throw new Error('Unexpected end of data');
    }
    return this.data[this.position++];
  }
  
  readBytes(length: number): Uint8Array {
    if (this.position + length > this.data.length) {
      throw new Error('Unexpected end of data');
    }
    const result = this.data.slice(this.position, this.position + length);
    this.position += length;
    return result;
  }
  
  readUint32(): number {
    const b1 = this.readByte();
    const b2 = this.readByte();
    const b3 = this.readByte();
    const b4 = this.readByte();
    return b1 | (b2 << 8) | (b3 << 16) | (b4 << 24);
  }
  
  readString(): string {
    const typeCode = this.readByte();
    let length: number;
    
    if (typeCode === TypeCode.STRING_SHORT) {
      length = this.readByte();
    } else if (typeCode === TypeCode.STRING_LONG) {
      length = this.readUint32();
    } else {
      throw new Error(`Expected string type code, got ${typeCode}`);
    }
    
    const bytes = this.readBytes(length);
    const decoder = new TextDecoder();
    return decoder.decode(bytes);
  }
  
  readArrayLength(): number {
    const typeCode = this.readByte();
    
    if (typeCode === TypeCode.ARRAY_EMPTY) {
      return 0;
    } else if (typeCode === TypeCode.ARRAY_SHORT) {
      return this.readByte();
    } else if (typeCode === TypeCode.ARRAY_LONG) {
      return this.readUint32();
    } else {
      throw new Error(`Expected array length type code, got ${typeCode}`);
    }
  }
  
  get currentPosition(): number {
    return this.position;
  }
  
  get hasMore(): boolean {
    return this.position < this.data.length;
  }
  
  get remainingBytes(): number {
    return this.data.length - this.position;
  }
}