/**
 * useRewriteStore - Store for managing rewrite rules and transformations
 * Handles rule collections, application logic, and NPR axiom compliance
 */

import { create } from 'zustand';
import { 
  type Rewrite, 
  type Diagram,
  type NPRValidationError,
  isValidRewrite
} from '../types';
import { getAllNPRAxioms } from '../axioms';
import { isComposable } from '../engine';

export interface RewriteRule {
  id: string;
  name?: string;
  rewrite: Rewrite;
  priority?: number;
  category?: 'axiom' | 'user' | 'derived';
  description?: string;
}

export interface RuleCollection {
  id: string;
  name: string;
  rules: RewriteRule[];
  description?: string;
}

export interface ApplicableRule extends RewriteRule {
  matchType: 'exact' | 'partial' | 'contextual';
  confidence: number;
}

export interface RuleConflict {
  type: 'ambiguous' | 'contradictory';
  conflictingRules: string[];
  description: string;
}

export interface CompositionSuggestion {
  composedWith: string;
  resultingRewrite: Rewrite;
  confidence: number;
}

interface RewriteStoreState {
  availableRules: RewriteRule[];
  collections: Map<string, RuleCollection>;
  ruleIndex: Map<string, RewriteRule>;
  conflictDetectionEnabled: boolean;
}

interface RewriteStoreActions {
  // Rule management
  addRewriteRule: (id: string, rewrite: Rewrite, priority?: number) => void;
  removeRewriteRule: (id: string) => void;
  clearAllRewrites: () => void;
  batchAddRules: (rules: { id: string; rewrite: Rewrite; priority?: number }[]) => void;
  
  // Rule categorization and lookup
  getRulesByType: (type: 'generator' | 'identity' | 'composed') => RewriteRule[];
  getRulesByCategory: (category: 'axiom' | 'user' | 'derived') => RewriteRule[];
  findRuleById: (id: string) => RewriteRule | undefined;
  
  // Rule application
  getApplicableRules: (diagram: Diagram) => ApplicableRule[];
  validateRuleWithNPR: (rewrite: Rewrite) => boolean;
  suggestCompositions: (rule: Rewrite) => CompositionSuggestion[];
  
  // Collections
  loadNPRAxioms: () => void;
  createRuleCollection: (id: string, rules: Rewrite[]) => void;
  getRuleCollection: (id: string) => RuleCollection | undefined;
  
  // Import/Export
  exportRules: () => string;
  importRules: (data: string) => void;
  
  // Conflict resolution
  detectConflicts: () => RuleConflict[];
  resolveWithPriority: (diagram: Diagram) => RewriteRule | null;
}

interface RewriteStore extends RewriteStoreState, RewriteStoreActions {}

