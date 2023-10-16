export default {
  extensions: {
    ts: 'module'
  },
  // By default, AVA tests all JavaScript files, including our test utilities
  // module (which it reports as obviously containing no tests); to fix this, we must explicitly instruct AVA to only test files in our tests/ directory which match *.spec.ts
  files: ['tests/**/*.spec.ts'],
  // ESM loaders (via the --loader or --experimental-loader flag) are still
  // experimental and may break in future versions of Node; for example, Node
  // v20 made a breaking change that isolates each loader into its own separate
  // processe, thereby breaking the ability to import TypeScript modules in Node
  // (at least for the time being); see
  // <https://github.com/TypeStrong/ts-node/issues/1997> for more details
  nodeArguments: ['--experimental-loader=tsx', '--require=source-map-support/register', '--no-warnings']
};
