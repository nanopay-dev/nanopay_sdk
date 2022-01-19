const esbuild = require('esbuild')
const GlobalsPlugin = require('esbuild-plugin-globals')

esbuild.build({
  entryPoints: ['src/index.browser.ts'],
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