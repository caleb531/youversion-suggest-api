import copy from 'rollup-plugin-copy';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';

export default [
  // We need to compile the type declaration file as a separate input/output
  // entry because otherwise (if we combine the dts() plugin with the ESM
  // compilation), the dts() plugin will overwrite the contents of our ESM
  // bundle with the contents of the definitions file (even if we define a
  // separte output path); it's also important that the types are compiled
  // first, so that TypeScript doesn't complain when building the subsequent
  // library bindle
  {
    input: 'src/index.ts',
    output: [
      {
        file: 'dist/index.d.ts',
        format: 'es'
      },
      {
        file: 'dist/index.d.ts',
        format: 'es'
      }
    ],
    plugins: [dts()]
  },
  {
    input: 'src/index.ts',
    external: ['cheerio', 'fs/promises', 'node-fetch', 'path', 'url'],
    output: [
      {
        file: 'dist/index.js',
        format: 'es',
        sourcemap: true
      }
    ],
    plugins: [
      json(),
      copy({
        targets: [
          {
            src: ['src/data/{*.md,bible}'],
            dest: 'dist/data'
          }
        ]
      }),
      commonjs(),
      typescript()
    ]
  }
];
