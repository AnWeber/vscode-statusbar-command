import * as vscode from 'vscode';
import { StatusBarItemConfig } from './statusBarItemConfig';

export class StatusBarCommand {
    private statusBarItem: vscode.StatusBarItem | undefined;

    registeredCommandDisposable!: vscode.Disposable;

    private argumentsConverter: Record<string, (obj: string) => unknown> = {
      'uri|': obj => vscode.Uri.file(obj.slice('uri|'.length)),
      'position|': obj => {
        const parts = obj.split(',');
        if (parts.length === 2) {
          return new vscode.Position(+parts[0], +parts[1]);
        }
        return obj;
      },
      'range|': obj => {
        const parts = obj.split(',');
        if (parts.length === 4) {
          return new vscode.Range(+parts[0], +parts[1], +parts[2], +parts[3]);
        }
        return obj;
      },
      'json|': obj => JSON.parse(obj)
    };

    constructor(private readonly config: StatusBarItemConfig) {
      let alignment = vscode.StatusBarAlignment.Left;
      if (config.alignment === 'right') {
        alignment = vscode.StatusBarAlignment.Right;
      }

      this.statusBarItem = vscode.window.createStatusBarItem(alignment, config.priority);

      this.statusBarItem.color = config.color;
      this.statusBarItem.accessibilityInformation = config.accessibilityInformation;
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
                  return value(obj);
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

    refresh(textEditor: vscode.TextEditor | undefined) : void {
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

    dispose() :void {
      if (this.statusBarItem) {
        this.statusBarItem.dispose();
        this.statusBarItem = undefined;
      }
    }
}
