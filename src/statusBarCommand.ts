import * as vscode from 'vscode';
import { StatusBarItemConfig } from './statusBarItemConfig';

export class StatusBarCommand {
  private statusBarItem: vscode.StatusBarItem | undefined;

  registeredCommandDisposable!: vscode.Disposable;

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

  constructor(private readonly config: StatusBarItemConfig) {
    let alignment = vscode.StatusBarAlignment.Left;
    if (config.alignment === 'right') {
      alignment = vscode.StatusBarAlignment.Right;
    }

    if (config.id) {
      this.statusBarItem = vscode.window.createStatusBarItem(config.id, alignment, config.priority);
    } else {
      this.statusBarItem = vscode.window.createStatusBarItem(alignment, config.priority);
    }

    this.statusBarItem.color = config.color;
    this.statusBarItem.accessibilityInformation = config.accessibilityInformation;
    this.statusBarItem.name = config.name;
    this.statusBarItem.text = config.text;
    this.statusBarItem.tooltip = config.tooltip;
    if (config.backgroundColor) {
      this.statusBarItem.backgroundColor = new vscode.ThemeColor(config.backgroundColor);
    }

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

  refresh(textEditor: vscode.TextEditor | undefined): void {
    let visible = true;
    if (this.statusBarItem) {

      if (textEditor && textEditor.document) {
        if (!this.testRegex(this.config.filterLanguageId, textEditor.document.languageId)) {
          visible = false;
        }
        if (!this.testRegex(this.config.filterFileName, textEditor.document.fileName)) {
          visible = false;
        }
        if (!this.testRegex(this.config.filterFilepath, textEditor.document.uri.fsPath)) {
          visible = false;
        }
        if (!this.testRegex(this.config.filterText, textEditor.document.getText())) {
          visible = false;
        }

        const documentUri = textEditor?.document?.uri?.toString();
        if (!this.testRegex(this.config.include, documentUri)) {
          visible = false;
        }
        if (this.config.exclude && this.testRegex(this.config.exclude, documentUri)) {
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

  private testRegex(pattern: string | undefined, value: string | undefined) {
    return !pattern || value && RegExp(pattern, 'u').test(value);
  }

  dispose(): void {
    if (this.statusBarItem) {
      this.statusBarItem.dispose();
      this.statusBarItem = undefined;
    }
  }
}
