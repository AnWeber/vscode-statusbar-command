import * as vscode from 'vscode';
import { StatusBarCommand } from './statusBarCommand';
import { StatusBarItemConfig } from './statusBarItemConfig';

/**
 * manage initialization of Commands
 */
export class CommandsController {
    private commands: Array<StatusBarCommand> = [];

    constructor() {
      this.refresh();
    }

    /**
     * refresh config
     */
    public refresh() : void {
      const config = vscode.workspace.getConfiguration('statusbar_command');
      this.disposeCommands();
      this.commands = [];

      const configCommands = config.get<Array<StatusBarItemConfig>>('commands');
      if (configCommands) {
        this.commands.push(...configCommands.map(configEntry => {
          const command = new StatusBarCommand(configEntry);
          command.refresh(vscode.window.activeTextEditor);
          return command;
        }));
      }
    }

    onChangeConfiguration() : void {
      this.refresh();
    }

    onChangeTextEditor(textEditor: vscode.TextEditor | undefined) : void {
      if (textEditor) {
        this.commands.forEach(command => command.refresh(textEditor));
      }
    }

    private disposeCommands() {
      if (this.commands) {
        this.commands.forEach(command => command.dispose());
        this.commands = [];
      }
    }
    dispose() : void {
      this.disposeCommands();
    }
}
