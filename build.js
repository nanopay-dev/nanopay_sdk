import esbuild from 'esbuild'
import GlobalsPlugin from 'esbuild-plugin-globals'

esbuild.build({
  entryPoints: ['src/index.ts'],
  outfile: 'dist/nanopay.min.js',
  bundle: true,
  format: 'iife',
  platform: 'browser',
  target: 'es6',
  minify: true,
  keepNames: true,
  sourcemap: true,
  plugins: [
    GlobalsPlugin({
      bsv: 'bsvjs'
    })
  ]
})

let makeAllPackagesExternalPlugin = {
  name: 'make-all-packages-external',
  setup(build) {
    let filter = /^[^.\/]|^\.[^.\/]|^\.\.[^\/]/ // Must not start with "/" or "./" or "../"
    build.onResolve({ filter }, args => ({ path: args.path, external: true }))
  },
}

esbuild.build({
  entryPoints: ['src/index.ts'],
  outfile: 'dist/nanopay.js',
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'node12',
  plugins: [
    makeAllPackagesExternalPlugin
  ]
})
