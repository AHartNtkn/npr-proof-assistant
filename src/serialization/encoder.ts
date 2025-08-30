/**
 * Binary encoder for NPR data structures
 * Converts zigzag structures to compact binary format
 */

import type { Generator } from '../types/diagram';
import type { Diagram, Diagram0, DiagramN } from '../types/diagram';
import type { Rewrite, Rewrite0, RewriteI, RewriteN, Cospan, Cone } from '../types/rewrite';
import { 
  TypeCode, 
  ColorCode, 
  BinaryWriter,
  createBinaryHeader,
  FormatFlags 
} from './binary-format';

/**
 * Encodes a Generator to binary format
 */
export function encodeGenerator(generator: Generator): Uint8Array {
  if (!generator) {
    throw new Error('Generator cannot be null or undefined');
  }

  const writer = new BinaryWriter();
  
  // Write type code
  writer.writeByte(TypeCode.GENERATOR);
  
  // Write id string
  writer.writeString(generator.id);
  
  // Write label (optional)
  if (generator.label !== undefined) {
    writer.writeByte(0x01); // Has label flag
    writer.writeString(generator.label);
  } else {
    writer.writeByte(0x00); // No label flag
  }
  
  // Write color (optional)
  if (generator.color === 'cartesian') {
    writer.writeByte(ColorCode.CARTESIAN);
  } else if (generator.color === 'cocartesian') {
    writer.writeByte(ColorCode.COCARTESIAN);
  } else {
    writer.writeByte(ColorCode.NONE);
  }
  
  return writer.toUint8Array();
}

/**
 * Encodes a Diagram to binary format
 */
export function encodeDiagram(diagram: Diagram): Uint8Array {
  if (!diagram) {
    throw new Error('Diagram cannot be null or undefined');
  }

  if (diagram.dimension < 0) {
    throw new Error('Diagram dimension cannot be negative');
  }

  const writer = new BinaryWriter();
  
  if (diagram.dimension === 0) {
    // 0-dimensional diagram
    writer.writeByte(TypeCode.DIAGRAM_0D);
    writer.writeByte(diagram.dimension);
    
    // Encode the generator
    const generatorData = encodeGenerator(diagram.generator);
    writer.writeBytes(generatorData);
  } else {
    // N-dimensional diagram
    const nDiagram = diagram as DiagramN;
    writer.writeByte(TypeCode.DIAGRAM_ND);
    writer.writeByte(nDiagram.dimension);
    
    // Encode the source diagram recursively
    const sourceData = encodeDiagram(nDiagram.source);
    writer.writeUint32(sourceData.length);
    writer.writeBytes(sourceData);
    
    // Encode cospans array
    writer.writeArrayLength(nDiagram.cospans.length);
    for (const cospan of nDiagram.cospans) {
      const cospanData = encodeCospan(cospan);
      writer.writeUint32(cospanData.length);
      writer.writeBytes(cospanData);
    }
  }
  
  return writer.toUint8Array();
}

/**
 * Encodes a Rewrite to binary format
 */
export function encodeRewrite(rewrite: Rewrite): Uint8Array {
  if (!rewrite) {
    throw new Error('Rewrite cannot be null or undefined');
  }

  if (rewrite.dimension < 0) {
    throw new Error('Rewrite dimension cannot be negative');
  }

  const writer = new BinaryWriter();
  
  if (rewrite.dimension === 0) {
    // 0-dimensional rewrite
    const rewrite0 = rewrite as Rewrite0;
    writer.writeByte(TypeCode.REWRITE_0D);
    writer.writeByte(rewrite.dimension);
    
    // Encode source and target generators
    const sourceData = encodeGenerator(rewrite0.source);
    writer.writeUint32(sourceData.length);
    writer.writeBytes(sourceData);
    
    const targetData = encodeGenerator(rewrite0.target);
    writer.writeUint32(targetData.length);
    writer.writeBytes(targetData);
    
  } else if (rewrite.dimension === 1 && 'identity' in rewrite) {
    // 1-dimensional identity rewrite
    writer.writeByte(TypeCode.REWRITE_1D_IDENTITY);
    writer.writeByte(rewrite.dimension);
    writer.writeByte(rewrite.identity ? 0x01 : 0x00);
    
  } else {
    // N-dimensional rewrite
    const rewriteN = rewrite as RewriteN;
    writer.writeByte(TypeCode.REWRITE_ND);
    writer.writeByte(rewrite.dimension);
    
    // Encode cones array
    writer.writeArrayLength(rewriteN.cones.length);
    for (const cone of rewriteN.cones) {
      const coneData = encodeCone(cone);
      writer.writeUint32(coneData.length);
      writer.writeBytes(coneData);
    }
  }
  
  return writer.toUint8Array();
}

