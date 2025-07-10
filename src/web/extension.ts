// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(
			'sleepyDuck.view',
			new DuckViewProvider(context)
		)
		);
	};

	class DuckViewProvider implements vscode.WebviewViewProvider{
		constructor(private readonly context: vscode.ExtensionContext) {}

		resolveWebviewView(webviewView: vscode.WebviewView) {
			const webview = webviewView.webview;
			webview.options = {
			enableScripts: true,
			localResourceRoots: [vscode.Uri.joinPath(this.context.extensionUri, 'img')]
		};
		
		let sleepLevel = 0; // 0 = awake, 1 = sleepy, 2 = asleep + waiting to start break, 3 = on break
		let duckImages = ['awake.png', 'sleepy.png', 'asleep.png', 'back.png'];


		const updateDuck = () => {
			const themeKind = vscode.window.activeColorTheme.kind; // get current vscode theme
			if (themeKind === vscode.ColorThemeKind.Dark){
				duckImages = ['awake-dark.png', 'sleepy-dark.png', 'asleep-dark.png', 'back-dark.png'];
			}
			else{
				duckImages = ['awake.png', 'sleepy.png', 'asleep.png', 'back.png'];
			}
			const imageName = duckImages[Math.min(sleepLevel, duckImages.length - 1)]; // prevents it from going out of bounds	
			const imagePath = webview.asWebviewUri(
				vscode.Uri.joinPath(this.context.extensionUri, 'img', imageName)
			);
			webview.html = getDuckHtml(imagePath.toString(), sleepLevel);
		};

		updateDuck();

		webview.onDidReceiveMessage((message) => {
			if (message.command === 'clicked') {
				if (sleepLevel === 2){
					sleepLevel = 4;
				}
				else if (sleepLevel === 4){
					sleepLevel = 0;
				}
			}
			updateDuck();
		});


		interval = setInterval(() => {
			if (sleepLevel < 2){
				sleepLevel++;
				updateDuck();
			}
		}, 900000); // wait 15 minutes
		}
	}


function getDuckHtml(imageUrl: string, level: number): string {
	if (!imageUrl) {
		console.error('Image failed to load:', imageUrl);
	}
	return ` 
		<html>
			<body style="display:flex;justify-content:center;align-items:center;height:100vh;background-color: var(--vscode-editor-background)">
				<img id="duck" src="${imageUrl}" style="max-width: 100%; max-height: 100%; object-fit: contain;"/>
				<script>
					const vscode = acquireVsCodeApi();
					document.getElementById('duck').addEventListener('click', () => {
					vscode.postMessage({ command: 'clicked' });
					});
				</script>
			</body>
		</html>
	`;
}

let interval: NodeJS.Timeout;

// This method is called when your extension is deactivated
export function deactivate() {
	clearInterval(interval);
}
