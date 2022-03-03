<div align="center">
  <img alt="logo" width=200 src="https://raw.githubusercontent.com/FormidableLabs/urql-devtools/master/src/assets/icon.svg?sanitize=true" />
  <h1>Urql Devtools Exchange</h1>
  <p>The official devtools exchange for use with the <a href="https://github.com/FormidableLabs/urql-devtools">Urql Devtools</a> browser extension</p>
  <a href="https://circleci.com/gh/FormidableLabs/workflows/urql-devtools-exchange">
    <img alt="CircleCI Build Status" src="https://badgen.net/circleci/github/FormidableLabs/urql-devtools-exchange/master?label=build" />
  </a>
  <a href="https://www.npmjs.com/package/@urql/devtools">
    <img alt="NPM Release" src="https://badgen.net/npm/v/@urql/devtools" />
  </a>
  <a href="https://spectrum.chat/urql">
    <img alt="Spectrum badge" src="https://badgen.net/badge/chat/spectrum/purple" />
  </a>
  <a href="https://github.com/FormidableLabs/urql-devtools-exchange/blob/master/LICENSE">
    <img alt="Licence MIT" src="https://badgen.net/github/license/FormidableLabs/urql-devtools-exchange" />
  </a>
</div>

## About

A first-party exchange for [urql](https://github.com/FormidableLabs/urql) which interfaces with the [Urql Devtools](https://github.com/FormidableLabs/urql-devtools) browser extension.

## Usage

Install this package

```sh
# npm
npm i @urql/devtools

# yarn
yarn add @urql/devtools
```

Add the exchange to your `urql` client

```js
import { createClient, defaultExchanges } from 'urql';
import { devtoolsExchange } from '@urql/devtools';

const client = createClient({
  url: 'http://localhost:3001/graphql',
  exchanges: [devtoolsExchange, ...defaultExchanges],
});
```

> Note: we recommended putting this exchange before all other exchanges (as demonstrated above)

## Contributing

Have experience working with devtools extensions or want to get involved? Check out our [contributing](https://github.com/FormidableLabs/urql-devtools/blob/master/CONTRIBUTING.md) docs to get started.


## Maintenance Status

**Active:** Formidable is actively working on this project, and we expect to continue for work for the foreseeable future. Bug reports, feature requests and pull requests are welcome.
