import * as vscode from 'vscode';

import * as ai from './ai';
import { ChatCompletionResponseMessage } from 'openai';

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
		var userLanguageCorrection: string | undefined;
		var detectedLanguages: string | undefined;
		var initialLangPrompt = true;

		while (!confirmedLanguages) {
			var prompt: string;
			if (!userLanguageCorrection && !detectedLanguages && !initialLangPrompt) {
				prompt = `You said this project uses the following languages ${detectedLanguages} (detected from the following files: ${fileNames.join(', ')}). 
				According to the user, this is not correct. Here's some additional info from the user: %v.
				Return a comma-separated list of the languages used by this project.`;
			} else {
				prompt = `Use the following files to tell me what languages are being used in this project.
				Return a comma-separated list with just the unique language names:${fileNames.join(', ')}. 
				The response should not include any additional text other than the list of languages.`;
				initialLangPrompt = false;
			}

			detectedLanguages = await ai.chatGPTRequest(prompt);

			const confirm = await vscode.window.showInformationMessage(`Ghost detected the following languages in your codebase: ${detectedLanguages}. Is this correct?`, 'Yes', 'No');
			if (confirm === 'Yes') {
				confirmedLanguages = true;
			} else {
				userLanguageCorrection = await vscode.window.showInputBox({
					placeHolder: "Enter languages (comma separated)",
					prompt: "Give Ghost some more info about the languages used in this project",
				});
			}
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
