import copy from 'rollup-plugin-copy';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';

export default [
  {
    input: 'src/index.ts',
    external: ['lodash-es', 'cheerio', 'fs/promises', 'node-fetch', 'path', 'url'],
    output: [
      {
        file: 'dist/index.cjs.js',
        format: 'cjs',
        sourcemap: true
      },
      {
        file: 'dist/index.es.js',
        format: 'es',
        sourcemap: true
      }
    ],
    plugins: [
      json(),
      copy({
        targets: [
          {
            src: ['src/data/*.md', 'src/data/bible'],
            dest: 'dist/data'
          }
        ]
      }),
      commonjs(),
      typescript()
    ]
  },
  // We need to compile the type declaration file as a separate input/output
  // entry because otherwise (if we combine the dts() plugin with the CJS/ES
  // compilation), the dts() plugin will overwrite the contents of our CJS and
  // ES bundles with the contents of the definitions file (even if we define a
  // separte output path)
  {
    input: 'src/index.ts',
    output: [
      {
        file: 'dist/index.d.ts',
        format: 'es'
      }
    ],
    plugins: [dts()]
  }
];
