'use strict';
import {window, workspace, WorkspaceEdit, Range, TextDocument, TextEditor} from 'vscode';
import {Command} from './Command';


/**
 * manage initialization of Commands
 */
export class CommandsController {
    private commands: Array<Command>;

    constructor() {
        this.initCommands();
    }
    /**
     * refresh config
     */
    initCommands() {
        const config = workspace.getConfiguration('statusbar_command');
        this.disposeCommands();

        const configCommands: Array<any> = config.get<Array<any>>('commands');

        this.commands = new Array<Command>();

        let document = null;
        if (window.activeTextEditor) {
            document = window.activeTextEditor.document.uri.toString();
        }

        configCommands.forEach(configEntry => {
            const command = new Command(configEntry);
            command.refresh(document);
            this.commands.push(command);
        });
    }

    onChangeConfiguration() {
        this.initCommands();
    }

    onChangeTextEditor(textEditor: TextEditor) {

        if (textEditor) {
            const document = textEditor.document.uri.toString();
            this.commands.forEach(command => command.refresh(document));
        }
    }

    disposeCommands() {
        if (this.commands) {
            this.commands.forEach((command) => command.dispose());
            this.commands = null;
        }
    }
    /**
     * remave statusbar buttons
     */
    dispose() {
        this.disposeCommands();
    }


}