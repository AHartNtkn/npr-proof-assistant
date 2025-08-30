/**
 * Tests for binary format specification and utilities
 */

import { describe, it, expect } from 'vitest';
import {
  BINARY_FORMAT_VERSION,
  MAGIC_BYTES,
  TypeCode,
  ColorCode,
  FormatFlags,
  validateBinaryHeader,
  createBinaryHeader,
  BinaryWriter,
  BinaryReader,
} from '../binary-format';

describe('Binary Format Constants', () => {
  it('should have correct magic bytes', () => {
    expect(MAGIC_BYTES).toEqual(new Uint8Array([0x4E, 0x50, 0x52, 0x01]));
    expect(MAGIC_BYTES.length).toBe(4);
  });

  it('should have version 1', () => {
    expect(BINARY_FORMAT_VERSION).toBe(1);
  });

  it('should have complete type codes', () => {
    expect(TypeCode.GENERATOR).toBe(0x10);
    expect(TypeCode.DIAGRAM_0D).toBe(0x20);
    expect(TypeCode.DIAGRAM_ND).toBe(0x21);
    expect(TypeCode.REWRITE_0D).toBe(0x30);
    expect(TypeCode.REWRITE_1D_IDENTITY).toBe(0x31);
    expect(TypeCode.REWRITE_ND).toBe(0x32);
    expect(TypeCode.COSPAN).toBe(0x40);
    expect(TypeCode.CONE).toBe(0x50);
  });

  it('should have color codes', () => {
    expect(ColorCode.NONE).toBe(0x00);
    expect(ColorCode.CARTESIAN).toBe(0x01);
    expect(ColorCode.COCARTESIAN).toBe(0x02);
  });
});

describe('Binary Header', () => {
  it('should create valid binary header', () => {
    const header = createBinaryHeader(1024, FormatFlags.NONE);
    
    expect(header.length).toBe(10);
    expect(header.slice(0, 4)).toEqual(MAGIC_BYTES);
    expect(header[4]).toBe(BINARY_FORMAT_VERSION);
    expect(header[5]).toBe(FormatFlags.NONE);
    
    // Check little-endian encoding of size 1024
    const size = header[6] | (header[7] << 8) | (header[8] << 16) | (header[9] << 24);
    expect(size).toBe(1024);
  });

  it('should create compressed header', () => {
    const header = createBinaryHeader(2048, FormatFlags.COMPRESSED);
    
    expect(header[5]).toBe(FormatFlags.COMPRESSED);
    
    const size = header[6] | (header[7] << 8) | (header[8] << 16) | (header[9] << 24);
    expect(size).toBe(2048);
  });

  it('should validate correct binary header', () => {
    const header = createBinaryHeader(512);
    const result = validateBinaryHeader(header);
    
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data!.version).toBe(BINARY_FORMAT_VERSION);
    expect(result.data!.flags).toBe(FormatFlags.NONE);
    expect(result.data!.totalSize).toBe(512);
    expect(result.bytesRead).toBe(10);
  });

  it('should reject data too short for header', () => {
    const shortData = new Uint8Array(5);
    const result = validateBinaryHeader(shortData);
    
    expect(result.success).toBe(false);
    expect(result.error).toBe('Data too short for header');
  });

  it('should reject invalid magic bytes', () => {
    const invalidHeader = new Uint8Array(12);
    invalidHeader.set([0x42, 0x41, 0x44, 0x21], 0); // Wrong magic
    invalidHeader[4] = BINARY_FORMAT_VERSION;
    
    const result = validateBinaryHeader(invalidHeader);
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('Invalid magic bytes');
  });

  it('should reject unsupported version', () => {
    const header = new Uint8Array(10);
    header.set(MAGIC_BYTES, 0); // Set correct magic bytes
    header[4] = 99; // Wrong version
    header[5] = 0;  // Flags
    // Set data size to 100
    header[6] = 100;
    header[7] = 0;
    header[8] = 0;
    header[9] = 0;
    
    const result = validateBinaryHeader(header);
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('Unsupported version 99');
  });
});

