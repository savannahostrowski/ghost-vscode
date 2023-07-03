import * as vscode from 'vscode';

import * as ai from './ai';
import path = require('path');
import assert = require('assert');

let apikey: string | undefined;

export function activate(context: vscode.ExtensionContext) {
	let disposable = vscode.commands.registerCommand('ghost-vscode.generate', async () => {

		// Ask for API key in command palette and store as environment variable
		if (!apikey) {
			apikey = await vscode.window.showInputBox({
				placeHolder: "Enter your OpenAI API key",
				prompt: "Enter your OpenAI API key",
			});

			process.env.OPENAI_API_KEY = apikey;
		}

		// Get all files in workspace, ignore .json files, node_modules and .md, .gitignore
		const workspaceFiles = await vscode.workspace.findFiles('**/*', '{.*,node_modules,*.json,*.md,*.gitignore,LICENSE*}');
		const fileNames = workspaceFiles.map(file => file.fsPath.split('/').pop());

		// Detect project language(s)
		var confirmedLanguages = false;
		var detectedLanguages: string | undefined;
		var initialLangPrompt = true;

		while (!confirmedLanguages && apikey) {
			var prompt: string;
			if (!detectedLanguages && !initialLangPrompt) {
				prompt = `You said this project uses the following languages ${detectedLanguages} (detected from the following files: ${fileNames.join(', ')}). 
				According to the user, this is not correct. Here's some additional info from the user: %v.
				Return a comma-separated list of the languages used by this project.`;
			} else {
				prompt = `Use the following files to tell me what languages are being used in this project.
				Return a comma-separated list with just the unique language names:${fileNames.join(', ')}. 
				The response should not include any additional text other than the list of languages.`;
				initialLangPrompt = false;
			}

			var detectedLanguages = await ai.chatGPTRequest(prompt);

			// Confirm languages
			const result = await vscode.window.showInformationMessage(`Ghost detected the following languages in your codebase: ${detectedLanguages}. Is this correct?`, 'Yes', 'No', 'Cancel');
			if (result === "Cancel") {
				return;
			} else if (result === 'Yes') {
				confirmedLanguages = true;
			} else {
				detectedLanguages = await vscode.window.showInputBox({
					placeHolder: "Enter languages (comma separated)",
					prompt: "Give Ghost some more info about the languages used in this project",
				});
			}
		}

		// Add tasks
		var confirmedTasks = false;
		var GHA: string | undefined;
		var userDefinedTasks = await vscode.window.showInputBox({
			placeHolder: "Enter tasks (comma separated)",
			prompt: "What tasks should Ghost include in your GitHub Action workflow?",
		});

		while (confirmedLanguages && userDefinedTasks && apikey && !confirmedTasks) {
			var prompt = `For a ${detectedLanguages} program, generate a GitHub Action workflow that will include the following tasks: ${userDefinedTasks}. 
				Name it "Ghost-generated pipeline". Leave placeholders for things like version and at the end of generating the
				GitHub Action, tell the user what their next steps should be in a comment. Do not surround the content with a codeblock. Make sure it's
				valid YAML.`;

			GHA = await ai.chatGPTRequest(prompt);

			const currentPath = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
			assert(currentPath !== undefined);
			const newFile = vscode.Uri.parse('untitled:' + path.join(currentPath, 'temp.yml'));

			vscode.workspace.openTextDocument(newFile).then(document => {
				const edit = new vscode.WorkspaceEdit();
				assert(GHA !== undefined);
				edit.insert(newFile, new vscode.Position(0, 0), GHA);
				return vscode.workspace.applyEdit(edit).then(success => {
					if (success) {
						vscode.window.showTextDocument(document);
					} else {
						vscode.window.showInformationMessage('Error!');
					}
				});
			});

			// Confirm tasks
			const result = await vscode.window.showInformationMessage(`Would you like to save the workflow?`, 'Yes', 'No, update tasks', 'Cancel');
			if (result === "Cancel") {
				return;
			} else if (result === 'Yes') {
				confirmedTasks = true;
				
				//Output GHA to a file called ghost-<timestamp>.yml in the .github/workflows directory
				const currentPath = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
				if (currentPath) {
					const ghostDir = path.join(currentPath, '.github/workflows');
					const ghostFile = path.join(ghostDir, `ghost-${Date.now()}.yml`);
					vscode.workspace.fs.createDirectory(vscode.Uri.file(ghostDir));
					vscode.workspace.fs.writeFile(vscode.Uri.file(ghostFile), Buffer.from(GHA ?? ''));
				}
			} else {
				userDefinedTasks = await vscode.window.showInputBox({
					placeHolder: "Enter tasks (comma separated)",
					prompt: "What tasks should Ghost include in your GitHub Action workflow?",
				});
			}
		}
		
	});

	context.subscriptions.push(disposable);
}

// function generateAndAcceptResponse(prompt: string, altPrompt:string)