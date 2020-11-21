'use strict';
import {window, workspace, WorkspaceEdit, Range, TextDocument, TextEditor} from 'vscode';
import {StatusBarCommand} from './statusBarCommand';


/**
 * manage initialization of Commands
 */
export class CommandsController {
    private commands = new Array<StatusBarCommand>();

    constructor() {
        this.refresh();
    }
    /**
     * refresh config
     */
    public refresh() {
        const config = workspace.getConfiguration('statusbar_command');
        this.disposeCommands();
        this.commands = new Array<StatusBarCommand>();

        let document: string | null  = null;
        if (window.activeTextEditor) {
            document = window.activeTextEditor.document.uri.toString();
        }

        const configCommands = config.get<Array<any>>('commands');
        if (configCommands) {
            this.commands.push(...configCommands.map(configEntry => {
                const command = new StatusBarCommand(configEntry);
                command.refresh(document);
                return command;
            }));
        }
    }

    onChangeConfiguration() {
        this.refresh();
    }

    onChangeTextEditor(textEditor: TextEditor | undefined) {
        if (textEditor) {
            const document = textEditor.document.uri.toString();
            this.commands.forEach(command => command.refresh(document));
        }
    }

    private disposeCommands() {
        if (this.commands) {
            this.commands.forEach((command) => command.dispose());
            this.commands = new Array<StatusBarCommand>();
        }
    }
    dispose() {
        this.disposeCommands();
    }


}
