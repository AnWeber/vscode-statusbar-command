import * as fs from 'fs';
import * as vscode from 'vscode';
import { StatusBarItemConfig } from './statusBarItemConfig';

export class StatusBarCommand implements vscode.Disposable {
  private disposables: Array<vscode.Disposable> = [];
  private statusBarItem: vscode.StatusBarItem | undefined;

  private argumentsConverter: Record<string, (obj: string) => unknown> = {
    'activeTextEditor|': obj => {
      const textEditor = vscode.window.activeTextEditor;
      if (textEditor) {
        switch (obj) {
          case 'document':
            return textEditor.document;
          case 'visibleRanges':
            return textEditor.visibleRanges;
          case 'selection':
            return textEditor.selection;
          case 'selections':
            return textEditor.selections;
          case 'viewColumn':
            return textEditor.viewColumn;
          default:
            return textEditor;
        }
      }
      return textEditor;
    },
    'activeDocument|': obj => {
      const document = vscode.window.activeTextEditor?.document;
      if (document) {
        switch (obj) {
          case 'fileName':
            return document.fileName;
          case 'languageId':
            return document.languageId;
          case 'uri':
            return document.uri;
          default:
            return document;
        }
      }
      return document;
    },
    'float|': obj => Number.parseFloat(obj),
    'json|': obj => JSON.parse(obj),
    'number|': obj => Number.parseInt(obj, 10),
    'range|': obj => {
      const parts = obj.split(',');
      if (parts.length === 4) {
        return new vscode.Range(+parts[0], +parts[1], +parts[2], +parts[3]);
      }
      return obj;
    },
    'position|': obj => {
      const parts = obj.split(',');
      if (parts.length === 2) {
        return new vscode.Position(+parts[0], +parts[1]);
      }
      return obj;
    },
    'uri|': obj => vscode.Uri.file(obj.slice('uri|'.length)),
  };

  constructor(
    private readonly config: StatusBarItemConfig,
    private readonly runInNewContext: ((script: string, context: Record<string, unknown>) => void) | undefined,
    private readonly log: (...messages: Array<unknown>) => void,
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
    if (this.listensToActiveTextEditorChange) {
      this.disposables.push(vscode.window.onDidChangeActiveTextEditor(this.onDidChangeActiveTextEditor, this));
      this.onDidChangeActiveTextEditor(vscode.window.activeTextEditor);
    } else if (config.scriptEvents && (config.script || config.scriptFile)) {
      if (!this.registerScriptEvents(config)) {
        this.statusBarItem.hide();
      }
    }
  }

  private registerScriptEvents(config: StatusBarItemConfig) {
    if (this.runInNewContext && config.scriptEvents && (config.script || config.scriptFile)) {

      if (config.scriptFile) {
        config.script = fs.readFileSync(config.scriptFile, {encoding: 'utf-8'});
      }

      const script = `
        function runScript(event){
          try{
            let workspaceFolder = undefined;
            let documentUri = vscode.window.activeTextEditor?.document.uri;
            if(documentUri){
              workspaceFolder = vscode.workspace.getWorkspaceFolder(documentUri)?.uri;
            }
            ${config.script}
            validateStatusBarItem();
          }catch(err){
            log(err);
          }
        }
        disposables.push(${config.scriptEvents.map(obj => `${obj}(runScript)`).join(', ')});
        runScript();
      `;
      try {
        this.runInNewContext(script, {
          disposables: this.disposables,
          statusBarItem: this.statusBarItem,
          validateStatusBarItem: this.validateStatusBarItem.bind(this),
          log: this.log,
          vscode
        });
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

  private createThemeColor(color: string| vscode.ThemeColor | undefined) {
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
              for (const [key, value] of Object.entries(this.argumentsConverter)) {
                if (obj.startsWith(key)) {
                  return value(obj.slice(key.length));
                }
              }
            }
            return obj;
          })
        };
      } else {
        this.statusBarItem.command = config.command;
      }
    }
  }

  private get listensToActiveTextEditorChange() {
    return !!this.config.filterLanguageId
      || !!this.config.filterFileName
      || !!this.config.filterFilepath
      || !!this.config.filterText
      || !!this.config.include
      || !!this.config.exclude;
  }

  private onDidChangeActiveTextEditor(textEditor: vscode.TextEditor | undefined): void {
    let visible = true;
    if (this.statusBarItem) {
      if (textEditor && textEditor.document) {
        if (!this.testRegex(this.config.filterLanguageId, this.config.filterLanguageIdFlags, textEditor.document.languageId)) {
          this.log(`${this.statusBarItem.id || this.statusBarItem.command} does not match filterLanguageId: ${textEditor.document.languageId}!=${this.config.filterLanguageId}`);
          visible = false;
        }
        if (!this.testRegex(this.config.filterFileName, this.config.filterFileNameFlags, textEditor.document.fileName)) {
          this.log(`${this.statusBarItem.id || this.statusBarItem.command} does not match filterFileName: ${textEditor.document.fileName}!=${this.config.filterFileName}`);
          visible = false;
        }
        if (!this.testRegex(this.config.filterFilepath, this.config.filterFilepathFlags, textEditor.document.uri.fsPath)) {
          this.log(`${this.statusBarItem.id || this.statusBarItem.command} does not match filterFilepath: ${textEditor.document.uri.fsPath}!=${this.config.filterFilepath}`);
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
    return !pattern || value && RegExp(pattern, flags || 'u').test(value);
  }

  dispose(): void {
    for (const disposable of this.disposables) {
      disposable.dispose();
    }
    this.disposables = [];
    if (this.statusBarItem) {
      this.statusBarItem.dispose();
      this.statusBarItem = undefined;
    }
  }
}
