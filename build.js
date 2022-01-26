import esbuild from 'esbuild'
import GlobalsPlugin from 'esbuild-plugin-globals'

esbuild.build({
  entryPoints: ['src/index.ts'],
  outfile: 'dist/nanopay.js',
  bundle: true,
  format: 'iife',
  platform: 'browser',
  plugins: [
    GlobalsPlugin({
      bsv: 'bsvjs'
    })
  ]
})