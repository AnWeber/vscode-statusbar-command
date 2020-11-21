'use strict';
import {window, workspace, TextEditor} from 'vscode';
import {StatusBarCommand} from './statusBarCommand';
import { StatusBarItemConfig } from './statusBarItemConfig';

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

        const configCommands = config.get<Array<StatusBarItemConfig>>('commands');
        if (configCommands) {
            this.commands.push(...configCommands.map(configEntry => {
                const command = new StatusBarCommand(configEntry);
                command.refresh(window.activeTextEditor);
                return command;
            }));
        }
    }

    onChangeConfiguration() {
        this.refresh();
    }

    onChangeTextEditor(textEditor: TextEditor | undefined) {
        if (textEditor) {
            this.commands.forEach(command => command.refresh(textEditor));
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