describe('BinaryWriter', () => {
  it('should write bytes correctly', () => {
    const writer = new BinaryWriter();
    writer.writeByte(0x42);
    writer.writeByte(0x43);
    
    const result = writer.toUint8Array();
    expect(result).toEqual(new Uint8Array([0x42, 0x43]));
    expect(writer.size).toBe(2);
  });

  it('should write byte arrays', () => {
    const writer = new BinaryWriter();
    writer.writeBytes(new Uint8Array([0x01, 0x02, 0x03]));
    
    const result = writer.toUint8Array();
    expect(result).toEqual(new Uint8Array([0x01, 0x02, 0x03]));
  });

  it('should write uint32 in little-endian', () => {
    const writer = new BinaryWriter();
    writer.writeUint32(0x12345678);
    
    const result = writer.toUint8Array();
    expect(result).toEqual(new Uint8Array([0x78, 0x56, 0x34, 0x12]));
  });

  it('should write short strings', () => {
    const writer = new BinaryWriter();
    writer.writeString('NPR');
    
    const result = writer.toUint8Array();
    expect(result[0]).toBe(TypeCode.STRING_SHORT);
    expect(result[1]).toBe(3); // Length
    const expected = new TextEncoder().encode('NPR');
    const actual = result.slice(2);
    expect(Array.from(actual)).toEqual(Array.from(expected));
  });

  it('should write long strings', () => {
    const writer = new BinaryWriter();
    const longString = 'x'.repeat(300); // > 255 chars
    writer.writeString(longString);
    
    const result = writer.toUint8Array();
    expect(result[0]).toBe(TypeCode.STRING_LONG);
    // Check little-endian length encoding
    const length = result[1] | (result[2] << 8) | (result[3] << 16) | (result[4] << 24);
    expect(length).toBe(300);
  });

  it('should write array lengths', () => {
    const writer = new BinaryWriter();
    
    writer.writeArrayLength(0);
    writer.writeArrayLength(100);
    writer.writeArrayLength(1000);
    
    const result = writer.toUint8Array();
    expect(result[0]).toBe(TypeCode.ARRAY_EMPTY);
    expect(result[1]).toBe(TypeCode.ARRAY_SHORT);
    expect(result[2]).toBe(100);
    expect(result[3]).toBe(TypeCode.ARRAY_LONG);
  });
});

describe('BinaryReader', () => {
  it('should read bytes correctly', () => {
    const data = new Uint8Array([0x42, 0x43, 0x44]);
    const reader = new BinaryReader(data);
    
    expect(reader.readByte()).toBe(0x42);
    expect(reader.readByte()).toBe(0x43);
    expect(reader.readByte()).toBe(0x44);
    expect(reader.hasMore).toBe(false);
  });

  it('should read byte arrays', () => {
    const data = new Uint8Array([0x01, 0x02, 0x03, 0x04]);
    const reader = new BinaryReader(data);
    
    const result = reader.readBytes(3);
    expect(result).toEqual(new Uint8Array([0x01, 0x02, 0x03]));
    expect(reader.remainingBytes).toBe(1);
  });

  it('should read uint32 from little-endian', () => {
    const data = new Uint8Array([0x78, 0x56, 0x34, 0x12]);
    const reader = new BinaryReader(data);
    
    const result = reader.readUint32();
    expect(result).toBe(0x12345678);
  });

  it('should read short strings', () => {
    const writer = new BinaryWriter();
    writer.writeString('NPR');
    const data = writer.toUint8Array();
    
    const reader = new BinaryReader(data);
    reader.position = 0; // Reset position since BinaryReader doesn't track this automatically
    
    const result = reader.readString();
    expect(result).toBe('NPR');
  });

  it('should read array lengths', () => {
    const writer = new BinaryWriter();
    writer.writeArrayLength(0);
    writer.writeArrayLength(100);
    writer.writeArrayLength(1000);
    const data = writer.toUint8Array();
    
    const reader = new BinaryReader(data);
    
    expect(reader.readArrayLength()).toBe(0);
    expect(reader.readArrayLength()).toBe(100);
    expect(reader.readArrayLength()).toBe(1000);
  });

  it('should throw on unexpected end of data', () => {
    const data = new Uint8Array([0x42]);
    const reader = new BinaryReader(data);
    
    reader.readByte(); // Consume the only byte
    expect(() => reader.readByte()).toThrow('Unexpected end of data');
  });

  it('should throw on invalid string type code', () => {
    const data = new Uint8Array([0xFF]); // Invalid type code
    const reader = new BinaryReader(data);
    
    expect(() => reader.readString()).toThrow('Expected string type code');
  });

  it('should throw on invalid array length type code', () => {
    const data = new Uint8Array([0xFF]); // Invalid type code
    const reader = new BinaryReader(data);
    
    expect(() => reader.readArrayLength()).toThrow('Expected array length type code');
  });
});

describe('Round-trip Binary I/O', () => {
  it('should round-trip various data types', () => {
    const writer = new BinaryWriter();
    
    // Write test data
    writer.writeByte(TypeCode.GENERATOR);
    writer.writeString('test-gen');
    writer.writeUint32(42);
    writer.writeArrayLength(3);
    
    // Read back
    const data = writer.toUint8Array();
    const reader = new BinaryReader(data);
    
    expect(reader.readByte()).toBe(TypeCode.GENERATOR);
    expect(reader.readString()).toBe('test-gen');
    expect(reader.readUint32()).toBe(42);
    expect(reader.readArrayLength()).toBe(3);
    expect(reader.hasMore).toBe(false);
  });
});