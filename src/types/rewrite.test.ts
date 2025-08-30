import { describe, it, expect } from 'vitest';
import type { Rewrite, Cospan, Cone } from './rewrite';
import { isValidRewrite, isValidCospan, isValidCone, createIdentityRewrite, createGeneratorRewrite, createCospanRewrite } from './rewrite';
import type { Generator } from './diagram';

describe('Rewrite', () => {
  describe('0-dimensional rewrites', () => {
    it('should create valid generator rewrite', () => {
      const source: Generator = { id: 'src', label: 'Source' };
      const target: Generator = { id: 'tgt', label: 'Target' };
      const rewrite = createGeneratorRewrite(source, target);
      
      expect(rewrite.dimension).toBe(0);
      expect(rewrite.source).toEqual(source);
      expect(rewrite.target).toEqual(target);
      expect(isValidRewrite(rewrite)).toBe(true);
    });

    it('should validate 0-dimensional rewrite structure', () => {
      const rewrite = {
        dimension: 0,
        source: { id: 'a' },
        target: { id: 'b' }
      } as const;
      
      expect(isValidRewrite(rewrite)).toBe(true);
    });

    it('should reject 0-dimensional rewrite with invalid generators', () => {
      const rewrite = {
        dimension: 0,
        source: { id: '' }, // invalid
        target: { id: 'valid' }
      } as any;
      
      expect(isValidRewrite(rewrite)).toBe(false);
    });

    it('should handle NPR color transformations', () => {
      const source: Generator = { id: 'cart', color: 'cartesian' };
      const target: Generator = { id: 'cocart', color: 'cocartesian' };
      const rewrite = createGeneratorRewrite(source, target);
      
      expect(isValidRewrite(rewrite)).toBe(true);
      expect(rewrite.source.color).toBe('cartesian');
      expect(rewrite.target.color).toBe('cocartesian');
    });
  });

  describe('identity rewrites', () => {
    it('should create valid 1-dimensional identity rewrite', () => {
      const identity = createIdentityRewrite();
      
      expect(identity.dimension).toBe(1);
      expect(identity.identity).toBe(true);
      expect(isValidRewrite(identity)).toBe(true);
    });

    it('should validate 1-dimensional identity structure', () => {
      const identity = {
        dimension: 1,
        identity: true
      } as const;
      
      expect(isValidRewrite(identity)).toBe(true);
    });

    it('should reject identity without identity flag', () => {
      const invalid = {
        dimension: 1
      } as any;
      
      expect(isValidRewrite(invalid)).toBe(false);
    });
  });

  describe('n-dimensional rewrites', () => {
    it('should validate n-dimensional rewrite with cones', () => {
      const rewrite = {
        dimension: 2,
        cones: []
      } as const;
      
      expect(isValidRewrite(rewrite)).toBe(true);
    });

    it('should require positive dimension for n-dimensional rewrites', () => {
      const rewrite = {
        dimension: -1,
        cones: []
      } as any;
      
      expect(isValidRewrite(rewrite)).toBe(false);
    });

    it('should require cones array for n-dimensional rewrites', () => {
      const rewrite = {
        dimension: 2
      } as any;
      
      expect(isValidRewrite(rewrite)).toBe(false);
    });
  });
});

describe('Cospan', () => {
  describe('basic structure', () => {
    it('should create valid cospan from rewrites', () => {
      const source: Generator = { id: 'a' };
      const intermediate: Generator = { id: 'b' };
      const target: Generator = { id: 'c' };
      
      const forward = createGeneratorRewrite(source, intermediate);
      const backward = createGeneratorRewrite(target, intermediate);
      const cospan = createCospanRewrite(forward, backward);
      
      expect(cospan.forward).toEqual(forward);
      expect(cospan.backward).toEqual(backward);
      expect(isValidCospan(cospan)).toBe(true);
    });

    it('should validate cospan structure', () => {
      const forward = {
        dimension: 0,
        source: { id: 'a' },
        target: { id: 'b' }
      } as const;
      const backward = {
        dimension: 0,
        source: { id: 'c' },
        target: { id: 'b' }
      } as const;
      
      const cospan: Cospan = { forward, backward };
      expect(isValidCospan(cospan)).toBe(true);
    });

    it('should reject cospan with invalid rewrites', () => {
      const invalid = {
        forward: { dimension: 0, source: { id: '' }, target: { id: 'b' } },
        backward: { dimension: 0, source: { id: 'c' }, target: { id: 'b' } }
      } as any;
      
      expect(isValidCospan(invalid)).toBe(false);
    });

    it('should reject cospan missing forward or backward', () => {
      const incomplete = {
        forward: { dimension: 0, source: { id: 'a' }, target: { id: 'b' } }
      } as any;
      
      expect(isValidCospan(incomplete)).toBe(false);
    });
  });

  describe('bidirectional transformations', () => {
    it('should support identity cospans', () => {
      const identity = createIdentityRewrite();
      const cospan: Cospan = { forward: identity, backward: identity };
      
      expect(isValidCospan(cospan)).toBe(true);
    });

    it('should support mixed-dimension cospans', () => {
      const zeroD = createGeneratorRewrite({ id: 'a' }, { id: 'b' });
      const oneD = createIdentityRewrite();
      const cospan: Cospan = { forward: zeroD, backward: oneD };
      
      expect(isValidCospan(cospan)).toBe(true);
    });
  });
});

