# Development guide

There are a lot of moving parts to devtools so here's a quick runthrough to make your life easier!

## ❓ What does this do?

Under the hood, this exchange has a small set of responsibilities:

- Listen for events in `urql` and message them to [devtools](https://github.com/FormidableLabs/urql-devtools/)
- Listen for events from devtools and trigger side effects / response messages

## 👩‍💻 Getting started

Here are a few useful approaches to get started developing.

### Shallow environment

The easiest way to get started on a change in devtools is in a testing shallow environment.

```sh
yarn test --watch
```

With a shallow environment, you can:

- quickly simulate events from `urql`
- quickly simulate messages from devtools
- increase test coverage!

### Integrated browser environment

To test the full suite (from the exchange all the way to the devtools extension), an example project can be used.

#### 1. Run a watched build

Run the following command to start a watched build.

```sh
yarn start
```

> Note: You'll want to run this command in a dedicated shell

#### 2. Initialize the example repo

This command pulls an example repo from `urql` and adds your watched build as a dependency.

```sh
yarn example:init
```

#### 3. Start the example

Starting the example will run the example server with the built exchange.

```sh
yarn example:start
```

> Note: Changes to the exchange will automatically cause the example to be rebuilt

#### 4. Open the example

Navigate to the example you just started (usually [http://localhost:5000](http://localhost:5000)) and interact with the site. If you have a running version of devtools, you should see updates.

### Integrated standalone environment

TBD

## 🚀 Publishing releases

Anyone with write access to the repository can publish a release. The steps are as follows.

#### 1. Update the version

Set the version attribute in the _package.json_

#### 2. Build the new changelog

> Note: This step requires docker

```
yarn changelog --future-release [release version] --token [your github oauth token]
```

#### 3. Push/merge new version to master

```
git add package.json CHANGELOG.md
git commit -m "Version v0.0.0"
git push origin master
```

#### 4. Publish new release

**Warning:** This will publish a new release to the chrome app store.

_(replace v0.0.0 with your new version)_

```
git fetch origin master
git tag v0.0.0 origin/master
git push origin v0.0.0
```

#### 5. Create a new release on Github

Finally, navigate to [releases](https://github.com/FormidableLabs/urql-devtools/releases) and choose _draft a new release_.

- You can copy and paste the release notes from the changelog you just generated
- Attatching the published assets is also a good idea - `wget $(npm view @urql/devtools dist.tarball)`
