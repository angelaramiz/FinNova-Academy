// Estado compartido del módulo DIOT (alternativa ligera a store externo).
import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { DiotMode } from '../lib/diot/types';

interface DiotState {
  mode: DiotMode;
  setMode: (m: DiotMode) => void;
}

const DiotContext = createContext<DiotState | null>(null);

export function DiotProvider({ children, inicial = 'piloto' }: { children: ReactNode; inicial?: DiotMode }) {
  const [mode, setMode] = useState<DiotMode>(inicial);
  return <DiotContext.Provider value={{ mode, setMode }}>{children}</DiotContext.Provider>;
}

export function useDiot(): DiotState {
  const ctx = useContext(DiotContext);
  if (!ctx) throw new Error('useDiot fuera de DiotProvider');
  return ctx;
}
