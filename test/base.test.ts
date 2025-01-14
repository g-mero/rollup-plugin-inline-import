import babel from '@rollup/plugin-babel'
import commonjs from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'
import { rollup, type RollupOptions } from 'rollup'
import css from '../src/index.js'

const inputOptions: RollupOptions = {
  input: './test/test.ts',
  output: {
    file: './test/out/test.js',
    format: 'iife',
    name: 'test',
  },
  plugins: [
    css(),
    resolve({
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
    }),
    commonjs(),
    babel({
      babelHelpers: 'bundled',
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
      exclude: 'mode_modules/**',
    }),

  ],
}

async function build() {
  const bundle = await rollup(inputOptions)
  await bundle.write({
    file: './test/out/test.js',
    format: 'iife',
    name: 'test',
  })
  await bundle.close()
}

build()
