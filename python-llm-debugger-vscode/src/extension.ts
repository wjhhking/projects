import * as vscode from 'vscode';
import { LLMDebuggerProvider } from './debuggerProvider';
import { LLMService } from './llmService';
import { DebugAnalyzer } from './debugAnalyzer';

let debuggerProvider: LLMDebuggerProvider;
let llmService: LLMService;
let debugAnalyzer: DebugAnalyzer;

export function activate(context: vscode.ExtensionContext) {
    console.log('LLM Python Debugger extension activated');

    // Initialize services
    llmService = new LLMService();
    debugAnalyzer = new DebugAnalyzer(llmService);
    debuggerProvider = new LLMDebuggerProvider(context, llmService, debugAnalyzer);

    // Register tree data provider
    const treeDataProvider = vscode.window.registerTreeDataProvider('llmDebuggerPanel', debuggerProvider);
    context.subscriptions.push(treeDataProvider);

    // Auto-start if debug session is already active
    if (vscode.debug.activeDebugSession?.type === 'python') {
        console.log('Detected active Python debug session — starting LLM Debugger');
        debuggerProvider.startSession();
        debuggerProvider.onDebugSessionStart(vscode.debug.activeDebugSession);
    }

    // Register commands
    const commands = [
        vscode.commands.registerCommand('llm-debugger.startSession', () => {
            debuggerProvider.startSession();
        }),
        vscode.commands.registerCommand('llm-debugger.analyzeCurrentState', () => {
            debuggerProvider.analyzeCurrentState();
        }),
        vscode.commands.registerCommand('llm-debugger.suggestNextStep', () => {
            debuggerProvider.suggestNextStep();
        }),
        vscode.commands.registerCommand('llm-debugger.setIntelligentBreakpoint', () => {
            debuggerProvider.setIntelligentBreakpoint();
        })
    ];
    context.subscriptions.push(...commands);

    // Listen for debug session events
    vscode.debug.onDidStartDebugSession((session) => {
        if (!session) {
            return; // no active debug session
        }
        const isPythonSession = session.type === 'python' || session.type === 'pythonFile' || session.type === 'debugpy';
        if (isPythonSession) {
            console.log('Python debug session started, activating LLM debugger');
            debuggerProvider.onDebugSessionStart(session);
        }
    });

    vscode.debug.onDidTerminateDebugSession((session) => {
        if (!session) {
            return; // no active debug session
        }
        const isPythonSession = session.type === 'python' || session.type === 'pythonFile' || session.type === 'debugpy';
        if (isPythonSession) {
            debuggerProvider.onDebugSessionEnd(session);
        }
    });

    vscode.debug.onDidChangeActiveDebugSession((session) => {
        if (!session) {
            return; // no active debug session
        }
        const isPythonSession = session.type === 'python' || session.type === 'pythonFile' || session.type === 'debugpy';
        if (isPythonSession) {
            debuggerProvider.onActiveSessionChanged(session);
        }
    });
}

export function deactivate() {
    console.log('LLM Python Debugger extension deactivated');
}