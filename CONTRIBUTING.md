# Contributing to `@urql/devtools`

Thanks for contributing! We want to ensure that `@urql/devtools` evolves by seeing continuous improvements and enhancements, no matter how small or big they might be.

## How to contribute?

We follow fairly standard but lenient rules around pull requests and issues. Please pick a title that describes your change briefly, optionally in the imperative mood if possible.

If you have an idea for a feature or want to fix a bug, consider opening an issue first. We're also happy to discuss and help you open a PR and get your changes in!

## How do I set up the project?

Luckily it's not hard to get started. You can install dependencies using `yarn`. Please don't use `npm` to respect the lockfile.

```sh
yarn
```

Run `yarn start` to initiate the Webpack and TypeScript build (for the extension and exchange, respectively).

```sh
yarn start
```

### Start an urql example repo

Devtools will only be accessible if a development instance of `urql` is running.

Clone the [Urql repo](https://github.com/FormidableLabs/urql).

Change the client configuration in the example to look like this:

```tsx
// ...
import {
  cacheExchange,
  createClient,
  dedupExchange,
  fetchExchange,
} from '@urql/core';
import { devtoolsExchange } from '<path-to-devtools-dist>/exchange';

// ...
const client = createClient({
  url: 'http://localhost:3001/graphql',
  exchanges: [dedupExchange, devtoolsExchange, cacheExchange, fetchExchange],
});
```

Start the example repo with `yarn start`.

## How do I publish a new version?

### 1. Update the version

Set the version attribute in the _package.json_

### 2. Build the new changelog

> Note: This step requires docker

```
yarn changelog --future-release [release version] --token [your github oauth token]
```

### 3. Push/merge new version to master

```
git add package.json CHANGELOG.md
git commit -m "Version v0.0.0"
git push origin master
```

### 4. Publish new release

**Warning:** This will publish a new release to the chrome app store.

_(replace v0.0.0 with your new version)_

```
git fetch origin master
git tag v0.0.0 origin/master
git push origin v0.0.0
```

### 5. Create a new release on Github

Finally, navigate to [releases](https://github.com/FormidableLabs/urql-devtools/releases) and choose _draft a new release_.

- You can copy and paste the release notes from the changelog you just generated
- Attatching the published assets is also a good idea - `wget $(npm view @urql/devtools dist.tarball)`
