import { StatusBarAlignment, StatusBarItem, window, Disposable, commands } from 'vscode';


import { StatusBarItemConfig } from './statusBarItemConfig';

export class StatusBarCommand {
    private statusBarItem: StatusBarItem | undefined;
    include!: RegExp;
    exclude!: RegExp;
    script!: string;

    registeredCommandDisposable!: Disposable;

    constructor(config: StatusBarItemConfig) {
        let alignment = StatusBarAlignment.Left;
        if (config.alignment === 'right') {
            alignment = StatusBarAlignment.Right;
        }

        this.statusBarItem = window.createStatusBarItem(alignment, config.priority);

        this.statusBarItem.color = config.color;
        this.statusBarItem.accessibilityInformation = config.accessibilityInformation;
        this.statusBarItem.text = config.text;
        this.statusBarItem.tooltip = config.tooltip;

        if (config.arguments) {
            this.statusBarItem.command = {
                title: config.text,
                command: config.command,
                arguments: config.arguments
            };
        } else {
            this.statusBarItem.command = config.command;
        }

        if (config.include) {
            this.include = new RegExp(config.include);
        }
        if (config.exclude) {
            this.exclude = new RegExp(config.exclude);
        }
    }

    refresh(documentUri: string | null) {
        let visible = true;
        if (this.statusBarItem) {
            if (this.include) {
                console.log(this.include.source);
                visible = !!documentUri && this.include.test(documentUri);
            }
            if (this.exclude) {
                visible = !!documentUri && !this.exclude.test(documentUri);
            }

            if (visible) {
                this.statusBarItem.show();
            } else {
                this.statusBarItem.hide();
            }
        }
    }

    dispose() {
        if (this.statusBarItem) {
            this.statusBarItem.dispose();
            this.statusBarItem = undefined;
        }
    }
}
