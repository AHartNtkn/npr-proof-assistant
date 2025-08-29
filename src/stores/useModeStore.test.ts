import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act } from '@testing-library/react';
import { useModeStore } from './useModeStore';

describe('useModeStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    useModeStore.setState({
      mode: 'formula',
      previousMode: null,
      transitioning: false,
    });
    vi.clearAllTimers();
    vi.useFakeTimers();
  });

  it('should initialize with formula mode', () => {
    const state = useModeStore.getState();
    expect(state.mode).toBe('formula');
    expect(state.previousMode).toBeNull();
    expect(state.transitioning).toBe(false);
  });

  it('should toggle between formula and proof modes', () => {
    const { toggleMode } = useModeStore.getState();
    
    // Toggle to proof mode
    act(() => {
      toggleMode();
    });
    
    let state = useModeStore.getState();
    expect(state.transitioning).toBe(true);
    expect(state.previousMode).toBe('formula');
    
    // Fast-forward transition
    act(() => {
      vi.advanceTimersByTime(300);
    });
    
    state = useModeStore.getState();
    expect(state.mode).toBe('proof');
    expect(state.transitioning).toBe(false);
    
    // Toggle back to formula mode
    act(() => {
      toggleMode();
    });
    
    state = useModeStore.getState();
    expect(state.transitioning).toBe(true);
    expect(state.previousMode).toBe('proof');
    
    act(() => {
      vi.advanceTimersByTime(300);
    });
    
    state = useModeStore.getState();
    expect(state.mode).toBe('formula');
    expect(state.transitioning).toBe(false);
  });

  it('should set mode directly', () => {
    const { setMode } = useModeStore.getState();
    
    act(() => {
      setMode('proof');
    });
    
    let state = useModeStore.getState();
    expect(state.transitioning).toBe(true);
    expect(state.previousMode).toBe('formula');
    
    act(() => {
      vi.advanceTimersByTime(300);
    });
    
    state = useModeStore.getState();
    expect(state.mode).toBe('proof');
    expect(state.transitioning).toBe(false);
  });

  it('should not transition when setting same mode', () => {
    const { setMode } = useModeStore.getState();
    
    act(() => {
      setMode('formula');
    });
    
    const state = useModeStore.getState();
    expect(state.transitioning).toBe(false);
    expect(state.mode).toBe('formula');
    expect(state.previousMode).toBeNull();
  });

  it('should track previous mode during transitions', () => {
    const { setMode } = useModeStore.getState();
    
    act(() => {
      setMode('proof');
      vi.advanceTimersByTime(300);
    });
    
    act(() => {
      setMode('formula');
    });
    
    const state = useModeStore.getState();
    expect(state.previousMode).toBe('proof');
  });
});