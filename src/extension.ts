// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	let disposable = vscode.commands.registerCommand('ghost-vscode.generate', () => {

		vscode.window.showInformationMessage('Hello World from ghost-vscode!');

		// Ask for API key in command palette and store as environment variable
		if (!process.env.OPENAI_API_KEY) {
			vscode.window.showInputBox({
				placeHolder: "Enter your OpenAI API key",
				prompt: "Enter your OpenAI API key",
				password: true
			}).then((value) => {
				if (value) {
					process.env.OPENAI_API_KEY = value;
				}
			});
		}

		

		// Confirm detected languages

		// Ask for tasks to generate

		//Confirm GHA

		//Output to file
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() { }
