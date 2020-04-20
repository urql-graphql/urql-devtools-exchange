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

---

## Contributor Covenant Code of Conduct

### Our Pledge

In the interest of fostering an open and welcoming environment, we as
contributors and maintainers pledge to making participation in our project and
our community a harassment-free experience for everyone, regardless of age, body
size, disability, ethnicity, gender identity and expression, level of experience,
nationality, personal appearance, race, religion, or sexual identity and
orientation.

### Our Standards

Examples of behavior that contributes to creating a positive environment
include:

- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

Examples of unacceptable behavior by participants include:

- The use of sexualized language or imagery and unwelcome sexual attention or
  advances
- Trolling, insulting/derogatory comments, and personal or political attacks
- Public or private harassment
- Publishing others' private information, such as a physical or electronic
  address, without explicit permission
- Other conduct which could reasonably be considered inappropriate in a
  professional setting

### Our Responsibilities

Project maintainers are responsible for clarifying the standards of acceptable
behavior and are expected to take appropriate and fair corrective action in
response to any instances of unacceptable behavior.

Project maintainers have the right and responsibility to remove, edit, or
reject comments, commits, code, wiki edits, issues, and other contributions
that are not aligned to this Code of Conduct, or to ban temporarily or
permanently any contributor for other behaviors that they deem inappropriate,
threatening, offensive, or harmful.

### Scope

This Code of Conduct applies both within project spaces and in public spaces
when an individual is representing the project or its community. Examples of
representing a project or community include using an official project e-mail
address, posting via an official social media account, or acting as an appointed
representative at an online or offline event. Representation of a project may be
further defined and clarified by project maintainers.

### Enforcement

Instances of abusive, harassing, or otherwise unacceptable behavior may be
reported by contacting the project team at coc@formidable.com. All
complaints will be reviewed and investigated and will result in a response that
is deemed necessary and appropriate to the circumstances. The project team is
obligated to maintain confidentiality with regard to the reporter of an incident.
Further details of specific enforcement policies may be posted separately.

Project maintainers who do not follow or enforce the Code of Conduct in good
faith may face temporary or permanent repercussions as determined by other
members of the project's leadership.

### Attribution

This Code of Conduct is adapted from the [Contributor Covenant][homepage], version 1.4,
available at [http://contributor-covenant.org/version/1/4][version]

[homepage]: http://contributor-covenant.org
[version]: http://contributor-covenant.org/version/1/4/