/**
 * Encodes a Cospan to binary format
 */
export function encodeCospan(cospan: Cospan): Uint8Array {
  if (!cospan) {
    throw new Error('Cospan cannot be null or undefined');
  }

  const writer = new BinaryWriter();
  
  writer.writeByte(TypeCode.COSPAN);
  
  // Encode forward rewrite
  const forwardData = encodeRewrite(cospan.forward);
  writer.writeUint32(forwardData.length);
  writer.writeBytes(forwardData);
  
  // Encode backward rewrite
  const backwardData = encodeRewrite(cospan.backward);
  writer.writeUint32(backwardData.length);
  writer.writeBytes(backwardData);
  
  return writer.toUint8Array();
}

/**
 * Encodes a Cone to binary format
 */
export function encodeCone(cone: Cone): Uint8Array {
  if (!cone) {
    throw new Error('Cone cannot be null or undefined');
  }

  const writer = new BinaryWriter();
  
  writer.writeByte(TypeCode.CONE);
  
  // Write index
  writer.writeUint32(cone.index);
  
  // Encode source cospans
  writer.writeArrayLength(cone.source.length);
  for (const sourceCospan of cone.source) {
    const sourceCospanData = encodeCospan(sourceCospan);
    writer.writeUint32(sourceCospanData.length);
    writer.writeBytes(sourceCospanData);
  }
  
  // Encode target cospan
  const targetData = encodeCospan(cone.target);
  writer.writeUint32(targetData.length);
  writer.writeBytes(targetData);
  
  // Encode slice rewrites
  writer.writeArrayLength(cone.slices.length);
  for (const slice of cone.slices) {
    const sliceData = encodeRewrite(slice);
    writer.writeUint32(sliceData.length);
    writer.writeBytes(sliceData);
  }
  
  return writer.toUint8Array();
}

/**
 * Encodes any NPR data structure with proper header
 */
export function encodeWithHeader(data: Generator | Diagram | Rewrite | Cospan | Cone): Uint8Array {
  let encodedData: Uint8Array;
  
  if ('generator' in data || 'dimension' in data) {
    // It's a Diagram
    encodedData = encodeDiagram(data as Diagram);
  } else if ('source' in data && 'target' in data && 'cones' in data === false) {
    // It's a Rewrite0
    encodedData = encodeRewrite(data as Rewrite);
  } else if ('identity' in data) {
    // It's a RewriteI
    encodedData = encodeRewrite(data as Rewrite);
  } else if ('cones' in data) {
    // It's a RewriteN
    encodedData = encodeRewrite(data as Rewrite);
  } else if ('forward' in data && 'backward' in data) {
    // It's a Cospan
    encodedData = encodeCospan(data as Cospan);
  } else if ('index' in data && 'source' in data && 'target' in data && 'slices' in data) {
    // It's a Cone
    encodedData = encodeCone(data as Cone);
  } else {
    // It's a Generator
    encodedData = encodeGenerator(data as Generator);
  }
  
  // Create header
  const header = createBinaryHeader(encodedData.length, FormatFlags.NONE);
  
  // Combine header and data
  const result = new Uint8Array(header.length + encodedData.length);
  result.set(header, 0);
  result.set(encodedData, header.length);
  
  return result;
}