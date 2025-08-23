import * as vscode from 'vscode';
import { LLMService, LLMRequest } from './llmService';

export interface DebugContext {
    currentLine: number;
    currentFile: string;
    variables: any;
    stackTrace: any[];
    breakpoints: readonly vscode.Breakpoint[];
}

export class DebugAnalyzer {
    constructor(private llmService: LLMService) {}

    async analyzeCurrentDebugState(session: vscode.DebugSession): Promise<any> {
        try {
            const context = await this.getDebugContext(session);
            if (!context) {
                return null;
            }

            const request: LLMRequest = {
                context: await this.getCodeContext(context.currentFile, context.currentLine),
                variables: context.variables,
                stackTrace: this.formatStackTrace(context.stackTrace),
                currentLine: `Line ${context.currentLine}: ${await this.getCurrentLineContent(context.currentFile, context.currentLine)}`,
                question: 'Analyze the current debugging state and suggest next steps.'
            };

            return await this.llmService.analyzeDebugState(request);
        } catch (error) {
            console.error('Debug analysis error:', error);
            return null;
        }
    }

    private async getDebugContext(session: vscode.DebugSession): Promise<DebugContext | null> {
        try {
            // Get current stack frame
            const threads = await session.customRequest('threads');
            if (!threads.threads || threads.threads.length === 0) {
                return null;
            }

            const threadId = threads.threads[0].id;
            const stackTrace = await session.customRequest('stackTrace', { threadId });
            
            if (!stackTrace.stackFrames || stackTrace.stackFrames.length === 0) {
                return null;
            }

            const currentFrame = stackTrace.stackFrames[0];
            const variables = await this.getFrameVariables(session, currentFrame.id);

            return {
                currentLine: currentFrame.line,
                currentFile: currentFrame.source.path,
                variables: variables,
                stackTrace: stackTrace.stackFrames,
                breakpoints: [...vscode.debug.breakpoints]
            };
        } catch (error) {
            console.error('Error getting debug context:', error);
            return null;
        }
    }

    private async getFrameVariables(session: vscode.DebugSession, frameId: number): Promise<any> {
        try {
            const scopes = await session.customRequest('scopes', { frameId });
            const variables: any = {};

            for (const scope of scopes.scopes) {
                const scopeVars = await session.customRequest('variables', { 
                    variablesReference: scope.variablesReference 
                });
                
                variables[scope.name] = {};
                for (const variable of scopeVars.variables) {
                    variables[scope.name][variable.name] = variable.value;
                }
            }

            return variables;
        } catch (error) {
            console.error('Error getting variables:', error);
            return {};
        }
    }

    private async getCodeContext(filePath: string, currentLine: number): Promise<string> {
        try {
            let document;
            if (typeof filePath === 'string') {
                // Handle both URI and file path strings
                const uri = filePath.startsWith('file://') ? vscode.Uri.parse(filePath) : vscode.Uri.file(filePath);
                document = await vscode.workspace.openTextDocument(uri);
            } else {
                document = await vscode.workspace.openTextDocument(filePath);
            }
            
            const maxLines = vscode.workspace.getConfiguration('llmDebugger').get<number>('maxContextLines', 50);
            
            const startLine = Math.max(0, currentLine - Math.floor(maxLines / 2));
            const endLine = Math.min(document.lineCount, currentLine + Math.floor(maxLines / 2));
            
            let context = '';
            for (let i = startLine; i < endLine; i++) {
                const lineContent = document.lineAt(i).text;
                const marker = i === currentLine - 1 ? ' --> ' : '     ';
                context += `${i + 1}:${marker}${lineContent}\n`;
            }
            
            return context;
        } catch (error) {
            console.error('Error getting code context:', error);
            return 'Unable to retrieve code context';
        }
    }

    private async getCurrentLineContent(filePath: string, lineNumber: number): Promise<string> {
        try {
            let document;
            if (typeof filePath === 'string') {
                // Handle both URI and file path strings
                const uri = filePath.startsWith('file://') ? vscode.Uri.parse(filePath) : vscode.Uri.file(filePath);
                document = await vscode.workspace.openTextDocument(uri);
            } else {
                document = await vscode.workspace.openTextDocument(filePath);
            }
            return document.lineAt(lineNumber - 1).text.trim();
        } catch (error) {
            console.error('Error getting current line content:', error);
            return 'Unable to retrieve current line';
        }
    }

    private formatStackTrace(stackFrames: any[]): string {
        return stackFrames.map((frame, index) => {
            const location = `${frame.source?.name || 'unknown'}:${frame.line}`;
            const name = frame.name || 'unknown';
            return `${index}: ${name} at ${location}`;
        }).join('\n');
    }
}