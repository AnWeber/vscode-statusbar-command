import * as vscode from 'vscode';
import { StatusBarCommand } from './statusBarCommand';
import { getConfigSetting, watchConfigSettings } from './config';
import { DisposeProvider } from './disposeProvider';
import { FileCommandsProvider } from './fileCommandsProvider';
/**
 * manage initialization of Commands
 */
export class CommandsController extends DisposeProvider {
  private _commands: Array<StatusBarCommand> = [];
  private _outputChannel: vscode.OutputChannel;
  private fileCommandsProvider: FileCommandsProvider | undefined;

  private prevConfig = '';

  constructor(
    private readonly toContent?: (val: Uint8Array) => string,
    private readonly runInNewContext?: ((script: string, context: Record<string, unknown>) => void) | undefined
  ) {
    super();

    this._outputChannel = vscode.window.createOutputChannel('statusbarcommands');
    this.subscriptions.push(
      ...[
        watchConfigSettings(async config => {
          const commandsFile = config.get('commandsFile');
          if (this.fileCommandsProvider) {
            this.fileCommandsProvider.dispose();
            delete this.fileCommandsProvider;
          }
          if (commandsFile && this.toContent) {
            this.fileCommandsProvider = new FileCommandsProvider(commandsFile, this.log.bind(this), this.toContent);
            this.fileCommandsProvider.fileChanged.event(async () => this.refreshEditor());
          }
          await this.refreshEditor();
        }),
        vscode.window.onDidChangeActiveTextEditor(async textEditor => await this.refreshEditor(textEditor), this),
      ],
      this._outputChannel
    );
  }

  /**
   * refresh config
   */
  public async refreshEditor(
    textEditor: vscode.TextEditor | undefined = vscode.window.activeTextEditor
  ): Promise<void> {
    const config = getConfigSetting(textEditor?.document?.uri);
    const configCommands = [
      ...(config.get('commands') || []),
      ...(config.get('applicationCommands') || []),
      ...(this.fileCommandsProvider?.fileCommands || []),
    ];

    const configJson = JSON.stringify(configCommands);
    if (this.prevConfig !== configJson) {
      this.prevConfig = configJson;

      this.disposeCommands();
      this._commands = [];

      if (configCommands) {
        for (const config of configCommands) {
          this._commands.push(await StatusBarCommand.create(config, this.runInNewContext, this.log.bind(this)));
        }
      }
    }
  }
  private log(...messages: Array<unknown>) {
    for (const param of messages) {
      if (param !== undefined) {
        if (typeof param === 'string') {
          this._outputChannel.appendLine(param);
        } else if (this.isError(param)) {
          this._outputChannel.appendLine(`${param.name} - ${param.message}`);
          if (param.stack) {
            this._outputChannel.appendLine(param.stack);
          }
        } else {
          this._outputChannel.appendLine(`${JSON.stringify(param, null, 2)}`);
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
    if (this._commands) {
      for (const command of this._commands) {
        try {
          command.dispose();
        } catch (err) {
          this.log(err);
        }
      }
      this._commands = [];
    }
  }
  dispose(): void {
    super.dispose();
    this.disposeCommands();
    if (this.fileCommandsProvider) {
      this.fileCommandsProvider.dispose();
      delete this.fileCommandsProvider;
    }
  }
}
