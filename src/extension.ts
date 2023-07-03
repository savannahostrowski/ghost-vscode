import * as vscode from 'vscode';

import * as ai from './ai';
import path = require('path');

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
		// get all files in workspace, ignore .json files, node_modules and .md, .gitignore
		const workspaceFiles = await vscode.workspace.findFiles('**/*', '{.*,node_modules,*.json,*.md,*.gitignore,LICENSE*}');
		const fileNames = workspaceFiles.map(file => file.fsPath.split('/').pop());

		// Make GPT request
		var confirmedLanguages = false;
		var additionalProjectInfo: string | undefined;
		var detectedLanguages: string | undefined;
		var initialLangPrompt = true;

		while (!confirmedLanguages && apikey) {
			var prompt: string;
			if (!additionalProjectInfo && !detectedLanguages && !initialLangPrompt) {
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
				// Reset additionalProjectInfo for use in tasks
				additionalProjectInfo = undefined;
			} else {
				additionalProjectInfo = await vscode.window.showInputBox({
					placeHolder: "Enter languages (comma separated)",
					prompt: "Give Ghost some more info about the languages used in this project",
				});
			}
		}

		// Add tasks
		var confirmedTasks = false;
		var userDefinedTasks = await vscode.window.showInputBox({
			placeHolder: "Enter tasks (comma separated)",
			prompt: "What tasks should Ghost include in your GitHub Action workflow?",
		});
		
		while(confirmedLanguages && userDefinedTasks && apikey) {
			var prompt = `For a ${detectedLanguages} program, generate a GitHub Action workflow that will include the following tasks: ${userDefinedTasks}. 
				${additionalProjectInfo ? `Here's some additional info from the user: ${additionalProjectInfo}.` : ''}
				Name it "Ghost-generated pipeline". Leave placeholders for things like version and at the end of generating the
				GitHub Action, tell the user what their next steps should be in a comment`;

			var GHA = await ai.chatGPTRequest(prompt);
			console.log(GHA);

			// get current path
			// if (GHA) {
			// 	const currentPath = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
			// 	const newFile = vscode.Uri.parse('untitled:' + path.join(currentPath, 'temp.yml'));
			// 	vscode.workspace.openTextDocument(newFile).then(document => {
			// 		const edit = new vscode.WorkspaceEdit();
			// 		edit.insert(newFile, new vscode.Position(0, 0), GHA);
			// 		return vscode.workspace.applyEdit(edit).then(success => {
			// 			if (success) {
			// 				vscode.window.showTextDocument(document);
			// 			} else {
			// 				vscode.window.showInformationMessage('Error!');
			// 			}
			// 		});
			// 	});
			// }
			
		}

		//Confirm GHA

		//Output to file
	});

	context.subscriptions.push(disposable);
}

// function generateAndAcceptResponse(prompt: string, altPrompt:string)