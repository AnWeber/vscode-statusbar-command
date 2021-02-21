import { StatusBarAlignment, StatusBarItem, window, Disposable, TextEditor, ThemeColor } from 'vscode';
import { StatusBarItemConfig } from './statusBarItemConfig';

export class StatusBarCommand {
    private statusBarItem: StatusBarItem | undefined;

    registeredCommandDisposable!: Disposable;

    constructor(private readonly config: StatusBarItemConfig) {
        let alignment = StatusBarAlignment.Left;
        if (config.alignment === 'right') {
            alignment = StatusBarAlignment.Right;
        }

        this.statusBarItem = window.createStatusBarItem(alignment, config.priority);

        this.statusBarItem.color = config.color;
        this.statusBarItem.accessibilityInformation = config.accessibilityInformation;
        this.statusBarItem.text = config.text;
        this.statusBarItem.tooltip = config.tooltip;
        if (config.backgroundColor) {
            this.statusBarItem.backgroundColor = new ThemeColor(config.backgroundColor);
        }

        if (config.arguments) {
            this.statusBarItem.command = {
                title: config.text,
                command: config.command,
                arguments: config.arguments
            };
        } else {
            this.statusBarItem.command = config.command;
        }
    }

    refresh(textEditor: TextEditor | undefined) {
        let visible = true;
        if (this.statusBarItem) {

            if (textEditor && textEditor.document) {
                if (!this.testRegex(this.config.filterLanguageId, textEditor.document.languageId)) {
                    visible = false;
                }
                if (!this.testRegex(this.config.filterFileName, textEditor.document.fileName)) {
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
        return !pattern || value && RegExp(pattern).test(value);
    }

    dispose() {
        if (this.statusBarItem) {
            this.statusBarItem.dispose();
            this.statusBarItem = undefined;
        }
    }
}
