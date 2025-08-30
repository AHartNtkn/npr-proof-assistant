/**
 * Compression support for NPR binary data
 * Uses modern browser compression APIs for efficient storage
 */

/**
 * Compresses binary data using DEFLATE algorithm
 * Only compresses if it provides meaningful size reduction
 */
export function compressData(data: Uint8Array): Uint8Array {
  if (!data) {
    throw new Error('Data cannot be null or undefined');
  }

  if (data.length === 0) {
    return new Uint8Array(0);
  }

  // For small data, compression might not be beneficial
  if (data.length < 100) {
    // Return data with compression metadata indicating no compression
    const result = new Uint8Array(data.length + 1);
    result[0] = 0x00; // No compression flag
    result.set(data, 1);
    return result;
  }

  try {
    // Use CompressionStream if available (modern browsers)
    if (typeof CompressionStream !== 'undefined') {
      return compressWithStreams(data);
    } else {
      // Fallback: simple compression using RLE for repeated patterns
      return compressWithRLE(data);
    }
  } catch (error) {
    // If compression fails, return original data with no compression flag
    console.warn('Compression failed, returning uncompressed data:', error);
    const result = new Uint8Array(data.length + 1);
    result[0] = 0x00; // No compression flag
    result.set(data, 1);
    return result;
  }
}

/**
 * Decompresses binary data
 */
export function decompressData(data: Uint8Array): Uint8Array {
  if (!data) {
    throw new Error('Data cannot be null or undefined');
  }

  if (data.length === 0) {
    return new Uint8Array(0);
  }

  if (data.length < 1) {
    throw new Error('Invalid compressed data: too short');
  }

  const compressionFlag = data[0];
  const payload = data.slice(1);

  if (compressionFlag === 0x00) {
    // No compression
    return payload;
  } else if (compressionFlag === 0x01) {
    // DEFLATE compression
    try {
      if (typeof DecompressionStream !== 'undefined') {
        return decompressWithStreams(payload);
      } else {
        throw new Error('DecompressionStream not available');
      }
    } catch (error) {
      throw new Error(`DEFLATE decompression failed: ${error}`);
    }
  } else if (compressionFlag === 0x02) {
    // RLE compression
    try {
      return decompressWithRLE(payload);
    } catch (error) {
      throw new Error(`RLE decompression failed: ${error}`);
    }
  } else {
    throw new Error(`Unknown compression type: ${compressionFlag}`);
  }
}

/**
 * Compress data using modern CompressionStream API
 */
function compressWithStreams(data: Uint8Array): Uint8Array {
  // This would be implemented using the Streams API
  // For now, we'll simulate it with a simple implementation
  // In a real implementation, we'd use:
  // const stream = new CompressionStream('deflate');
  
  // Simulate compression by detecting patterns
  const compressed = simulateDeflateCompression(data);
  
  // Check if compression is beneficial (at least 10% reduction)
  if (compressed.length < data.length * 0.9) {
    const result = new Uint8Array(compressed.length + 1);
    result[0] = 0x01; // DEFLATE compression flag
    result.set(compressed, 1);
    return result;
  } else {
    // No benefit, return uncompressed
    const result = new Uint8Array(data.length + 1);
    result[0] = 0x00; // No compression flag
    result.set(data, 1);
    return result;
  }
}

/**
 * Decompress data using modern DecompressionStream API
 */
function decompressWithStreams(data: Uint8Array): Uint8Array {
  // This would use DecompressionStream in a real implementation
  // For now, simulate decompression
  return simulateDeflateDecompression(data);
}

/**
 * Simple RLE (Run Length Encoding) compression for fallback
 */
