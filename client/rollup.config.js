import babel from 'rollup-plugin-babel'

export default {
  entry: 'src/index.js',
  dest: 'bundle.js',
  format: 'iife',
  plugins: [
    babel({
      presets: ['es2015-rollup'],
      plugins: ['external-helpers', 'transform-flow-strip-types', 'transform-class-properties'],
      exclude: 'node_modules/**'
    })]
}
