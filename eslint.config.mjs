import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';

export default defineConfig([
  ...nextVitals,
  globalIgnores(['.next/**', 'node_modules/**', 'out/**', 'build/**', 'next-env.d.ts']),
  // These React 19 compiler checks were not part of the Next 14 baseline.
  // Keep them visible as migration debt while preserving the existing lint gate.
  {
    rules: {
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/refs': 'warn',
    },
  },
]);
