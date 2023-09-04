ormpipe
=================

darwinia ormp protocol relay program

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g ormpipe
$ ormpipe COMMAND
running command...
$ ormpipe (--version)
ormpipe/0.0.0 linux-x64 node-v18.14.2
$ ormpipe --help [COMMAND]
USAGE
  $ ormpipe COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`ormpipe hello PERSON`](#ormpipe-hello-person)
* [`ormpipe hello world`](#ormpipe-hello-world)
* [`ormpipe help [COMMANDS]`](#ormpipe-help-commands)
* [`ormpipe plugins`](#ormpipe-plugins)
* [`ormpipe plugins:install PLUGIN...`](#ormpipe-pluginsinstall-plugin)
* [`ormpipe plugins:inspect PLUGIN...`](#ormpipe-pluginsinspect-plugin)
* [`ormpipe plugins:install PLUGIN...`](#ormpipe-pluginsinstall-plugin-1)
* [`ormpipe plugins:link PLUGIN`](#ormpipe-pluginslink-plugin)
* [`ormpipe plugins:uninstall PLUGIN...`](#ormpipe-pluginsuninstall-plugin)
* [`ormpipe plugins:uninstall PLUGIN...`](#ormpipe-pluginsuninstall-plugin-1)
* [`ormpipe plugins:uninstall PLUGIN...`](#ormpipe-pluginsuninstall-plugin-2)
* [`ormpipe plugins update`](#ormpipe-plugins-update)

## `ormpipe hello PERSON`

## `ormpipe help [COMMANDS]`

Display help for ormpipe.

```
USAGE
  $ ormpipe help [COMMANDS] [-n]

ARGUMENTS
  COMMANDS  Command to show help for.

FLAGS
  -n, --nested-commands  Include all nested commands in the output.

DESCRIPTION
  Display help for ormpipe.
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v5.2.17/src/commands/help.ts)_

## `ormpipe plugins`

List installed plugins.

```
USAGE
  $ ormpipe plugins [--json] [--core]

FLAGS
  --core  Show core plugins.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  List installed plugins.

EXAMPLES
  $ ormpipe plugins
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v3.2.6/src/commands/plugins/index.ts)_

## `ormpipe plugins:install PLUGIN...`

Installs a plugin into the CLI.

```
USAGE
  $ ormpipe plugins:install PLUGIN...

ARGUMENTS
  PLUGIN  Plugin to install.

FLAGS
  -f, --force    Run yarn install with force flag.
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Installs a plugin into the CLI.
  Can be installed from npm or a git url.

  Installation of a user-installed plugin will override a core plugin.

  e.g. If you have a core plugin that has a 'hello' command, installing a user-installed plugin with a 'hello' command
  will override the core plugin implementation. This is useful if a user needs to update core plugin functionality in
  the CLI without the need to patch and update the whole CLI.


ALIASES
  $ ormpipe plugins add

EXAMPLES
  $ ormpipe plugins:install myplugin 

  $ ormpipe plugins:install https://github.com/someuser/someplugin

  $ ormpipe plugins:install someuser/someplugin
```

## `ormpipe plugins:inspect PLUGIN...`

Displays installation properties of a plugin.

```
USAGE
  $ ormpipe plugins:inspect PLUGIN...

ARGUMENTS
  PLUGIN  [default: .] Plugin to inspect.

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Displays installation properties of a plugin.

EXAMPLES
  $ ormpipe plugins:inspect myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v3.2.6/src/commands/plugins/inspect.ts)_

## `ormpipe plugins:install PLUGIN...`

Installs a plugin into the CLI.

```
USAGE
  $ ormpipe plugins:install PLUGIN...

ARGUMENTS
  PLUGIN  Plugin to install.

FLAGS
  -f, --force    Run yarn install with force flag.
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Installs a plugin into the CLI.
  Can be installed from npm or a git url.

  Installation of a user-installed plugin will override a core plugin.

  e.g. If you have a core plugin that has a 'hello' command, installing a user-installed plugin with a 'hello' command
  will override the core plugin implementation. This is useful if a user needs to update core plugin functionality in
  the CLI without the need to patch and update the whole CLI.


ALIASES
  $ ormpipe plugins add

EXAMPLES
  $ ormpipe plugins:install myplugin 

  $ ormpipe plugins:install https://github.com/someuser/someplugin

  $ ormpipe plugins:install someuser/someplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v3.2.6/src/commands/plugins/install.ts)_

## `ormpipe plugins:link PLUGIN`

Links a plugin into the CLI for development.

```
USAGE
  $ ormpipe plugins:link PLUGIN

ARGUMENTS
  PATH  [default: .] path to plugin

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Links a plugin into the CLI for development.
  Installation of a linked plugin will override a user-installed or core plugin.

  e.g. If you have a user-installed or core plugin that has a 'hello' command, installing a linked plugin with a 'hello'
  command will override the user-installed or core plugin implementation. This is useful for development work.


EXAMPLES
  $ ormpipe plugins:link myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v3.2.6/src/commands/plugins/link.ts)_

## `ormpipe plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ ormpipe plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ ormpipe plugins unlink
  $ ormpipe plugins remove
```

## `ormpipe plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ ormpipe plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ ormpipe plugins unlink
  $ ormpipe plugins remove
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v3.2.6/src/commands/plugins/uninstall.ts)_

## `ormpipe plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ ormpipe plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ ormpipe plugins unlink
  $ ormpipe plugins remove
```

## `ormpipe plugins update`

Update installed plugins.

```
USAGE
  $ ormpipe plugins update [-h] [-v]

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Update installed plugins.
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v3.2.6/src/commands/plugins/update.ts)_
<!-- commandsstop -->
