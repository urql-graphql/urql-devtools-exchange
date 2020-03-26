<div align="center">
  <img alt="logo" src="https://raw.githubusercontent.com/FormidableLabs/urql-devtools/master/src/assets/icon.svg?sanitize=true" />
  <h1>urql devtools exchange</h1>
  <a href="https://app.circleci.com/pipelines/github/FormidableLabs/urql-devtools-exchange">
    <img src="https://img.shields.io/circleci/build/github/FormidableLabs/urql-devtools-exchange" alt="build" />
  </a>
  <a href="https://npmjs.com/package/@urql/devtools">
    <img src="https://img.shields.io/npm/v/@urql/devtools" alt="version" />
  </a>
  <a href="https://bundlephobia.com/result?p=@urql/devtools">
    <img src="https://img.shields.io/bundlephobia/minzip/@urql/devtools" alt="size" />
  </a>
  <a href="https://codecov.io/gh/formidablelabs/urql-devtools-exchange">
    <img src="https://img.shields.io/codecov/c/github/FormidableLabs/urql-devtools-exchange" alt="coverage">
  </a>
  <a href="https://github.com/formidablelabs/urql-devtools-exchange/blob/master/LICENSE">
    <img src="https://img.shields.io/npm/l/@urql/devtools" alt="licence">
  </a>
  <br />
  <br />
</div>

The official devtools exchange for use with [urql devtools chrome extension](https://github.com/FormidableLabs/urql-devtools).

### Requirements

- [urql](https://github.com/FormidableLabs/urql) _v1.2.0_ (or later)
- [urql devtools chrome extension](https://github.com/FormidableLabs/urql-devtools)

### Usage

Install the devtools exchange

```sh
# yarn
yarn add -D @urql/devtools

# npm
npm i -D @urql/devtools
```

Add the devtools exchange to your urql client

```tsx
// ...
import { defaultExchanges, createClient } from '@urql/core';
import { devtoolsExchange } from '@urql/devtools';

// ...
const client = createClient({
  url: 'http://localhost:3001/graphql',
  exchanges: [
    // replacing devtools with a passthrough exchange for production environments
    process.env.NODE_ENV !== 'production'
      ? devtoolsExchange
      : ({ forward }) => forward,
    ...defaultExchanges,
  ],
});
```

### Contributing

Have experience working with devtools extensions or want to get involved? Check out our [contributing](https://github.com/FormidableLabs/urql-devtools/blob/master/CONTRIBUTING.md) docs to get started.
