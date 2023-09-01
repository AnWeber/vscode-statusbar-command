import * as vscode from 'vscode';
import { StatusBarItemConfig } from './statusBarItemConfig';

export interface AppConfig {
  get(section: 'commandsFile'): string | undefined;
  get(section: 'commands'): Array<StatusBarItemConfig> | undefined;
  get(section: 'applicationCommands'): Array<StatusBarItemConfig> | undefined;
}

export function getConfigSetting(uri?: vscode.Uri): AppConfig {
  return vscode.workspace.getConfiguration('statusbar_command', uri);
}

export function watchConfigSettings(watcher: (appConfig: AppConfig) => void): vscode.Disposable {
  watcher(getConfigSetting());
  return vscode.workspace.onDidChangeConfiguration(changeEvent => {
    if (changeEvent.affectsConfiguration('statusbar_command')) {
      watcher(getConfigSetting());
    }
  });
}
