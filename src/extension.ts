import * as vscode from 'vscode';
import * as ai from './ai';
import * as assert from 'assert';
import { createTempFile, writeFile } from './helpers';

let apikey: string | undefined;

export function activate(context: vscode.ExtensionContext) {
	let disposable = vscode.commands.registerCommand('ghost-vscode.generate', async () => {

		// Ask for API key in command palette and store as environment variable
		if (!apikey) {
			apikey = await vscode.window.showInputBox({
				placeHolder: "Enter your OpenAI API key",
				prompt: "Enter your OpenAI API key",
				password: true,
			});

			process.env.OPENAI_API_KEY = apikey;
		}

		// Get all files in workspace, ignore .json files, node_modules and .md, .gitignore
		const workspaceFiles = await vscode.workspace.findFiles('**/*', '{.*,node_modules,*.json,*.md,*.gitignore,LICENSE*}');
		const fileNames = workspaceFiles.map(file => file.fsPath.split('/').pop());

		// Create status bar item
		const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 400);
		statusBarItem.text = "$(loading~spin) Ghost is thinking...";

		// Detect and confirm project language(s)
		var confirmedLanguages = false;
		var additionalInfo: string | undefined;
		var detectedLanguages: string | undefined;
		var initialLangPrompt = true;

		while (!confirmedLanguages && apikey) {
			var prompt: string;
			if (!detectedLanguages && !initialLangPrompt) {
				prompt = `You said this project uses the following languages ${detectedLanguages} (detected from the following files: ${fileNames.join(', ')}). 
				${additionalInfo ? `According to the user, this is not correct. Here's some additional info from the user: ${additionalInfo}.` : ''}
				Only return a comma-separated list of the languages used by this project. Do not include the rationale for the response.`;
			} else {
				prompt = `Use the following files to tell me what languages are being used in this project.
				Only return a comma-separated list with just the unique language names:${fileNames.join(', ')}. 
				The response should not include any additional text other than the list of languages. Do not include the rationale for the response.`;
				initialLangPrompt = false;
			}

			// Loading status bar item
			statusBarItem.show();

			var detectedLanguages = await ai.chatGPTRequest(prompt);

			// Hide status bar item
			statusBarItem.hide();

			// Confirm languages
			var result = await vscode.window.showInformationMessage(`Ghost detected the following languages in your codebase: ${detectedLanguages}. Is this correct?`, 'Yes', 'No', 'Cancel');
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
		var userDefinedTasks: string | undefined;

		while (confirmedLanguages && apikey && !confirmedTasks) {
			userDefinedTasks = await vscode.window.showInputBox({
				placeHolder: "Enter tasks (comma separated)",
				prompt: "What tasks should Ghost include in your GitHub Action workflow?",
			});

			// Cancel out if the user doesn't input tasks
			if (!userDefinedTasks) {
				return;
			}

			var prompt = `For a ${detectedLanguages} program, generate a GitHub Action workflow that will include the following tasks: ${userDefinedTasks}. 
				Name it "Ghost-generated pipeline". Leave placeholders for things like version and at the end of generating the
				GitHub Action, tell the user what their next steps should be in a comment (using # at the beginning of the line). 
				Do not surround the content with a codeblock or backticks. Make sure it's valid YAML.`;

			//Loading status bar item
			statusBarItem.show();

			GHA = await ai.chatGPTRequest(prompt);

			assert(GHA !== undefined);
			statusBarItem.hide();

			createTempFile(GHA);

			// Confirm tasks
			const result = await vscode.window.showInformationMessage(`Would you like to save the workflow to .github/workflows?`, 'Yes', 'No, update tasks', 'Cancel');
			if (result === "Cancel") {
				return;
			} else if (result === 'Yes') {
				confirmedTasks = true;
				writeFile(GHA);
			}
		}

		if (confirmedTasks) {
			vscode.window.showInformationMessage(`Your GitHub Action workflow has been generated!`);

			//Close the temp file (will ask a user if they want to save if they do not have autosave enabled)
			await vscode.commands.executeCommand('workbench.action.closeActiveEditor');

		}
	});

	context.subscriptions.push(disposable);
}