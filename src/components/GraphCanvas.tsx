import { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import { useModeStore } from '../stores/useModeStore';
import { useDiagramStore } from '../stores/useDiagramStore';
import type { Diagram0, DiagramN } from '../types';

export function GraphCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const mode = useModeStore((state) => state.mode);
  const transitioning = useModeStore((state) => state.transitioning);
  const currentDiagram = useDiagramStore((state) => state.currentDiagram);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize PIXI Application
    const app = new PIXI.Application();
    appRef.current = app;

    app.init({
      width: window.innerWidth,
      height: window.innerHeight - 60, // Leave space for mode switcher
      backgroundColor: mode === 'formula' ? 0x1a1a2e : 0x16213e,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
    }).then(() => {
      if (containerRef.current && app.canvas) {
        containerRef.current.appendChild(app.canvas);
      }

      // Add placeholder graphics
      const graphics = new PIXI.Graphics();
      
      // Draw a simple grid pattern
      graphics.lineStyle(1, 0x404040, 0.3);
      const gridSize = 50;
      
      for (let x = 0; x <= app.screen.width; x += gridSize) {
        graphics.moveTo(x, 0);
        graphics.lineTo(x, app.screen.height);
      }
      
      for (let y = 0; y <= app.screen.height; y += gridSize) {
        graphics.moveTo(0, y);
        graphics.lineTo(app.screen.width, y);
      }
      
      app.stage.addChild(graphics);

      // Add mode indicator text
      const style = new PIXI.TextStyle({
        fontFamily: 'Arial',
        fontSize: 24,
        fill: 0xffffff,
        align: 'center',
      });
      
      const modeText = new PIXI.Text(
        `${mode === 'formula' ? 'Formula' : 'Proof'} Mode`,
        style
      );
      modeText.x = app.screen.width / 2;
      modeText.y = app.screen.height / 2;
      modeText.anchor.set(0.5);
      modeText.alpha = 0.3;
      
      app.stage.addChild(modeText);
      
      // Add diagram info text
      const diagramStyle = new PIXI.TextStyle({
        fontFamily: 'monospace',
        fontSize: 14,
        fill: 0x888888,
        align: 'left',
      });
      
      const diagramText = new PIXI.Text(
        'Ready for zigzag diagrams',
        diagramStyle
      );
      diagramText.x = 10;
      diagramText.y = 10;
      
      app.stage.addChild(diagramText);
    });

    // Handle window resize
    const handleResize = () => {
      if (appRef.current) {
        appRef.current.renderer.resize(
          window.innerWidth,
          window.innerHeight - 60
        );
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (appRef.current) {
        appRef.current.destroy(true, { children: true, texture: true });
      }
    };
  }, []);

  // Update background color when mode changes
  useEffect(() => {
    if (appRef.current && appRef.current.renderer) {
      const bgColor = mode === 'formula' ? 0x1a1a2e : 0x16213e;
      appRef.current.renderer.background.color = bgColor;
      
      // Update mode text
      const texts = appRef.current.stage.children.filter(
        child => child instanceof PIXI.Text
      ) as PIXI.Text[];
      
      if (texts[0]) {
        texts[0].text = `${mode === 'formula' ? 'Formula' : 'Proof'} Mode`;
      }
    }
  }, [mode]);
  
  // Update diagram visualization
  useEffect(() => {
    if (appRef.current && currentDiagram) {
      const texts = appRef.current.stage.children.filter(
        child => child instanceof PIXI.Text
      ) as PIXI.Text[];
      
      if (texts[1]) {
        // Display diagram info
        const isDiagram0 = currentDiagram.dimension === 0;
        if (isDiagram0) {
          const d0 = currentDiagram as Diagram0;
          texts[1].text = `Diagram: 0-dim | Generator: ${d0.generator.label || d0.generator.id}${d0.generator.color ? ` (${d0.generator.color})` : ''}`;
        } else {
          const dN = currentDiagram as DiagramN;
          texts[1].text = `Diagram: ${dN.dimension}-dim | Cospans: ${dN.cospans.length}`;
        }
      }
    }
  }, [currentDiagram]);

  return (
    <div 
      ref={containerRef}
      className={`graph-canvas ${transitioning ? 'transitioning' : ''}`}
      style={{
        width: '100%',
        height: 'calc(100vh - 60px)',
        transition: transitioning ? 'opacity 0.3s ease' : 'none',
        opacity: transitioning ? 0.8 : 1,
      }}
      data-testid="graph-canvas"
    />
  );
}