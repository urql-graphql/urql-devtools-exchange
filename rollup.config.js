import { basename } from 'path';
import { DEFAULT_EXTENSIONS } from '@babel/core';
import json from '@rollup/plugin-json';
import commonjs from 'rollup-plugin-commonjs';
import nodeResolve from 'rollup-plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';
import buble from 'rollup-plugin-buble';
import babel from 'rollup-plugin-babel';
import { terser } from 'rollup-plugin-terser';

const pkgInfo = require('./package.json');
const { main, peerDependencies, dependencies } = pkgInfo;
const name = basename(main, '.js');

const external = ['dns', 'fs', 'path', 'url'];

if (pkgInfo.peerDependencies) {
  external.push(...Object.keys(peerDependencies));
}

if (pkgInfo.dependencies) {
  external.push(...Object.keys(dependencies));
}

const externalPredicate = new RegExp(`^(${external.join('|')})($|/)`);
const externalTest = (id) => {
  if (id === 'babel-plugin-transform-async-to-promises/helpers') {
    return false;
  }

  return externalPredicate.test(id);
};

const terserPretty = terser({
  sourcemap: true,
  warnings: true,
  ecma: 5,
  keep_fnames: true,
  ie8: false,
  compress: {
    pure_getters: true,
    toplevel: true,
    booleans_as_integers: false,
    keep_fnames: true,
    keep_fargs: true,
    if_return: false,
    ie8: false,
    sequences: false,
    loops: false,
    conditionals: false,
    join_vars: false,
  },
  mangle: false,
  output: {
    beautify: true,
    braces: true,
    indent_level: 2,
  },
});

const terserMinified = terser({
  sourcemap: true,
  warnings: true,
  ecma: 5,
  ie8: false,
  toplevel: true,
  compress: {
    keep_infinity: true,
    pure_getters: true,
    passes: 10,
  },
  output: {
    comments: false,
  },
});

const makePlugins = (isProduction = false) => [
  nodeResolve({
    mainFields: ['module', 'jsnext', 'main'],
    browser: true,
  }),
  commonjs({
    ignoreGlobal: true,
    include: /\/node_modules\//,
  }),
  typescript({
    typescript: require('typescript'),
    cacheRoot: './node_modules/.cache/.rts2_cache',
    useTsconfigDeclarationDir: true,
    tsconfigDefaults: {
      compilerOptions: {
        sourceMap: true,
      },
    },
    tsconfigOverride: {
      exclude: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'src/**/test-utils/*'],
      compilerOptions: {
        declaration: !isProduction,
        declarationDir: './dist/types/',
        target: 'es6',
      },
    },
  }),
  json(),
  buble({
    transforms: {
      unicodeRegExp: false,
      dangerousForOf: true,
      dangerousTaggedTemplateString: true,
    },
    objectAssign: 'Object.assign',
    exclude: ['node_modules/**'],
  }),
  babel({
    babelrc: false,
    extensions: [...DEFAULT_EXTENSIONS, 'ts', 'tsx'],
    exclude: 'node_modules/**',
    presets: [],
    plugins: [
      ['babel-plugin-closure-elimination', {}],
      ['@babel/plugin-transform-object-assign', {}],
      [
        'babel-plugin-transform-async-to-promises',
        {
          inlineHelpers: true,
          externalHelpers: true,
        },
      ],
    ],
  }),
  isProduction ? terserMinified : terserPretty,
];

const config = {
  input: './src/index.ts',
  external: externalTest,
  treeshake: {
    propertyReadSideEffects: false,
  },
};

export default [
  {
    ...config,
    plugins: makePlugins(false),
    output: [
      {
        sourcemap: true,
        freeze: false,
        file: `./dist/${name}.js`,
        format: 'cjs',
      },
      {
        sourcemap: true,
        freeze: false,
        file: `./dist/${name}.es.js`,
        format: 'esm',
      },
    ],
  },
  {
    ...config,
    plugins: makePlugins(true),
    output: [
      {
        sourcemap: true,
        freeze: false,
        file: `./dist/${name}.min.js`,
        format: 'cjs',
      },
      {
        sourcemap: true,
        freeze: false,
        file: `./dist/${name}.es.min.js`,
        format: 'esm',
      },
    ],
  },
];
