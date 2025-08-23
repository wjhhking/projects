import axios from 'axios';
import * as vscode from 'vscode';

export interface LLMRequest {
    context: string;
    variables: any;
    stackTrace: string;
    currentLine: string;
    question: string;
}

export interface LLMResponse {
    analysis: string;
    suggestions: string[];
    nextSteps: string[];
    potentialIssues: string[];
}

export class LLMService {
    private config = vscode.workspace.getConfiguration('llmDebugger');

    async analyzeDebugState(request: LLMRequest): Promise<LLMResponse> {
        const provider = this.config.get<string>('apiProvider', 'openai');
        let apiKey = this.config.get<string>('apiKey');

        // Fallback to environment variables if not set in config
        if (!apiKey) {
            if (provider === 'openai') {
                apiKey = process.env.OPENAI_API_KEY;
            } else if (provider === 'anthropic') {
                apiKey = process.env.ANTHROPIC_API_KEY;
            }
        }

        if (!apiKey) {
            throw new Error(`Please configure your ${provider.toUpperCase()} API key in settings or environment variables`);
        }

        const prompt = this.buildAnalysisPrompt(request);

        try {
            let response;
            if (provider === 'openai') {
                response = await this.callOpenAI(prompt, apiKey);
            } else if (provider === 'anthropic') {
                response = await this.callAnthropic(prompt, apiKey);
            } else if (provider === 'local') {
                response = await this.callLocalLLM(prompt);
            } else {
                throw new Error(`Unsupported provider: ${provider}`);
            }

            return this.parseResponse(response);
        } catch (error) {
            console.error('LLM Service error:', error);
            throw error;
        }
    }

    private buildAnalysisPrompt(request: LLMRequest): string {
        return `You are an expert Python debugging assistant. Analyze the current debugging state and provide insights.

**Current Context:**
${request.context}

**Current Line:**
${request.currentLine}

**Variables:**
${JSON.stringify(request.variables, null, 2)}

**Stack Trace:**
${request.stackTrace}

**Question:**
${request.question}

Please provide a structured analysis including:
1. **Analysis**: What's happening at this point in the code
2. **Suggestions**: Specific debugging suggestions  
3. **Next Steps**: Recommended debugging actions (next, stepIn, stepOut, continue)
4. **Potential Issues**: Any problems or bugs you notice

Format your response as JSON with these exact keys: analysis, suggestions, nextSteps, potentialIssues (all arrays except analysis which is a string).`;
    }

private async callOpenAI(prompt: string, apiKey: string): Promise<string> {
        const model = this.config.get<string>('model', 'gpt-4');
        const url = 'https://api.openai.com/v1/chat/completions';
        
        console.log('=== OPENAI API CALL ===');
        console.log('URL:', url);
        console.log('Model:', model);
        console.log('API Key (first 10 chars):', apiKey.substring(0, 10) + '...');
        
        try {
            const response = await axios.post(url, {
                model: model,
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.3,
                max_tokens: 1000
            }, {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('OpenAI Response Status:', response.status);
            console.log('OpenAI Response Data Keys:', Object.keys(response.data));
            return response.data.choices[0].message.content;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`OpenAI API error: ${error.message}`);
            }
            throw new Error(`OpenAI API error: ${String(error)}`);
        }
    }

    private async callAnthropic(prompt: string, apiKey: string): Promise<string> {
        const model = this.config.get<string>('model', 'claude-3-sonnet-20240229');
        const url = 'https://api.anthropic.com/v1/messages';
        
        console.log('=== ANTHROPIC API CALL ===');
        console.log('URL:', url);
        console.log('Model:', model);
        console.log('API Key (first 10 chars):', apiKey.substring(0, 10) + '...');
        
        try {
            const response = await axios.post(url, {
                model: model,
                max_tokens: 1000,
                messages: [{ role: 'user', content: prompt }]
            }, {
                headers: {
                    'x-api-key': apiKey,
                    'Content-Type': 'application/json',
                    'anthropic-version': '2023-06-01'
                }
            });

            console.log('Anthropic Response Status:', response.status);
            console.log('Anthropic Response Data Keys:', Object.keys(response.data));
            return response.data.content[0].text;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Anthropic API error: ${error.message}`);
            }
            throw new Error(`Anthropic API error: ${String(error)}`);
        }
    }

    private async callLocalLLM(prompt: string): Promise<string> {
        const localEndpoint = this.config.get<string>('localEndpoint', 'http://localhost:11434/api/generate');
        const localModel = this.config.get<string>('localModel', 'codellama');
        
        console.log('=== LOCAL LLM API CALL ===');
        console.log('Endpoint:', localEndpoint);
        console.log('Model:', localModel);
        
        try {
            const response = await axios.post(localEndpoint, {
                model: localModel,
                prompt: prompt,
                stream: false,
                options: {
                    temperature: 0.3,
                    num_ctx: 4096
                }
            });

            console.log('Local LLM Response Status:', response.status);
            console.log('Local LLM Response Data Keys:', Object.keys(response.data));
            return response.data.response || response.data.content;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Local LLM error: ${error.message}. Make sure your local LLM server is running.`);
            }
            throw new Error(`Local LLM error: ${String(error)}. Make sure your local LLM server is running.`);
        }
    }
    private parseResponse(response: string): LLMResponse {
        try {
            // Try to parse as JSON first
            const parsed = JSON.parse(response);
            return {
                analysis: parsed.analysis || 'No analysis provided',
                suggestions: parsed.suggestions || [],
                nextSteps: parsed.nextSteps || [],
                potentialIssues: parsed.potentialIssues || []
            };
        } catch {
            // If JSON parsing fails, create a structured response
            return {
                analysis: response,
                suggestions: ['Review the current state and variables'],
                nextSteps: ['Continue debugging step by step'],
                potentialIssues: ['Unable to parse structured response']
            };
        }
    }
}