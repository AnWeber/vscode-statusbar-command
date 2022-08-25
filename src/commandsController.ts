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
  private logChannel: vscode.OutputChannel | undefined;

  private prevConfig = '';

  constructor(
    private readonly runInNewContext?: ((script: string, context: Record<string, unknown>) => void) | undefined
  ) {
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
        this.commands.push(...configCommands.map(configEntry => new StatusBarCommand(configEntry, this.runInNewContext, this.log.bind(this))));
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

  private log(...messages: Array<unknown>) {
    if (!this.logChannel) {
      this.logChannel = vscode.window.createOutputChannel('statusbarcommands');
    }
    for (const param of messages) {
      if (param !== undefined) {
        if (typeof param === 'string') {
          this.logChannel.appendLine(param);
        } else if (this.isError(param)) {
          this.logChannel.appendLine(`${param.name} - ${param.message}`);
          if (param.stack) {
            this.logChannel.appendLine(param.stack);
          }
        } else {
          this.logChannel.appendLine(`${JSON.stringify(param, null, 2)}`);
        }
      }
    }
  }

  private isError(val: unknown): val is Error {
    if (!val) {
      return false;
    }
    if (val instanceof Error) {
      return true;
    }
    const err = val as Error;
    return !!err.message && !!err.stack && !!err.name;
  }

  private disposeCommands() {
    if (this.commands) {
      this.commands.forEach(command => command.dispose());
      this.commands = [];
    }
  }
  dispose() : void {
    this.disposeCommands();
    if (this.logChannel) {
      this.logChannel.dispose();
      delete this.logChannel;
    }
    this.configChangeDisposable.dispose();
    this.changeActiveTextEditorDisposable.dispose();
  }
}
