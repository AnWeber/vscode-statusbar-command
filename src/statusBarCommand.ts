import * as vscode from 'vscode';
import { argumentsConverter } from './argumentsConverter';
import { StatusBarItemConfig } from './statusBarItemConfig';

export class StatusBarCommand implements vscode.Disposable {
  private eventDisposables: Array<vscode.Disposable> = [];
  private statusBarItem: vscode.StatusBarItem;



  private constructor(
    private readonly config: StatusBarItemConfig,
    private readonly runInNewContext: ((script: string, context: Record<string, unknown>) => void) | undefined,
    private readonly log: (...messages: Array<unknown>) => void
  ) {
    let alignment = vscode.StatusBarAlignment.Left;
    if (config.alignment === 'right') {
      alignment = vscode.StatusBarAlignment.Right;
    }
    if (config.id) {
      this.statusBarItem = vscode.window.createStatusBarItem(config.id, alignment, config.priority);
    } else {
      this.statusBarItem = vscode.window.createStatusBarItem(alignment, config.priority);
    }
    this.statusBarItem.accessibilityInformation = config.accessibilityInformation;
    this.statusBarItem.name = config.name;
    this.statusBarItem.text = config.text;
    this.statusBarItem.tooltip = config.tooltip;
    this.statusBarItem.color = this.createThemeColor(config.color);
    this.statusBarItem.backgroundColor = this.createThemeColor(config.backgroundColor);
    this.initCommand(config);
    this.statusBarItem.show();
  }

  public static async create(
    config: StatusBarItemConfig,
    runInNewContext: ((script: string, context: Record<string, unknown>) => void) | undefined,
    log: (...messages: Array<unknown>) => void
  ) {
    const statusBarCommand = new StatusBarCommand(config, runInNewContext, log);
    await statusBarCommand.initEvents();
    return statusBarCommand;
  }

  private async initEvents() {
    if (this.listensToActiveTextEditorChange) {
      this.eventDisposables.push(vscode.window.onDidChangeActiveTextEditor(this.onDidChangeActiveTextEditor, this));
      this.onDidChangeActiveTextEditor(vscode.window.activeTextEditor);
    } else if (this.config.scriptEvents && (this.config.script || this.config.scriptFile)) {
      const initScriptEvents = async () => {
        this.resetEvents();
        if (this.config.scriptFile) {
          try {
            this.config.script = Buffer.from(
              await vscode.workspace.fs.readFile(vscode.Uri.file(this.config.scriptFile))
            ).toString('utf-8');
          } catch (err) {
            this.log(`Error reading File ${this.config.scriptFile}`);
            this.log(err);
          }
          const watcher = vscode.workspace.createFileSystemWatcher(this.config.scriptFile);
          this.eventDisposables.push(watcher.onDidChange(initScriptEvents, this));
          this.eventDisposables.push(watcher);
        }
        if (!this.registerScriptEvents()) {
          this.statusBarItem?.hide();
        }
      };

      await initScriptEvents();
    }
  }

  private async registerScriptEvents() {
    if (this.runInNewContext && this.config.scriptEvents && this.config.script) {
      const script = `
      (function(){
        async function runScript(event){
          try{
            let workspaceFolder = undefined;
            let documentUri = vscode.window.activeTextEditor?.document.uri;
            if(documentUri){
              workspaceFolder = vscode.workspace.getWorkspaceFolder(documentUri)?.uri;
            }
            ${this.config.script}
            validateStatusBarItem();
          }catch(err){
            log(err);
          }
        }
        disposables.push(${this.config.scriptEvents.map(obj => `${obj}(runScript)`).join(', ')});
        exports.result = runScript();
      })();
      `;
      try {
        const exports: {result?: Promise<void>} = {};
        this.runInNewContext(script, {
          disposables: this.eventDisposables,
          statusBarItem: this.statusBarItem,
          validateStatusBarItem: this.validateStatusBarItem.bind(this),
          log: this.log,
          vscode,
          exports
        });
        if (exports.result) {
          await exports.result;
        }
        return true;
      } catch (err) {
        this.log('error while registering event', err);
      }
    }
    return false;
  }

  private validateStatusBarItem() {
    if (this.statusBarItem) {
      this.statusBarItem.text = this.getSafeString(this.statusBarItem.text, '$(question)');
      this.statusBarItem.tooltip = this.getSafeString(this.statusBarItem.tooltip, '');
      this.statusBarItem.color = this.createThemeColor(this.statusBarItem.color);
      this.statusBarItem.backgroundColor = this.createThemeColor(this.statusBarItem.backgroundColor);
    }
  }

