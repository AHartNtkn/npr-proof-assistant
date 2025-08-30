/**
 * Binary decoder for NPR data structures
 * Converts binary format back to zigzag structures
 */

import type { Generator } from '../types/diagram';
import type { Diagram, Diagram0, DiagramN } from '../types/diagram';
import type { Rewrite, Rewrite0, RewriteI, RewriteN, Cospan, Cone } from '../types/rewrite';
import { 
  TypeCode, 
  ColorCode, 
  BinaryReader,
  BinaryResult,
  validateBinaryHeader
} from './binary-format';

/**
 * Decodes a Generator from binary format
 */
export function decodeGenerator(data: Uint8Array): BinaryResult<Generator> {
  if (!data) {
    throw new Error('Data cannot be null or undefined');
  }

  if (data.length === 0) {
    return {
      success: false,
      error: 'Empty data cannot be decoded as Generator'
    };
  }

  try {
    const reader = new BinaryReader(data);
    
    // Read and validate type code
    const typeCode = reader.readByte();
    if (typeCode !== TypeCode.GENERATOR) {
      return {
        success: false,
        error: `Expected Generator type code ${TypeCode.GENERATOR}, got ${typeCode}`
      };
    }
    
    // Read id string
    const id = reader.readString();
    
    // Read label flag
    const hasLabel = reader.readByte();
    let label: string | undefined;
    if (hasLabel === 0x01) {
      label = reader.readString();
    }
    
    // Read color
    const colorCode = reader.readByte();
    let color: 'cartesian' | 'cocartesian' | undefined;
    if (colorCode === ColorCode.CARTESIAN) {
      color = 'cartesian';
    } else if (colorCode === ColorCode.COCARTESIAN) {
      color = 'cocartesian';
    }
    
    const generator: Generator = { id };
    if (label !== undefined) {
      generator.label = label;
    }
    if (color !== undefined) {
      generator.color = color;
    }
    
    return {
      success: true,
      data: generator,
      bytesRead: reader.currentPosition
    };
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown decoding error'
    };
  }
}

/**
 * Decodes a Diagram from binary format
 */
export function decodeDiagram(data: Uint8Array): BinaryResult<Diagram> {
  if (!data) {
    throw new Error('Data cannot be null or undefined');
  }

  if (data.length === 0) {
    return {
      success: false,
      error: 'Empty data cannot be decoded as Diagram'
    };
  }

  try {
    const reader = new BinaryReader(data);
    
    // Read type code
    const typeCode = reader.readByte();
    
    if (typeCode === TypeCode.DIAGRAM_0D) {
      // 0-dimensional diagram
      const dimension = reader.readByte();
      if (dimension !== 0) {
        return {
          success: false,
          error: `Expected dimension 0 for DIAGRAM_0D, got ${dimension}`
        };
      }
      
      // Decode generator - need to extract the generator data
      const remainingData = data.slice(reader.currentPosition);
      const generatorResult = decodeGenerator(remainingData);
      
      if (!generatorResult.success) {
        return {
          success: false,
          error: `Failed to decode generator: ${generatorResult.error}`
        };
      }
      
      const diagram: Diagram0 = {
        dimension: 0,
        generator: generatorResult.data!
      };
      
      return {
        success: true,
        data: diagram,
        bytesRead: reader.currentPosition + (generatorResult.bytesRead || 0)
      };
      
    } else if (typeCode === TypeCode.DIAGRAM_ND) {
      // N-dimensional diagram
      const dimension = reader.readByte();
      if (dimension < 1) {
        return {
          success: false,
          error: `Invalid dimension ${dimension} for DIAGRAM_ND`
        };
      }
      
      // Decode source diagram
      const sourceLength = reader.readUint32();
      const sourceData = reader.readBytes(sourceLength);
      const sourceResult = decodeDiagram(sourceData);
      
      if (!sourceResult.success) {
        return {
          success: false,
          error: `Failed to decode source diagram: ${sourceResult.error}`
        };
      }
      
      // Decode cospans array
      const cospanCount = reader.readArrayLength();
      const cospans: Cospan[] = [];
      
      for (let i = 0; i < cospanCount; i++) {
        const cospanLength = reader.readUint32();
        const cospanData = reader.readBytes(cospanLength);
        const cospanResult = decodeCospan(cospanData);
        
        if (!cospanResult.success) {
          return {
            success: false,
            error: `Failed to decode cospan ${i}: ${cospanResult.error}`
          };
        }
        
        cospans.push(cospanResult.data!);
      }
      
      const diagram: DiagramN = {
        dimension,
        source: sourceResult.data!,
        cospans
      };
      
      return {
        success: true,
        data: diagram,
        bytesRead: reader.currentPosition
      };
      
    } else {
      return {
        success: false,
        error: `Invalid diagram type code: ${typeCode}`
      };
    }
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown decoding error'
    };
  }
}

