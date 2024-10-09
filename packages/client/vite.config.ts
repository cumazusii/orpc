import unplugin from '@dinwwwh/unplugin'
import { defineConfig } from 'vite'

export default defineConfig({
  ssr: {
    noExternal: ['radash'],
  },
  build: {
    ssr: true,
    lib: {
      entry: {
        index: 'src/index.ts',
      },
      formats: ['es'],
    },
  },
  plugins: [unplugin.vite()],
})
