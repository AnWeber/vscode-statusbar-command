import * as vscode from 'vscode';

export const argumentsConverter : Record<string, (obj: string) => unknown> = {
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