describe('Cone', () => {
  describe('basic structure', () => {
    it('should validate cone structure', () => {
      const source: Cospan = {
        forward: createGeneratorRewrite({ id: 'a' }, { id: 'b' }),
        backward: createGeneratorRewrite({ id: 'c' }, { id: 'b' })
      };
      const target: Cospan = {
        forward: createGeneratorRewrite({ id: 'd' }, { id: 'e' }),
        backward: createGeneratorRewrite({ id: 'f' }, { id: 'e' })
      };
      
      const cone: Cone = {
        index: 0,
        source: [source],
        target: target,
        slices: []
      };
      
      expect(isValidCone(cone)).toBe(true);
    });

    it('should require valid index', () => {
      const cone = {
        index: -1,
        source: [],
        target: { forward: createIdentityRewrite(), backward: createIdentityRewrite() },
        slices: []
      } as any;
      
      expect(isValidCone(cone)).toBe(false);
    });

    it('should require source array', () => {
      const cone = {
        index: 0,
        target: { forward: createIdentityRewrite(), backward: createIdentityRewrite() },
        slices: []
      } as any;
      
      expect(isValidCone(cone)).toBe(false);
    });

    it('should require valid target cospan', () => {
      const cone = {
        index: 0,
        source: [],
        target: { forward: null }, // invalid
        slices: []
      } as any;
      
      expect(isValidCone(cone)).toBe(false);
    });

    it('should require slices array', () => {
      const cone = {
        index: 0,
        source: [],
        target: { forward: createIdentityRewrite(), backward: createIdentityRewrite() }
      } as any;
      
      expect(isValidCone(cone)).toBe(false);
    });
  });

  describe('sparse encoding', () => {
    it('should support empty source cospans (0-ary cone)', () => {
      const target: Cospan = {
        forward: createIdentityRewrite(),
        backward: createIdentityRewrite()
      };
      
      const cone: Cone = {
        index: 0,
        source: [],
        target: target,
        slices: []
      };
      
      expect(isValidCone(cone)).toBe(true);
    });

    it('should support multiple source cospans', () => {
      const cospan1: Cospan = {
        forward: createGeneratorRewrite({ id: 'a' }, { id: 'b' }),
        backward: createGeneratorRewrite({ id: 'c' }, { id: 'b' })
      };
      const cospan2: Cospan = {
        forward: createGeneratorRewrite({ id: 'd' }, { id: 'e' }),
        backward: createGeneratorRewrite({ id: 'f' }, { id: 'e' })
      };
      const target: Cospan = {
        forward: createIdentityRewrite(),
        backward: createIdentityRewrite()
      };
      
      const cone: Cone = {
        index: 1,
        source: [cospan1, cospan2],
        target: target,
        slices: []
      };
      
      expect(isValidCone(cone)).toBe(true);
    });

    it('should validate slice rewrites', () => {
      const target: Cospan = {
        forward: createIdentityRewrite(),
        backward: createIdentityRewrite()
      };
      
      const cone: Cone = {
        index: 0,
        source: [],
        target: target,
        slices: [createIdentityRewrite(), createGeneratorRewrite({ id: 'x' }, { id: 'y' })]
      };
      
      expect(isValidCone(cone)).toBe(true);
    });
  });

  describe('monotone function encoding', () => {
    it('should represent inclusion maps via index', () => {
      const target: Cospan = {
        forward: createIdentityRewrite(),
        backward: createIdentityRewrite()
      };
      
      // Cone at index 2 represents inclusion into position 2
      const cone: Cone = {
        index: 2,
        source: [],
        target: target,
        slices: []
      };
      
      expect(cone.index).toBe(2);
      expect(isValidCone(cone)).toBe(true);
    });

    it('should handle complex sparse patterns', () => {
      const sources: Cospan[] = [
        {
          forward: createGeneratorRewrite({ id: 'a1' }, { id: 'b1' }),
          backward: createGeneratorRewrite({ id: 'c1' }, { id: 'b1' })
        },
        {
          forward: createGeneratorRewrite({ id: 'a2' }, { id: 'b2' }),
          backward: createGeneratorRewrite({ id: 'c2' }, { id: 'b2' })
        }
      ];
      
      const target: Cospan = {
        forward: createIdentityRewrite(),
        backward: createIdentityRewrite()
      };
      
      const cone: Cone = {
        index: 1,
        source: sources,
        target: target,
        slices: [createGeneratorRewrite({ id: 'x' }, { id: 'y' })]
      };
      
      expect(isValidCone(cone)).toBe(true);
      expect(cone.source).toHaveLength(2);
      expect(cone.slices).toHaveLength(1);
    });
  });
});