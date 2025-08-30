import { describe, it, expect, beforeEach } from 'vitest';
import { useDiagramStore } from './useDiagramStore';
import type { Diagram0, DiagramN, Generator, Cospan, Rewrite0 } from '../types';

describe('useDiagramStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useDiagramStore.setState({
      currentDiagram: {
        dimension: 0,
        generator: { id: 'empty', label: 'ε' },
      },
      history: [],
      selection: {
        selectedDiagram: null,
        selectedSlice: null,
        hoveredRewrite: null,
      },
    });
  });

  describe('Diagram Management', () => {
    it('should initialize with empty diagram', () => {
      const state = useDiagramStore.getState();
      expect(state.currentDiagram).toEqual({
        dimension: 0,
        generator: { id: 'empty', label: 'ε' },
      });
      expect(state.history).toEqual([]);
    });

    it('should set a new diagram and update history', () => {
      const newDiagram: Diagram0 = {
        dimension: 0,
        generator: { id: 'test', label: 'A', color: 'cartesian' },
      };

      useDiagramStore.getState().setDiagram(newDiagram);
      
      const state = useDiagramStore.getState();
      expect(state.currentDiagram).toEqual(newDiagram);
      expect(state.history).toHaveLength(1);
      expect(state.history[0]).toEqual({
        dimension: 0,
        generator: { id: 'empty', label: 'ε' },
      });
    });

    it('should clear diagram to empty state', () => {
      const diagram: Diagram0 = {
        dimension: 0,
        generator: { id: 'test', label: 'B' },
      };

      useDiagramStore.getState().setDiagram(diagram);
      useDiagramStore.getState().clearDiagram();

      const state = useDiagramStore.getState();
      expect(state.currentDiagram).toEqual({
        dimension: 0,
        generator: { id: 'empty', label: 'ε' },
      });
      expect(state.selection.selectedDiagram).toBeNull();
    });

    it('should handle n-dimensional diagrams', () => {
      const source: Diagram0 = {
        dimension: 0,
        generator: { id: 'source', label: 'S' },
      };

      const rewrite: Rewrite0 = {
        dimension: 0,
        source: { id: 'a', label: 'A' },
        target: { id: 'b', label: 'B' },
      };

      const cospan: Cospan = {
        forward: rewrite,
        backward: rewrite,
      };

      const nDiagram: DiagramN = {
        dimension: 2,
        source: source,
        cospans: [cospan],
      };

      useDiagramStore.getState().setDiagram(nDiagram);
      
      const state = useDiagramStore.getState();
      expect(state.currentDiagram).toEqual(nDiagram);
      expect((state.currentDiagram as DiagramN).dimension).toBe(2);
      expect((state.currentDiagram as DiagramN).cospans).toHaveLength(1);
    });
  });

  describe('Selection Management', () => {
    it('should select a diagram', () => {
      const diagram: Diagram0 = {
        dimension: 0,
        generator: { id: 'selected', label: 'S' },
      };

      useDiagramStore.getState().selectDiagram(diagram);
      
      const state = useDiagramStore.getState();
      expect(state.selection.selectedDiagram).toEqual(diagram);
    });

    it('should select a slice index', () => {
      useDiagramStore.getState().selectSlice(3);
      
      const state = useDiagramStore.getState();
      expect(state.selection.selectedSlice).toBe(3);
    });

    it('should set hovered rewrite', () => {
      const rewrite: Rewrite0 = {
        dimension: 0,
        source: { id: 'src', label: 'Source' },
        target: { id: 'tgt', label: 'Target' },
      };

      useDiagramStore.getState().setHoveredRewrite(rewrite);
      
      const state = useDiagramStore.getState();
      expect(state.selection.hoveredRewrite).toEqual(rewrite);
    });

    it('should clear all selections', () => {
      const diagram: Diagram0 = {
        dimension: 0,
        generator: { id: 'test', label: 'T' },
      };

      useDiagramStore.getState().selectDiagram(diagram);
      useDiagramStore.getState().selectSlice(2);
      useDiagramStore.getState().clearSelection();

      const state = useDiagramStore.getState();
      expect(state.selection.selectedDiagram).toBeNull();
      expect(state.selection.selectedSlice).toBeNull();
      expect(state.selection.hoveredRewrite).toBeNull();
    });
  });

  describe('History Management', () => {
    it('should push diagrams to history', () => {
      const diagram1: Diagram0 = {
        dimension: 0,
        generator: { id: 'd1', label: 'D1' },
      };
      const diagram2: Diagram0 = {
        dimension: 0,
        generator: { id: 'd2', label: 'D2' },
      };

      useDiagramStore.getState().pushToHistory(diagram1);
      useDiagramStore.getState().pushToHistory(diagram2);

      const state = useDiagramStore.getState();
      expect(state.history).toHaveLength(2);
      expect(state.history[0]).toEqual(diagram1);
      expect(state.history[1]).toEqual(diagram2);
    });

    it('should undo to previous diagram', () => {
      const diagram1: Diagram0 = {
        dimension: 0,
        generator: { id: 'd1', label: 'D1' },
      };
      const diagram2: Diagram0 = {
        dimension: 0,
        generator: { id: 'd2', label: 'D2' },
      };

      useDiagramStore.getState().setDiagram(diagram1);
      useDiagramStore.getState().setDiagram(diagram2);
      useDiagramStore.getState().undo();

      const state = useDiagramStore.getState();
      expect(state.currentDiagram).toEqual(diagram1);
      expect(state.history).toHaveLength(1);
    });

    it('should handle undo with empty history', () => {
      const initialDiagram = useDiagramStore.getState().currentDiagram;
      useDiagramStore.getState().undo();
      
      const state = useDiagramStore.getState();
      expect(state.currentDiagram).toEqual(initialDiagram);
      expect(state.history).toHaveLength(0);
    });
  });

  describe('NPR-specific Operations', () => {
    it('should add a generator with cartesian color', () => {
      const generator: Generator = {
        id: 'cart',
        label: 'C',
        color: 'cartesian',
      };

      useDiagramStore.getState().addGenerator(generator);
      
      const state = useDiagramStore.getState();
      expect(state.currentDiagram).toEqual({
        dimension: 0,
        generator,
      });
      expect(state.history).toHaveLength(1);
    });

    it('should add a generator with cocartesian color', () => {
      const generator: Generator = {
        id: 'cocart',
        label: 'CC',
        color: 'cocartesian',
      };

      useDiagramStore.getState().addGenerator(generator);
      
      const state = useDiagramStore.getState();
      expect((state.currentDiagram as Diagram0).generator.color).toBe('cocartesian');
    });

    it('should call applyRewrite (placeholder)', () => {
      const rewrite: Rewrite0 = {
        dimension: 0,
        source: { id: 'src', label: 'S' },
        target: { id: 'tgt', label: 'T' },
      };

      // Just verify it doesn't throw for now
      expect(() => {
        useDiagramStore.getState().applyRewrite(rewrite, 0);
      }).not.toThrow();
    });

    it('should call composeWithDiagram (placeholder)', () => {
      const diagram: Diagram0 = {
        dimension: 0,
        generator: { id: 'compose', label: 'C' },
      };

      // Just verify it doesn't throw for now
      expect(() => {
        useDiagramStore.getState().composeWithDiagram(diagram);
      }).not.toThrow();
    });
  });
});