'use strict';

import * as vscode from 'vscode';
import {CommandsController} from './commandsController';


export function activate(context: vscode.ExtensionContext) {
    const commandsController = new CommandsController();
    context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(commandsController.onChangeConfiguration, commandsController));
    context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(commandsController.onChangeTextEditor, commandsController));
    context.subscriptions.push(commandsController);
}
