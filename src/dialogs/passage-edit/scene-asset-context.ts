import * as React from 'react';

// Simple per-dialog bus for sending a single URL from Asset Manager -> Scene Editor
// Designed to avoid re-renders by keeping subscribers in a ref and not
// storing transient data in React state.

export interface SceneAssetBus {
  sendUrl: (url: string) => void;
  onUrl: (cb: (url: string) => void) => () => void; // returns unsubscribe
}

function createSceneAssetBus(): SceneAssetBus {
  const subs = new Set<(url: string) => void>();
  return {
    sendUrl: (url: string) => {
      subs.forEach(cb => {
        try { cb(url); } catch (e) { /* ignore */ }
      });
    },
    onUrl: (cb: (url: string) => void) => {
      subs.add(cb);
      return () => subs.delete(cb);
    },
  };
}

const SceneAssetContext = React.createContext<SceneAssetBus | null>(null);
SceneAssetContext.displayName = 'SceneAssetContext';

export const useSceneAssetBus = (): SceneAssetBus => {
  const ctx = React.useContext(SceneAssetContext);
  if (!ctx) throw new Error('useSceneAssetBus must be used within SceneAssetProvider');
  return ctx;
};

export const SceneAssetProvider: React.FC = ({ children }) => {
  // Stable per-provider bus instance
  const busRef = React.useRef<SceneAssetBus | null>(null);
  if (!busRef.current) busRef.current = createSceneAssetBus();
  return React.createElement(SceneAssetContext.Provider, { value: busRef.current }, children as React.ReactNode);
};