  private getSafeString(obj: unknown, defaultValue: string) {
    if (typeof obj !== 'undefined') {
      if (typeof obj !== 'string') {
        return `${obj}`;
      }
      return obj;
    }
    return defaultValue;
  }

  private createThemeColor(color: string | vscode.ThemeColor | undefined) {
    if (color) {
      if (typeof color === 'string') {
        if (color.startsWith('theme:')) {
          return new vscode.ThemeColor(color.slice('theme:'.length));
        }
        if (color === 'statusBarItem.errorBackground') {
          return new vscode.ThemeColor('statusBarItem.errorBackground');
        }
        if (color === 'statusBarItem.warningBackground') {
          return new vscode.ThemeColor('statusBarItem.warningBackground');
        }
      }
      return color;
    }
    return undefined;
  }

  private initCommand(config: StatusBarItemConfig) {
    if (this.statusBarItem) {
      if (config.arguments) {
        this.statusBarItem.command = {
          title: config.text,
          command: config.command,
          arguments: config.arguments.map((obj: unknown) => {
            if (typeof obj === 'string') {
              for (const [key, value] of Object.entries(argumentsConverter)) {
                if (obj.startsWith(key)) {
                  return value(obj.slice(key.length));
                }
              }
            }
            return obj;
          }),
        };
      } else {
        this.statusBarItem.command = config.command;
      }
    }
  }

  private get listensToActiveTextEditorChange() {
    return (
      !!this.config.filterLanguageId ||
      !!this.config.filterFileName ||
      !!this.config.filterFilepath ||
      !!this.config.filterText ||
      !!this.config.include ||
      !!this.config.exclude
    );
  }

  private onDidChangeActiveTextEditor(textEditor: vscode.TextEditor | undefined): void {
    let visible = true;
    if (this.statusBarItem) {
      if (textEditor && textEditor.document) {
        if (
          !this.testRegex(
            this.config.filterLanguageId,
            this.config.filterLanguageIdFlags,
            textEditor.document.languageId
          )
        ) {
          this.log(
            `${this.statusBarItem.id || this.statusBarItem.command} does not match filterLanguageId: ${
              textEditor.document.languageId
            }!=${this.config.filterLanguageId}`
          );
          visible = false;
        }
        if (
          !this.testRegex(this.config.filterFileName, this.config.filterFileNameFlags, textEditor.document.fileName)
        ) {
          this.log(
            `${this.statusBarItem.id || this.statusBarItem.command} does not match filterFileName: ${
              textEditor.document.fileName
            }!=${this.config.filterFileName}`
          );
          visible = false;
        }
        if (
          !this.testRegex(this.config.filterFilepath, this.config.filterFilepathFlags, textEditor.document.uri.fsPath)
        ) {
          this.log(
            `${this.statusBarItem.id || this.statusBarItem.command} does not match filterFilepath: ${
              textEditor.document.uri.fsPath
            }!=${this.config.filterFilepath}`
          );
          visible = false;
        }
        if (!this.testRegex(this.config.filterText, this.config.filterTextFlags, textEditor.document.getText())) {
          this.log(`${this.statusBarItem.id || this.statusBarItem.command} does not match filterText`);
          visible = false;
        }

        const documentUri = textEditor?.document?.uri?.toString();
        if (!this.testRegex(this.config.include, this.config.includeFlags, documentUri)) {
          this.log(`${this.statusBarItem.id || this.statusBarItem.command} does not match include: ${documentUri}`);
          visible = false;
        }
        if (this.config.exclude && this.testRegex(this.config.exclude, this.config.excludeFlags, documentUri)) {
          this.log(`${this.statusBarItem.id || this.statusBarItem.command} does not match exclude: ${documentUri}`);
          visible = false;
        }
      }

      if (visible) {
        this.statusBarItem.show();
      } else {
        this.statusBarItem.hide();
      }
    }
  }

  private testRegex(pattern: string | undefined, flags: string | undefined, value: string | undefined) {
    return !pattern || (value && RegExp(pattern, flags || 'u').test(value));
  }

  resetEvents() {
    for (const disposable of this.eventDisposables) {
      disposable.dispose();
    }
    this.eventDisposables = [];
  }

  dispose(): void {
    if (this.statusBarItem) {
      this.statusBarItem.dispose();
    }
    this.resetEvents();
  }
}
