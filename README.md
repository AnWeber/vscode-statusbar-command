# statusbar-commands

extend the status bar with own commands.

## Usage

* configure setting statusbar_command.commands (scope workspace)
* configure setting statusbar_command.applicationCommands (scope application)

## Settings
* statusbar_command.commands and statusbar_command.applicationCommands are an array of [StatusBarItemConfig](https://github.com/AnWeber/vscode-statusbar-command/blob/main/src/statusBarItemConfig.ts). Each entry is converted to a StatusBarItem.


## Example
```
{
"statusbar_command.commands": [
    {
      "text": "$(gear)",
      "tooltip": "workspace settings",
      "id": "sbc_settings",
      "name": "settings",
      "priority": -1000,
      "alignment": "right",
      "command": "workbench.action.openWorkspaceSettings"
    },
    {
        "text": "$(file-text)",
        "id": "sbc_format",
        "name": "formatDocument",
        "tooltip": "format",
        "alignment": "left",
        "priority": 100,
        "include": "\\.js",
        "command": "editor.action.formatDocument"
    },
    {
      "text": "TS",
      "tooltip": "Typescript Server neustarten",
      "alignment": "right",
      "priority": 1000,
      "id": "sbc_ts",
      "name": "Typescript Server neustarten",
      "include": "\\.[ts|vue]",
      "command": "typescript.restartTsServer"
    },
    {
      "text": "$(terminal)",
      "tooltip": "Terminal",
      "id": "sbc_terminal",
      "name": "Terminal",
      "alignment": "right",
      "priority": 1000,
      "command": "workbench.action.terminal.toggleTerminal"
    },{
        "text": "ctrl+h",
        "id": "runTask",
        "name": "runTask",
        "command": "workbench.action.tasks.runTask",
        "arguments": ["taskName"]
    }
  ]
}
```

## Changelog

* v1.8.0
    * arguments prefixed with number|, float|, activeDocument|, activeTextEditor| are converted
* v1.7.1
    * removed defaults commands
* v1.7.0
    * support id and name of StatusbarItem
* v1.6.0
    * allow application commands, which are not overriden by workspace commands
* v1.5.0
    * make command optional
* v1.4.0
    * support workspace trust
    * support virtual workspaces
    * fix lodash security warning
* v1.3.0
    * regex for filter file path added
* v1.2.0
    * arguments prefixed with uri|, position|, range| gets to type (useful for command vscode.openFolder)
* v1.1.0
    * support backgroundcolor (only statusBarItem.errorBackground at the moment)
* v1.0.0
    * support arguments
    * filter options extended
* v0.0.3
    * error in c

* v0.0.1
    * initial release

## License

MIT © Andreas Weber

