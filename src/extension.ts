import * as vscode from 'vscode';
import { CommandsController } from './commandsController';
import * as vm from 'vm';

export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    new CommandsController(
      val => Buffer.from(val).toString('utf8'),
      (script: string, context: Record<string, unknown>) => {
        if (vscode.workspace.isTrusted) {
          vm.runInContext(
            script,
            vm.createContext(
              Object.assign(
                Object.defineProperties(
                  {
                    ...global,
                  },
                  Object.getOwnPropertyDescriptors(global)
                ),
                { vscode, require },
                context
              )
            )
          );
        } else {
          vm.runInNewContext(script, context);
        }
      }
    )
  );
}
