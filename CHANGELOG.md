## v2.5.1
* hide statusbar command with filter if no file is open

## v2.5.0
* script is embedded in an async function to allow await
* use [`onStartupFinished` Activation Event](https://code.visualstudio.com/api/references/activation-events#onStartupFinished) instead of `*` to allow faster startup of VSCode

## v2.4.0
* add new config option scriptFile

## v2.3.1
* fix issue with access to require in script (#21)

## v2.3.0
* allow require calls in script region (#21)

## v2.2.1
* fix regex patterns (include, exclude,...) not considered on startup (#19)

## v2.2.0
* add script and scriptEvents support
  * scriptsEvents is a list ov [vscode events](https://code.visualstudio.com/api/references/vscode-api#Event%3CT%3E) to which is subscribed to
  * script is a Javascript funtion which is executed for every subscribed event. The following properties can be accessed.

  | name | description |
  | - | - |
  | vscode | [VSCode API](https://code.visualstudio.com/api/references/vscode-api) |
  | statusBarItem | current [StatusBarItem](https://code.visualstudio.com/api/references/vscode-api#StatusBarItem) |
  * example:

    ```json
    {
      "alignment": "left",
      "command": "github.copilot.toggleCopilot",
      "id": "sbc.copilot",
      "text": "Github Copilot",
      "scriptEvents": ["vscode.workspace.onDidChangeConfiguration"],
      "script": "statusBarItem.text = vscode.workspace.getConfiguration('github.copilot.inlineSuggest').enable ? '$(github)' : '$(github-inverted)'"
    }

    ```
  * feature only available in NodeJS Environment (not in vscode.dev or github.dev)

## v2.1.0
* support warning background color

## v2.0.0
* support for github.dev (experimental)
* use esbuild instead of webpack


## v1.10.0
* add optional flag property for every regex


## v1.9.1
* fix filterLanguageid (string instead of regex)

## v1.9.0
* remove default settings


## v1.8.0
* arguments prefixed with number|, float|, activeDocument|, activeTextEditor| are converted

## v1.7.1
* removed defaults commands

## v1.7.0
* support id and name of StatusbarItem

## v1.6.0
* allow application commands, which are not overriden by workspace commands
## v1.5.0
* make command optional
## v1.4.0
* support workspace trust
* support virtual workspaces
* fix lodash security warning

## v1.3.0
* regex for filter file path added

## v1.2.0
* arguments prefixed with uri|, position|, range| gets to type (useful for command vscode.openFolder)

## v1.1.0
* support backgroundcolor (only statusBarItem.errorBackground at the moment

## v1.0.0
* support arguments
* filter options extended

## v0.0.3
* error in c

## v0.0.1
* initial release