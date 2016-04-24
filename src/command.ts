import {StatusBarAlignment, StatusBarItem, window} from 'vscode';


export interface Command {

    refresh(document: string);
}

export class Command implements Command {
    button: StatusBarItem;
    include: RegExp;
    exclude: RegExp;

    constructor(config: any) {
        let alignment = StatusBarAlignment.Left;
        if (config.alignment === 'right') {
            alignment = StatusBarAlignment.Right;
        }

        this.button = window.createStatusBarItem(alignment, config.priority);

        this.button.command = config.command;
        this.button.text = config.text;
        this.button.tooltip = config.tooltip;
        this.button.color = config.color;
        if (config.include) {
            this.include = new RegExp(config.include);
        }
        if (config.exclude) {
            this.exclude = new RegExp(config.exclude);
        }
    }

    refresh(document: string) {
        let visible = true;
        if (this.include) {
            console.log(this.include.source);
            visible = document && this.include.test(document);
        }
        if (this.exclude) {
            visible = document && !this.exclude.test(document);
        }
        if (visible) {
            this.button.show();
        } else {
            this.button.hide();
        }
    }

    dispose() {
        if (this.button !== null) {
            this.button.dispose();
            this.button = null;
        }
    }
}