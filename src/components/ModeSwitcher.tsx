import { useModeStore } from '../stores/useModeStore';
import './ModeSwitcher.css';

export function ModeSwitcher() {
  const mode = useModeStore((state) => state.mode);
  const toggleMode = useModeStore((state) => state.toggleMode);
  const transitioning = useModeStore((state) => state.transitioning);

  return (
    <div className="mode-switcher" data-testid="mode-switcher">
      <div className="mode-info">
        <span className="mode-label">Current Mode:</span>
        <span className={`mode-name ${mode}`}>
          {mode === 'formula' ? 'Formula Building' : 'Proof Construction'}
        </span>
      </div>
      
      <button
        className={`mode-toggle ${transitioning ? 'transitioning' : ''}`}
        onClick={toggleMode}
        disabled={transitioning}
        aria-label={`Switch to ${mode === 'formula' ? 'proof' : 'formula'} mode`}
      >
        <span className="toggle-slider">
          <span className="toggle-handle" data-mode={mode} />
        </span>
        <span className="toggle-label left">Formula</span>
        <span className="toggle-label right">Proof</span>
      </button>
      
      <div className="mode-description">
        {mode === 'formula' 
          ? '🎨 Create and compose NPR formulas freely'
          : '🧩 Apply axioms to transform formulas'}
      </div>
    </div>
  );
}