// Genera y conserva el escenario actual (re-generable por modo/nivel).
import { useMemo, useState } from 'react';
import { generarScenarioDIOT } from '../../lib/diot/scenarioEngine';
import type { DiotMode, ScenarioDIOT } from '../../lib/diot/types';

export function useDiotScenario(mode: DiotMode, nivel = 1) {
  const [semilla, setSemilla] = useState(0);
  const scenario: ScenarioDIOT = useMemo(
    () => generarScenarioDIOT(mode, nivel),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mode, nivel, semilla],
  );
  void semilla;
  return { scenario, regenerar: () => setSemilla((s) => s + 1) };
}
