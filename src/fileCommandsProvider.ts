import { DisposeProvider } from './disposeProvider';
import * as vscode from 'vscode';
import { StatusBarItemConfig } from './statusBarItemConfig';

export class FileCommandsProvider extends DisposeProvider {
  public fileCommands: Array<StatusBarItemConfig> = [];

  public fileChanged: vscode.EventEmitter<void>;

  public constructor(
    file: string,
    private readonly log: (...args: Array<unknown>) => void,
    private readonly toContent: (val: Uint8Array) => string
  ) {
    super();

    const uri = vscode.Uri.file(file);
    this.parseUri(uri);

    const relativePattern = new vscode.RelativePattern(
      vscode.Uri.joinPath(uri, '..'),
      file.split('\\').pop()?.split('/').pop() || '*.json'
    );
    const fileSystemWatcher = vscode.workspace.createFileSystemWatcher(relativePattern);

    this.fileChanged = new vscode.EventEmitter();
    this.subscriptions.push(
      ...[
        this.fileChanged,
        fileSystemWatcher,
        fileSystemWatcher.onDidChange(async uri => {
          this.parseUri(uri);
        }),
      ]
    );
  }

  private async parseUri(uri: vscode.Uri) {
    try {
      const uint8array = await vscode.workspace.fs.readFile(uri);
      const result = JSON.parse(this.toContent(uint8array));

      if (Array.isArray(result)) {
        this.fileCommands = result;
        this.fileChanged.fire();
      }
    } catch (err) {
      this.log(`Error in File ${uri.toString()}`, err);
    }
  }
}
