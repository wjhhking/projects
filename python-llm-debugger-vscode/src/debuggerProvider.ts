import * as vscode from 'vscode';
import { LLMService } from './llmService';
import { DebugAnalyzer } from './debugAnalyzer';

export class DebugTreeItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly command?: vscode.Command
    ) {
        super(label, collapsibleState);
        this.tooltip = this.label;
    }
}

export class LLMDebuggerProvider implements vscode.TreeDataProvider<DebugTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<DebugTreeItem | undefined | null | void> = new vscode.EventEmitter<DebugTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<DebugTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private currentSession: vscode.DebugSession | null = null;
    private analysisResults: any = null;
    private isActive = false;

    constructor(
        private context: vscode.ExtensionContext,
        private llmService: LLMService,
        private debugAnalyzer: DebugAnalyzer
    ) {}

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: DebugTreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: DebugTreeItem): Thenable<DebugTreeItem[]> {
        if (!this.isActive) {
            return Promise.resolve([
                new DebugTreeItem('Start LLM Debug Session', vscode.TreeItemCollapsibleState.None, {
                    command: 'llm-debugger.startSession',
                    title: 'Start Session'
                })
            ]);
        }

        if (!element) {
            // Root level
            const items = [
                new DebugTreeItem('Debug Controls', vscode.TreeItemCollapsibleState.Expanded),
                new DebugTreeItem('LLM Analysis', vscode.TreeItemCollapsibleState.Expanded)
            ];
            return Promise.resolve(items);
        }

        if (element.label === 'Debug Controls') {
            return Promise.resolve([
                new DebugTreeItem('▶️ Continue', vscode.TreeItemCollapsibleState.None, {
                    command: 'workbench.action.debug.continue',
                    title: 'Continue'
                }),
                new DebugTreeItem('⏭️ Step Over', vscode.TreeItemCollapsibleState.None, {
                    command: 'workbench.action.debug.stepOver',
                    title: 'Step Over'
                }),
                new DebugTreeItem('⬇️ Step Into', vscode.TreeItemCollapsibleState.None, {
                    command: 'workbench.action.debug.stepInto',
                    title: 'Step Into'
                }),
                new DebugTreeItem('⬆️ Step Out', vscode.TreeItemCollapsibleState.None, {
                    command: 'workbench.action.debug.stepOut',
                    title: 'Step Out'
                }),
                new DebugTreeItem('🔍 Analyze State', vscode.TreeItemCollapsibleState.None, {
                    command: 'llm-debugger.analyzeCurrentState',
                    title: 'Analyze Current State'
                }),
                new DebugTreeItem('💡 Get Suggestion', vscode.TreeItemCollapsibleState.None, {
                    command: 'llm-debugger.suggestNextStep',
                    title: 'Get LLM Suggestion'
                })
            ]);
        }

        if (element.label === 'LLM Analysis') {
            if (!this.analysisResults) {
                return Promise.resolve([
                    new DebugTreeItem('No analysis yet', vscode.TreeItemCollapsibleState.None)
                ]);
            }

            const items: DebugTreeItem[] = [];
            
            if (this.analysisResults.analysis) {
                items.push(new DebugTreeItem(`📋 ${this.analysisResults.analysis.substring(0, 50)}...`, vscode.TreeItemCollapsibleState.None));
            }

            if (this.analysisResults.suggestions && this.analysisResults.suggestions.length > 0) {
                items.push(new DebugTreeItem('💡 Suggestions', vscode.TreeItemCollapsibleState.Expanded));
            }

            if (this.analysisResults.nextSteps && this.analysisResults.nextSteps.length > 0) {
                items.push(new DebugTreeItem('👣 Next Steps', vscode.TreeItemCollapsibleState.Expanded));
            }

            return Promise.resolve(items);
        }

        if (element.label === '💡 Suggestions' && this.analysisResults?.suggestions) {
            return Promise.resolve(
                this.analysisResults.suggestions.map((suggestion: string) => 
                    new DebugTreeItem(`• ${suggestion}`, vscode.TreeItemCollapsibleState.None)
                )
            );
        }

        if (element.label === '👣 Next Steps' && this.analysisResults?.nextSteps) {
            return Promise.resolve(
                this.analysisResults.nextSteps.map((step: string) => 
                    new DebugTreeItem(`• ${step}`, vscode.TreeItemCollapsibleState.None)
                )
            );
        }

        return Promise.resolve([]);
    }

    startSession() {
        this.isActive = true;
        vscode.window.showInformationMessage('LLM Debug session started');
        this.refresh();
    }

    async analyzeCurrentState() {
        let session = this.currentSession || vscode.debug.activeDebugSession;

        console.log('=== DEBUG SESSION INFO ===');
        console.log('this.currentSession:', this.currentSession);
        console.log('vscode.debug.activeDebugSession:', vscode.debug.activeDebugSession);
        console.log('Selected session:', session);
        console.log('Session type:', session?.type);
        console.log('Session name:', session?.name);
        console.log('Session configuration:', session?.configuration);
        console.log('========================');
        
        if (!session) {
            vscode.window.showWarningMessage('No active debug session');
            return;
        }

        // Check if it's a Python session
        const isPythonSession = session.type === 'python' || 
                       session.type === 'pythonFile' || 
                       session.type === 'debugpy' ||
                       session.configuration?.type === 'python';
                       
        if (!isPythonSession) {
            vscode.window.showWarningMessage(`LLM Debugger detected session type "${session.type}" but only works with Python. Current config: ${JSON.stringify(session.configuration)}`);
            return;
        }

        vscode.window.showInformationMessage('Analyzing debug state...');
        console.log('Analyzing debug state for session:', session.name, 'type:', session.type);
        
        try {
            this.analysisResults = await this.debugAnalyzer.analyzeCurrentDebugState(session);
            this.refresh();
            
            if (this.analysisResults) {
                vscode.window.showInformationMessage('Analysis complete!');
            } else {
                vscode.window.showWarningMessage('Unable to analyze current state');
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Analysis failed: ${error}`);
        }
    }

    async suggestNextStep() {
        await this.analyzeCurrentState();
        
        if (this.analysisResults?.nextSteps && this.analysisResults.nextSteps.length > 0) {
            const suggestion = this.analysisResults.nextSteps[0];
            const result = await vscode.window.showInformationMessage(
                `LLM Suggestion: ${suggestion}`,
                'Apply', 'Ignore'
            );
            
            if (result === 'Apply') {
                // Try to execute the suggestion
                this.executeSuggestion(suggestion);
            }
        }
    }

    private executeSuggestion(suggestion: string) {
        const lowerSuggestion = suggestion.toLowerCase();
        
        if (lowerSuggestion.includes('step over') || lowerSuggestion.includes('next')) {
            vscode.commands.executeCommand('workbench.action.debug.stepOver');
        } else if (lowerSuggestion.includes('step into')) {
            vscode.commands.executeCommand('workbench.action.debug.stepInto');
        } else if (lowerSuggestion.includes('step out')) {
            vscode.commands.executeCommand('workbench.action.debug.stepOut');
        } else if (lowerSuggestion.includes('continue')) {
            vscode.commands.executeCommand('workbench.action.debug.continue');
        }
    }

    async setIntelligentBreakpoint() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage('No active editor');
            return;
        }

        const position = editor.selection.active;
        const reason = await vscode.window.showInputBox({
            prompt: 'Why do you want to set a breakpoint here?',
            placeHolder: 'e.g., Check if variable x is null, Debug loop iteration'
        });

        if (reason) {
            // Set a regular breakpoint
            const breakpoint = new vscode.SourceBreakpoint(
                new vscode.Location(editor.document.uri, position),
                true
            );
            
            vscode.debug.addBreakpoints([breakpoint]);
            vscode.window.showInformationMessage(`Intelligent breakpoint set: ${reason}`);
        }
    }

    onDebugSessionStart(session: vscode.DebugSession) {
        console.log('Debug session started:', session.name, 'type:', session.type);
        const isPythonSession = session.type === 'python' || session.type === 'pythonFile' || session.type === 'debugpy';

        if (isPythonSession) {
            this.currentSession = session;
            this.isActive = true;
            this.refresh();
            vscode.window.showInformationMessage(`LLM Debugger: Python session "${session.name}" detected`);
        }
    }

    onDebugSessionEnd(session: vscode.DebugSession) {
        console.log('Debug session ended:', session.name);
        if (this.currentSession === session) {
            this.currentSession = null;
            this.analysisResults = null;
            this.isActive = false;
            this.refresh();
        }
    }

    onActiveSessionChanged(session: vscode.DebugSession | undefined){
        console.log('Active session changed:', session?.name, 'type:', session?.type);
        const isPythonSession = session && (session.type === 'python' || session.type === 'pythonFile' || session.type === 'debugpy');

        if (isPythonSession) {
            this.currentSession = session;
            this.isActive = true;
        } else {
            this.currentSession = null;
            this.isActive = false;
        }
        this.refresh();
    }
}