/**
 * Decodes a Rewrite from binary format
 */
export function decodeRewrite(data: Uint8Array): BinaryResult<Rewrite> {
  if (!data) {
    throw new Error('Data cannot be null or undefined');
  }

  if (data.length === 0) {
    return {
      success: false,
      error: 'Empty data cannot be decoded as Rewrite'
    };
  }

  try {
    const reader = new BinaryReader(data);
    
    // Read type code
    const typeCode = reader.readByte();
    
    if (typeCode === TypeCode.REWRITE_0D) {
      // 0-dimensional rewrite
      const dimension = reader.readByte();
      if (dimension !== 0) {
        return {
          success: false,
          error: `Expected dimension 0 for REWRITE_0D, got ${dimension}`
        };
      }
      
      // Decode source generator
      const sourceLength = reader.readUint32();
      const sourceData = reader.readBytes(sourceLength);
      const sourceResult = decodeGenerator(sourceData);
      
      if (!sourceResult.success) {
        return {
          success: false,
          error: `Failed to decode source generator: ${sourceResult.error}`
        };
      }
      
      // Decode target generator
      const targetLength = reader.readUint32();
      const targetData = reader.readBytes(targetLength);
      const targetResult = decodeGenerator(targetData);
      
      if (!targetResult.success) {
        return {
          success: false,
          error: `Failed to decode target generator: ${targetResult.error}`
        };
      }
      
      const rewrite: Rewrite0 = {
        dimension: 0,
        source: sourceResult.data!,
        target: targetResult.data!
      };
      
      return {
        success: true,
        data: rewrite,
        bytesRead: reader.currentPosition
      };
      
    } else if (typeCode === TypeCode.REWRITE_1D_IDENTITY) {
      // 1-dimensional identity rewrite
      const dimension = reader.readByte();
      if (dimension !== 1) {
        return {
          success: false,
          error: `Expected dimension 1 for REWRITE_1D_IDENTITY, got ${dimension}`
        };
      }
      
      const identityFlag = reader.readByte();
      const identity = identityFlag === 0x01;
      
      const rewrite: RewriteI = {
        dimension: 1,
        identity
      };
      
      return {
        success: true,
        data: rewrite,
        bytesRead: reader.currentPosition
      };
      
    } else if (typeCode === TypeCode.REWRITE_ND) {
      // N-dimensional rewrite
      const dimension = reader.readByte();
      if (dimension < 2) {
        return {
          success: false,
          error: `Invalid dimension ${dimension} for REWRITE_ND`
        };
      }
      
      // Decode cones array
      const coneCount = reader.readArrayLength();
      const cones: Cone[] = [];
      
      for (let i = 0; i < coneCount; i++) {
        const coneLength = reader.readUint32();
        const coneData = reader.readBytes(coneLength);
        const coneResult = decodeCone(coneData);
        
        if (!coneResult.success) {
          return {
            success: false,
            error: `Failed to decode cone ${i}: ${coneResult.error}`
          };
        }
        
        cones.push(coneResult.data!);
      }
      
      const rewrite: RewriteN = {
        dimension,
        cones
      };
      
      return {
        success: true,
        data: rewrite,
        bytesRead: reader.currentPosition
      };
      
    } else {
      return {
        success: false,
        error: `Invalid rewrite type code: ${typeCode}`
      };
    }
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown decoding error'
    };
  }
}

/**
 * Decodes a Cospan from binary format
 */
export function decodeCospan(data: Uint8Array): BinaryResult<Cospan> {
  if (!data) {
    throw new Error('Data cannot be null or undefined');
  }

  try {
    const reader = new BinaryReader(data);
    
    // Read and validate type code
    const typeCode = reader.readByte();
    if (typeCode !== TypeCode.COSPAN) {
      return {
        success: false,
        error: `Expected Cospan type code ${TypeCode.COSPAN}, got ${typeCode}`
      };
    }
    
    // Decode forward rewrite
    const forwardLength = reader.readUint32();
    const forwardData = reader.readBytes(forwardLength);
    const forwardResult = decodeRewrite(forwardData);
    
    if (!forwardResult.success) {
      return {
        success: false,
        error: `Failed to decode forward rewrite: ${forwardResult.error}`
      };
    }
    
    // Decode backward rewrite
    const backwardLength = reader.readUint32();
    const backwardData = reader.readBytes(backwardLength);
    const backwardResult = decodeRewrite(backwardData);
    
    if (!backwardResult.success) {
      return {
        success: false,
        error: `Failed to decode backward rewrite: ${backwardResult.error}`
      };
    }
    
    const cospan: Cospan = {
      forward: forwardResult.data!,
      backward: backwardResult.data!
    };
    
    return {
      success: true,
      data: cospan,
      bytesRead: reader.currentPosition
    };
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown decoding error'
    };
  }
}

