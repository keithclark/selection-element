import { terser } from 'rollup-plugin-terser';
import * as pkg from './package.json';

export default [
  {
    input: 'src/SelectionElement.js',
    output: {
      file: `dist/SelectionElement-${pkg.version}.esm.js`,
      format: 'esm'
    }
  },
  {
    input: 'src/SelectionElement.js',
    output: {
      file: `dist/SelectionElement-${pkg.version}.esm.min.js`,
      format: 'esm'
    },
    plugins: [terser({
      format: {
        preamble: `/*! ${pkg.name} v${pkg.version} - ${pkg.author} - ${pkg.license} license */`
      }
    })]
  }
];