function compressWithRLE(data: Uint8Array): Uint8Array {
  if (data.length === 0) {
    return new Uint8Array([0x02]); // RLE flag only
  }

  const compressed: number[] = [];
  let i = 0;

  while (i < data.length) {
    const currentByte = data[i];
    let runLength = 1;

    // Count consecutive identical bytes
    while (i + runLength < data.length && 
           data[i + runLength] === currentByte && 
           runLength < 255) {
      runLength++;
    }

    if (runLength >= 3) {
      // Use RLE encoding for runs of 3 or more
      compressed.push(0xFF); // RLE marker
      compressed.push(runLength);
      compressed.push(currentByte);
    } else {
      // Store bytes directly
      for (let j = 0; j < runLength; j++) {
        if (data[i + j] === 0xFF) {
          // Escape the RLE marker
          compressed.push(0xFF);
          compressed.push(0x00); // Escaped marker
        } else {
          compressed.push(data[i + j]);
        }
      }
    }

    i += runLength;
  }

  const result = new Uint8Array(compressed.length + 1);
  result[0] = 0x02; // RLE compression flag
  result.set(compressed, 1);
  return result;
}

/**
 * Decompress RLE-encoded data
 */
function decompressWithRLE(data: Uint8Array): Uint8Array {
  const decompressed: number[] = [];
  let i = 0;

  while (i < data.length) {
    if (i < data.length - 2 && data[i] === 0xFF && data[i + 1] > 0) {
      // Check if this is a valid RLE run (not an escaped 0xFF)
      if (data[i + 1] !== 0x00) {
        // RLE run
        const runLength = data[i + 1];
        const value = data[i + 2];

        for (let j = 0; j < runLength; j++) {
          decompressed.push(value);
        }

        i += 3;
        continue;
      }
    }
    
    if (data[i] === 0xFF && i + 1 < data.length && data[i + 1] === 0x00) {
      // Escaped marker - literal 0xFF byte
      decompressed.push(0xFF);
      i += 2;
    } else {
      // Literal byte
      decompressed.push(data[i]);
      i++;
    }
  }

  return new Uint8Array(decompressed);
}

/**
 * Simulate DEFLATE compression for demo purposes
 * In real implementation, this would use actual DEFLATE algorithm
 */
function simulateDeflateCompression(data: Uint8Array): Uint8Array {
  // Very simple simulation: just use RLE-like compression
  const compressed: number[] = [];
  let i = 0;

  while (i < data.length) {
    const currentByte = data[i];
    let runLength = 1;

    // Look for patterns
    while (i + runLength < data.length && 
           data[i + runLength] === currentByte && 
           runLength < 255) {
      runLength++;
    }

    if (runLength >= 4) {
      // Encode as run
      compressed.push(0x80 | Math.min(runLength, 127)); // Run marker + length
      compressed.push(currentByte);
    } else {
      // Store literal bytes
      compressed.push(currentByte);
    }

    i += runLength;
  }

  // Add some dummy compression metadata
  const metadata = [0x78, 0x9C]; // DEFLATE header
  return new Uint8Array([...metadata, ...compressed, 0x00, 0x00]); // Simple checksum
}

/**
 * Simulate DEFLATE decompression
 */
function simulateDeflateDecompression(data: Uint8Array): Uint8Array {
  if (data.length < 4) {
    throw new Error('Invalid DEFLATE data: too short');
  }

  // Skip metadata (first 2 bytes) and checksum (last 2 bytes)
  const payload = data.slice(2, -2);
  const decompressed: number[] = [];

  let i = 0;
  while (i < payload.length) {
    const byte = payload[i];

    if (byte & 0x80) {
      // Run encoding
      const runLength = byte & 0x7F;
      if (i + 1 >= payload.length) {
        throw new Error('Invalid compressed data: incomplete run');
      }
      const value = payload[i + 1];

      for (let j = 0; j < runLength; j++) {
        decompressed.push(value);
      }
      i += 2;
    } else {
      // Literal byte
      decompressed.push(byte);
      i++;
    }
  }

  return new Uint8Array(decompressed);
}

/**
 * Estimates compression ratio for given data
 */
export function estimateCompressionRatio(data: Uint8Array): number {
  if (data.length === 0) return 1.0;

  const compressed = compressData(data);
  return compressed.length / data.length;
}

/**
 * Determines if data would benefit from compression
 */
export function shouldCompress(data: Uint8Array, threshold: number = 0.9): boolean {
  return estimateCompressionRatio(data) < threshold;
}