/**
 * Decodes a Cone from binary format
 */
export function decodeCone(data: Uint8Array): BinaryResult<Cone> {
  if (!data) {
    throw new Error('Data cannot be null or undefined');
  }

  try {
    const reader = new BinaryReader(data);
    
    // Read and validate type code
    const typeCode = reader.readByte();
    if (typeCode !== TypeCode.CONE) {
      return {
        success: false,
        error: `Expected Cone type code ${TypeCode.CONE}, got ${typeCode}`
      };
    }
    
    // Read index
    const index = reader.readUint32();
    
    // Decode source cospans
    const sourceCospanCount = reader.readArrayLength();
    const source: Cospan[] = [];
    
    for (let i = 0; i < sourceCospanCount; i++) {
      const sourceCospanLength = reader.readUint32();
      const sourceCospanData = reader.readBytes(sourceCospanLength);
      const sourceCospanResult = decodeCospan(sourceCospanData);
      
      if (!sourceCospanResult.success) {
        return {
          success: false,
          error: `Failed to decode source cospan ${i}: ${sourceCospanResult.error}`
        };
      }
      
      source.push(sourceCospanResult.data!);
    }
    
    // Decode target cospan
    const targetLength = reader.readUint32();
    const targetData = reader.readBytes(targetLength);
    const targetResult = decodeCospan(targetData);
    
    if (!targetResult.success) {
      return {
        success: false,
        error: `Failed to decode target cospan: ${targetResult.error}`
      };
    }
    
    // Decode slice rewrites
    const sliceCount = reader.readArrayLength();
    const slices: Rewrite[] = [];
    
    for (let i = 0; i < sliceCount; i++) {
      const sliceLength = reader.readUint32();
      const sliceData = reader.readBytes(sliceLength);
      const sliceResult = decodeRewrite(sliceData);
      
      if (!sliceResult.success) {
        return {
          success: false,
          error: `Failed to decode slice ${i}: ${sliceResult.error}`
        };
      }
      
      slices.push(sliceResult.data!);
    }
    
    const cone: Cone = {
      index,
      source,
      target: targetResult.data!,
      slices
    };
    
    return {
      success: true,
      data: cone,
      bytesRead: reader.currentPosition
    };
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown decoding error'
    };
  }
}

/**
 * Decodes data with header validation
 */
export function decodeWithHeader(data: Uint8Array): BinaryResult<Generator | Diagram | Rewrite | Cospan | Cone> {
  if (!data) {
    return {
      success: false,
      error: 'Data cannot be null or undefined'
    };
  }

  // Validate header
  const headerResult = validateBinaryHeader(data);
  if (!headerResult.success) {
    return {
      success: false,
      error: headerResult.error
    };
  }

  // Extract payload after header
  const headerSize = headerResult.bytesRead || 0;
  const payload = data.slice(headerSize);

  if (payload.length === 0) {
    return {
      success: false,
      error: 'No payload data after header'
    };
  }

  // Determine data type from first byte of payload
  const typeCode = payload[0];
  
  if (typeCode === TypeCode.GENERATOR) {
    return decodeGenerator(payload) as BinaryResult<Generator>;
  } else if (typeCode === TypeCode.DIAGRAM_0D || typeCode === TypeCode.DIAGRAM_ND) {
    return decodeDiagram(payload) as BinaryResult<Diagram>;
  } else if (typeCode === TypeCode.REWRITE_0D || typeCode === TypeCode.REWRITE_1D_IDENTITY || typeCode === TypeCode.REWRITE_ND) {
    return decodeRewrite(payload) as BinaryResult<Rewrite>;
  } else if (typeCode === TypeCode.COSPAN) {
    return decodeCospan(payload) as BinaryResult<Cospan>;
  } else if (typeCode === TypeCode.CONE) {
    return decodeCone(payload) as BinaryResult<Cone>;
  } else {
    return {
      success: false,
      error: `Unknown data type code: ${typeCode}`
    };
  }
}