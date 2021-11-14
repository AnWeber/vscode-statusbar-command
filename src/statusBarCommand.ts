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

    if (this.listensToActiveTextEditorChange) {
      this.disposables.push(vscode.window.onDidChangeActiveTextEditor(this.onDidChangeActiveTextEditor, this));
    } else if (this.runInNewContext && config.scriptEvents && config.script) {
      this.statusBarItem.show();
      this.runScript(null);
      this.registerScriptEvents(config);
    }
  }

  private registerScriptEvents(config: StatusBarItemConfig) {
    if (this.runInNewContext && config.scriptEvents) {
      const eventHandlers: Array<(listener: (e: unknown) => void, obj: StatusBarCommand) => vscode.Disposable> = [];
      try {
        this.runInNewContext(`eventHandlers.push(${config.scriptEvents.join(', ')})`, {
          eventHandlers,
          vscode
        });
      } catch (err) {
        this.log('error while registering event', err);
      }
      for (const eventHandler of eventHandlers) {
        this.disposables.push(eventHandler(this.runScript, this));
      }
    }
  }

  private createThemeColor(color: string | undefined) {
    if (color) {
      if (color.startsWith('theme:')) {
        return new vscode.ThemeColor(color.slice('theme:'.length));
      }
      if (color === 'statusBarItem.errorBackground') {
        return new vscode.ThemeColor('statusBarItem.errorBackground');
      }
      if (color === 'statusBarItem.warningBackground') {
        return new vscode.ThemeColor('statusBarItem.warningBackground');
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

  onDidChangeActiveTextEditor(textEditor: vscode.TextEditor | undefined): void {
    let visible = true;
    if (this.statusBarItem) {
      if (textEditor && textEditor.document) {
        if (!this.testRegex(this.config.filterLanguageId, this.config.filterLanguageIdFlags, textEditor.document.languageId)) {
          visible = false;
        }
        if (!this.testRegex(this.config.filterFileName, this.config.filterFileNameFlags, textEditor.document.fileName)) {
          visible = false;
        }
        if (!this.testRegex(this.config.filterFilepath, this.config.filterFilepathFlags, textEditor.document.uri.fsPath)) {
          visible = false;
        }
        if (!this.testRegex(this.config.filterText, this.config.filterTextFlags, textEditor.document.getText())) {
          visible = false;
        }

        const documentUri = textEditor?.document?.uri?.toString();
        if (!this.testRegex(this.config.include, this.config.includeFlags, documentUri)) {
          visible = false;
        }
        if (this.config.exclude && this.testRegex(this.config.exclude, this.config.excludeFlags, documentUri)) {
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
  private runScript(event: unknown) {
    if (this.config.script && this.statusBarItem && this.runInNewContext) {
      try {
        this.runInNewContext(this.config.script, {
          event,
          statusBarItem: this.statusBarItem,
          vscode
        });
      } catch (err) {
        this.log('error while running event', err);
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
