import * as vscode from 'vscode';
import * as path from 'path';
import * as assert from 'assert';

export async function createTempFile(contents: string) {
    const currentPath = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
    assert(currentPath !== undefined);
    const newFile = vscode.Uri.parse('untitled:' + path.join(currentPath, 'temp.yml'));

    vscode.workspace.openTextDocument(newFile).then(document => {
        const edit = new vscode.WorkspaceEdit();

        console.log(document.isDirty);

        // If a temp file already exists, delete its contents
        if (document.isDirty) {
            edit.delete(document.uri, new vscode.Range(0, 0, document.lineCount, 0));
        }

        edit.insert(newFile, new vscode.Position(0, 0), contents);
        return vscode.workspace.applyEdit(edit).then(success => {
            if (success) {
                vscode.window.showTextDocument(document);
            } else {
                vscode.window.showInformationMessage('Error!');
            }
        });
    });
}

export async function writeFile(contents: string) {
    const currentPath = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
    assert(currentPath !== undefined);
    const ghostDir = path.join(currentPath, '.github/workflows');
    const ghostFile = path.join(ghostDir, `ghost-${Date.now()}.yml`);
    vscode.workspace.fs.createDirectory(vscode.Uri.file(ghostDir));
    vscode.workspace.fs.writeFile(vscode.Uri.file(ghostFile), Buffer.from(contents ?? ''));

}