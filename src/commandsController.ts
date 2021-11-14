import * as vscode from 'vscode';
import { StatusBarCommand } from './statusBarCommand';
import { StatusBarItemConfig } from './statusBarItemConfig';

/**
 * manage initialization of Commands
 */
export class CommandsController {
  private commands: Array<StatusBarCommand> = [];
  private configChangeDisposable: vscode.Disposable;
  private changeActiveTextEditorDisposable: vscode.Disposable;

  private prevConfig = '';

  constructor() {
    this.configChangeDisposable = vscode.workspace.onDidChangeConfiguration(this.onChangeConfiguration, this);
    this.changeActiveTextEditorDisposable = vscode.window.onDidChangeActiveTextEditor(this.onChangeTextEditor, this);
    this.init(vscode.window.activeTextEditor);
  }

  /**
   * refresh config
   */
  public init(textEditor: vscode.TextEditor | undefined): void {
    const config = vscode.workspace.getConfiguration('statusbar_command', textEditor?.document?.uri);
    const configCommands = [
      ...config.get<Array<StatusBarItemConfig>>('commands') || [],
      ...config.get<Array<StatusBarItemConfig>>('applicationCommands') || []
    ];

    const configJson = JSON.stringify(configCommands);
    if (this.prevConfig !== configJson) {
      this.prevConfig = configJson;

      this.disposeCommands();
      this.commands = [];

      if (configCommands) {
        this.commands.push(...configCommands.map(configEntry => new StatusBarCommand(configEntry)));
      }
    }
  }

  onChangeConfiguration(e: vscode.ConfigurationChangeEvent): void {
    if (e.affectsConfiguration('statusbar_command')) {
      this.init(vscode.window.activeTextEditor);
    }
  }

  onChangeTextEditor(textEditor: vscode.TextEditor | undefined) : void {
    this.init(textEditor);
  }

  private disposeCommands() {
    if (this.commands) {
      this.commands.forEach(command => command.dispose());
      this.commands = [];
    }
  }
  dispose() : void {
    this.disposeCommands();
    this.configChangeDisposable.dispose();
    this.changeActiveTextEditorDisposable.dispose();
  }
}
