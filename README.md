# ember-cli-deploy-github-pages

> An ember-cli-deploy plugin to deploy to github pages.

*Please Note:* This is a work in progress and has not been published to
npm yet.

## What is an ember-cli-deploy plugin?

A plugin is an addon that can be executed as a part of the ember-cli-deploy pipeline. A plugin will implement one or more of the ember-cli-deploy's pipeline hooks.

For more information on what plugins are and how they work, please refer to the [Plugin Documentation][1].

## Quick Start
To get up and running quickly, do the following:

- Ensure [ember-cli-deploy-build][2] is installed and configured.

- Install this plugin

```bash
$ ember install ember-cli-deploy-github-pages
```

- Run the pipeline

```bash
$ ember deploy
```

## Installation
Run the following command in your terminal:

```bash
ember install ember-cli-deploy-github-pages
```

### Adjusting the Asset URL for Project Pages

If you are deploying this as [ project pages ](https://help.github.com/articles/user-organization-and-project-pages/) (`e.g.
johnnycoder.github.io/my-cool-project`) you'll need to update your `baseURL` to
serve your assets from the correct folder after deploy.

```javascript
// config/environment.js

if (environment === 'production') {
  ENV.baseURL = '/my-cool-project'; // make sure to use the actual name of your
  project
}
```

_Note:_ If you are deploying as an organization page, user page, or using a
CNAME to serve from a root domain (e.g. `johnnycoders-super-cool-project.com`),
then you do not need to modify the root URL.

## ember-cli-deploy Hooks Implemented

For detailed information on what plugin hooks are and how they work, please refer to the [Plugin Documentation][1].

- `willDeploy`
- `deploy`

## Configuration Options

For detailed information on how configuration of plugins works, please refer to the [Plugin Documentation][1].

## Running Tests

- `npm test`

[1]: http://ember-cli.github.io/ember-cli-deploy/plugins "Plugin Documentation"
[2]: https://github.com/ember-cli-deploy/ember-cli-deploy-build "ember-cli-deploy-build"
[3]: https://github.com/ember-cli/ember-cli-deploy "ember-cli-deploy"
[4]: https://github.com/ember-cli-deploy/ember-cli-deploy-revision-data "ember-cli-deploy-revision-data"


For more information on using ember-cli, visit [http://www.ember-cli.com/](http://www.ember-cli.com/).
