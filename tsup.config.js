import { defineConfig } from 'tsup'

export default defineConfig({
  entry: { index: 'src/index.js', core: 'src/core/index.js' },
  format: ['esm', 'cjs'],
  external: ['react', 'react-dom', 'react/jsx-runtime', '@phosphor-icons/react'],
  esbuildOptions(o) {
    o.jsx = 'automatic'
  },
  clean: true,
  sourcemap: true,
  onSuccess: 'cp src/styles.css dist/styles.css && cp types/index.d.ts dist/index.d.ts && cp types/index.d.ts dist/index.d.cts && cp types/core.d.ts dist/core.d.ts && cp types/core.d.ts dist/core.d.cts'
})
