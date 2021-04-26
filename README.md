# statusbar-commands

extend the status bar with own commands.

## Usage

* configure setting statusbar_command.commands

## Settings
* statusbar_command.commands
    * array of commands to show in status bar
    * these properties are allowed for every item in the array
        * command: identifier of a command to run on click.
        * arguments: Arguments that the command handler should be invoked with.
        * text: The text to show for the entry. You can embed icons in the text by leveraging the syntax: \"$(icon name)\". Where the icon-name is taken from the octicon icon set
        * alignment: The alignment of this item (left, right).
        * priority: The priority of this item. Higher value means the item should be shown more to the left.
        * include: if RegEx is valid, then the StatusbarItem is shown
        * exclude: if RegEx is invalid, then the StatusbarItem is shown/**
        * filterLanguageId: if regex match languageid
        * filterFileName: if regex match filename
        * filterText: if regex match text
        * tooltip: The tooltip text when you hover over this entry.
        * color: The foreground color for this entry.
        * backgroundcolor: The background color for this entry (only statusBarItem.errorBackground supported by vscode)

    * example
```
[{
        "text": "$(gear)",
        "tooltip": "workspace settings",
        "alignment": "right",
        "command": "workbench.action.openWorkspaceSettings"
    },{
        "text": "$(file-text)",
        "tooltip": "format",
        "alignment": "left",
        "priority": 100,
        "include": "\.js",
        "command": "editor.action.format"
    },{
        "text": "ctrl+h",
        "command": "workbench.action.tasks.runTask",
        "arguments": ["taskName"]
    }
]
```

## Changelog
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

