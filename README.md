<div align="center">
  <img alt="logo" src="https://raw.githubusercontent.com/FormidableLabs/urql-devtools/master/src/assets/icon.svg?sanitize=true" />
  <h1>urql devtools exchange</h1>

  <a href="https://spectrum.chat/urql">
    <img alt="Spectrum badge" src="https://withspectrum.github.io/badge/badge.svg" />
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
import { defaultExchanges, createClient } from "urql";
import { devtoolsExchange } from "@urql/devtools";

// ...
const client = createClient({
  url: "http://localhost:3001/graphql",
  exchanges: [
    // replacing devtools with a passthrough exchange for production environments
    process.env.NODE_ENV !== "production"
      ? devtoolsExchange
      : ({ forward }) => forward,
    ...defaultExchanges
  ]
});
```

### Contributing

Have experience working with devtools extensions or want to get involved? Check out our [contributing](https://github.com/FormidableLabs/urql-devtools/blob/master/CONTRIBUTING.md) docs to get started.
