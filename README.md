<div align="center">
  <img alt="logo" src="https://raw.githubusercontent.com/FormidableLabs/urql-devtools/master/src/assets/icon.svg?sanitize=true" />
  <h1>Urql Devtools Exchange</h1>
  
  <a href="https://spectrum.chat/urql">
    <img alt="Spectrum badge" src="https://withspectrum.github.io/badge/badge.svg" />
  </a>

  <br />
  <br />
</div>

The official devtools exchange for use with [Urql Devtools](https://github.com/FormidableLabs/urql-devtools).

### Requirements

- [Urql](https://github.com/FormidableLabs/urql) _v1.2.0_ (or later)
- [Urql Devtools](https://github.com/FormidableLabs/urql-devtools)

### Usage

Install the devtools exchange

```sh
# Yarn
yarn add -D @urql/devtools

# Npm
npm i -D @urql/devtools
```

Add the devtools exchange to your Urql client

```tsx
// ...
import {
  cacheExchange,
  createClient,
  dedupExchange,
  fetchExchange
} from "urql";
import { devtoolsExchange } from "@urql/devtools";

// ...
const client = createClient({
  url: "http://localhost:3001/graphql",
  exchanges: [dedupExchange, devtoolsExchange, cacheExchange, fetchExchange]
});
```

### Contributing

Have experience working with devtools extensions or want to get involved? Check out our [contributing](https://github.com/FormidableLabs/urql-devtools/blob/master/CONTRIBUTING.md) docs to get started.
