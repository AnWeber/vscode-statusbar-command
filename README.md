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


## License
[MIT License](LICENSE)

## Change Log
[CHANGELOG](CHANGELOG.md)