export const useRewriteStore = create<RewriteStore>((set, get) => ({
  // Initial state
  availableRules: [],
  collections: new Map(),
  ruleIndex: new Map(),
  conflictDetectionEnabled: true,

  // Rule management
  addRewriteRule: (id: string, rewrite: Rewrite, priority = 0) => {
    if (!isValidRewrite(rewrite)) {
      throw new Error('Invalid rewrite rule');
    }
    
    const rule: RewriteRule = {
      id,
      rewrite,
      priority,
      category: 'user'
    };
    
    set((state) => {
      const newRules = [...state.availableRules.filter(r => r.id !== id), rule];
      const newIndex = new Map(state.ruleIndex);
      newIndex.set(id, rule);
      
      return {
        availableRules: newRules,
        ruleIndex: newIndex
      };
    });
  },

  removeRewriteRule: (id: string) => {
    set((state) => {
      const newRules = state.availableRules.filter(r => r.id !== id);
      const newIndex = new Map(state.ruleIndex);
      newIndex.delete(id);
      
      return {
        availableRules: newRules,
        ruleIndex: newIndex
      };
    });
  },

  clearAllRewrites: () => {
    set({
      availableRules: [],
      ruleIndex: new Map(),
      collections: new Map()
    });
  },

  batchAddRules: (rules) => {
    const validRules: RewriteRule[] = [];
    const newIndex = new Map(get().ruleIndex);
    
    for (const { id, rewrite, priority = 0 } of rules) {
      if (isValidRewrite(rewrite)) {
        const rule: RewriteRule = {
          id,
          rewrite,
          priority,
          category: 'user'
        };
        validRules.push(rule);
        newIndex.set(id, rule);
      }
    }
    
    set((state) => ({
      availableRules: [...state.availableRules, ...validRules],
      ruleIndex: newIndex
    }));
  },

  // Rule categorization and lookup
  getRulesByType: (type) => {
    const { availableRules } = get();
    return availableRules.filter(rule => {
      const rewrite = rule.rewrite;
      switch (type) {
        case 'generator':
          return rewrite.dimension === 0;
        case 'identity':
          return rewrite.dimension === 1 && 'identity' in rewrite && rewrite.identity;
        case 'composed':
          return rewrite.dimension > 1;
        default:
          return false;
      }
    });
  },

  getRulesByCategory: (category) => {
    const { availableRules } = get();
    return availableRules.filter(rule => rule.category === category);
  },

  findRuleById: (id: string) => {
    const { ruleIndex } = get();
    return ruleIndex.get(id);
  },

  // Rule application
  getApplicableRules: (diagram: Diagram) => {
    const { availableRules } = get();
    const applicable: ApplicableRule[] = [];
    
    for (const rule of availableRules) {
      const rewrite = rule.rewrite;
      let matchType: 'exact' | 'partial' | 'contextual' = 'contextual';
      let confidence = 0.5;
      
      if (diagram.dimension === 0 && rewrite.dimension === 0) {
        // Check if source generator matches
        if ('source' in rewrite && 'generator' in diagram) {
          if (rewrite.source.id === diagram.generator.id) {
            matchType = 'exact';
            confidence = 1.0;
          }
        }
      } else if (diagram.dimension > 0 && rewrite.dimension > 0) {
        // Higher-dimensional matching logic
        matchType = 'partial';
        confidence = 0.7;
      }
      
      if (confidence > 0.3) {
        applicable.push({
          ...rule,
          matchType,
          confidence
        });
      }
    }
    
    return applicable.sort((a, b) => b.confidence - a.confidence);
  },

  validateRuleWithNPR: (rewrite: Rewrite) => {
    if (!isValidRewrite(rewrite)) {
      return false;
    }
    
    // Basic NPR validation - check for color consistency
    if (rewrite.dimension === 0 && 'source' in rewrite && 'target' in rewrite) {
      const source = rewrite.source;
      const target = rewrite.target;
      
      // If both have colors, they should be compatible
      if ('color' in source && 'color' in target) {
        // For now, allow any color transitions
        // In a full implementation, this would check NPR axiom constraints
        return true;
      }
    }
    
    return true;
  },

  suggestCompositions: (rule: Rewrite) => {
    const { availableRules } = get();
    const suggestions: CompositionSuggestion[] = [];
    
    if (rule.dimension === 0 && 'target' in rule) {
      // Find rules that can compose with this rule's target
      for (const otherRule of availableRules) {
        if (otherRule.rewrite.dimension === 0 && 'source' in otherRule.rewrite) {
          if (otherRule.rewrite.source.id === rule.target.id) {
            // Suggest composition
            const composedRewrite: Rewrite = {
              dimension: 0,
              source: rule.source,
              target: otherRule.rewrite.target
            };
            
            suggestions.push({
              composedWith: otherRule.id,
              resultingRewrite: composedRewrite,
              confidence: 0.8
            });
          }
        }
      }
    }
    
    return suggestions;
  },

  // Collections
  loadNPRAxioms: () => {
    const axioms = getAllNPRAxioms();
    const axiomRules: RewriteRule[] = [];
    
    // Convert NPR axioms to rewrite rules
    for (let i = 0; i < axioms.length; i++) {
      const axiom = axioms[i];
      // Create a simple identity rewrite for each axiom
      // In a full implementation, this would create proper axiom-based rewrites
      const rewrite: Rewrite = {
        dimension: 1,
        identity: true
      };
      
      axiomRules.push({
        id: `axiom-${axiom.id}`,
        name: axiom.name,
        rewrite,
        priority: 100,
        category: 'axiom',
        description: axiom.description
      });
    }
    
    set((state) => {
      const newRules = [...state.availableRules, ...axiomRules];
      const newIndex = new Map(state.ruleIndex);
      
      axiomRules.forEach(rule => {
        newIndex.set(rule.id, rule);
      });
      
      return {
        availableRules: newRules,
        ruleIndex: newIndex
      };
    });
  },

  createRuleCollection: (id: string, rules: Rewrite[]) => {
    const collection: RuleCollection = {
      id,
      name: id,
      rules: rules.map((rewrite, index) => ({
        id: `${id}-${index}`,
        rewrite,
        category: 'derived' as const
      }))
    };
    
    set((state) => {
      const newCollections = new Map(state.collections);
      newCollections.set(id, collection);
      return { collections: newCollections };
    });
  },

  getRuleCollection: (id: string) => {
    const { collections } = get();
    return collections.get(id);
  },

  // Import/Export
  exportRules: () => {
    const { availableRules } = get();
    return JSON.stringify({
      version: '1.0',
      rules: availableRules
    });
  },

  importRules: (data: string) => {
    try {
      const parsed = JSON.parse(data);
      if (parsed.version === '1.0' && Array.isArray(parsed.rules)) {
        const importedRules = parsed.rules.filter((rule: any) => 
          rule.id && rule.rewrite && isValidRewrite(rule.rewrite)
        );
        
        set((state) => {
          const newRules = [...state.availableRules, ...importedRules];
          const newIndex = new Map(state.ruleIndex);
          
          importedRules.forEach((rule: RewriteRule) => {
            newIndex.set(rule.id, rule);
          });
          
          return {
            availableRules: newRules,
            ruleIndex: newIndex
          };
        });
      }
    } catch (error) {
      console.error('Failed to import rules:', error);
    }
  },

  // Conflict resolution
  detectConflicts: () => {
    const { availableRules } = get();
    const conflicts: RuleConflict[] = [];
    const sourceToRules = new Map<string, RewriteRule[]>();
    
    // Group rules by their source
    for (const rule of availableRules) {
      if (rule.rewrite.dimension === 0 && 'source' in rule.rewrite) {
        const sourceId = rule.rewrite.source.id;
        if (!sourceToRules.has(sourceId)) {
          sourceToRules.set(sourceId, []);
        }
        sourceToRules.get(sourceId)!.push(rule);
      }
    }
    
    // Find conflicting rules (same source, different targets)
    for (const [sourceId, rules] of sourceToRules.entries()) {
      if (rules.length > 1) {
        const targets = new Set();
        const conflictingRuleIds: string[] = [];
        
        for (const rule of rules) {
          if ('target' in rule.rewrite) {
            const targetId = rule.rewrite.target.id;
            if (targets.has(targetId)) {
              // Same target, not a conflict
            } else {
              targets.add(targetId);
              conflictingRuleIds.push(rule.id);
            }
          }
        }
        
        if (conflictingRuleIds.length > 1) {
          conflicts.push({
            type: 'ambiguous',
            conflictingRules: conflictingRuleIds,
            description: `Multiple rules applicable to generator ${sourceId}`
          });
        }
      }
    }
    
    return conflicts;
  },

  resolveWithPriority: (diagram: Diagram) => {
    const applicableRules = get().getApplicableRules(diagram);
    if (applicableRules.length === 0) return null;
    
    // Sort by priority (descending) then by confidence (descending)
    applicableRules.sort((a, b) => {
      const priorityDiff = (b.priority || 0) - (a.priority || 0);
      if (priorityDiff !== 0) return priorityDiff;
      return b.confidence - a.confidence;
    });
    
    return applicableRules[0];
  }
}));