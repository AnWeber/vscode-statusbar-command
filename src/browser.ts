import * as vscode from 'vscode';
import { CommandsController } from './commandsController';

export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(new CommandsController());
}
