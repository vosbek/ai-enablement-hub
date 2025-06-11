import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import * as vscode from 'vscode';

export class BedrockClient {
    private client: BedrockRuntimeClient;
    
    constructor() {
        const config = vscode.workspace.getConfiguration('enterprise');
        const region = config.get<string>('bedrockRegion', 'us-east-1');
        
        this.client = new BedrockRuntimeClient({
            region: region,
            // AWS credentials should be configured via AWS CLI, environment variables, or IAM roles
        });
    }
    
    async generateResponse(prompt: string): Promise<string> {
        try {
            const config = vscode.workspace.getConfiguration('enterprise');
            const modelId = config.get<string>('modelId', 'anthropic.claude-3-sonnet-20240229-v1:0');
            
            const body = JSON.stringify({
                anthropic_version: "bedrock-2023-05-31",
                max_tokens: 4000,
                temperature: 0.1,
                messages: [
                    {
                        role: "user",
                        content: prompt
                    }
                ]
            });
            
            const command = new InvokeModelCommand({
                modelId: modelId,
                contentType: 'application/json',
                accept: 'application/json',
                body: body
            });
            
            const response = await this.client.send(command);
            
            if (!response.body) {
                throw new Error('No response body received from Bedrock');
            }
            
            const responseText = new TextDecoder().decode(response.body);
            const parsed = JSON.parse(responseText);
            
            if (parsed.content && parsed.content[0] && parsed.content[0].text) {
                return parsed.content[0].text;
            } else {
                throw new Error('Unexpected response format from Bedrock');
            }
            
        } catch (error) {
            console.error('Bedrock API Error:', error);
            
            if (error instanceof Error) {
                // Handle specific AWS errors
                if (error.message.includes('credentials')) {
                    throw new Error('AWS credentials not configured. Please set up AWS CLI or configure IAM roles.');
                } else if (error.message.includes('AccessDenied')) {
                    throw new Error('Access denied to Bedrock. Please check your IAM permissions.');
                } else if (error.message.includes('ValidationException')) {
                    throw new Error('Invalid request parameters. Please check your prompt and model configuration.');
                } else if (error.message.includes('ThrottlingException')) {
                    throw new Error('Request throttled. Please try again in a moment.');
                }
            }
            
            throw new Error(`Failed to generate AI response: ${error}`);
        }
    }
    
    async testConnection(): Promise<boolean> {
        try {
            await this.generateResponse('Hello, this is a test message. Please respond with "Test successful".');
            return true;
        } catch (error) {
            console.error('Bedrock connection test failed:', error);
            return false;
        }
    }
    
    getModelInfo(): { provider: string; region: string; modelId: string } {
        const config = vscode.workspace.getConfiguration('enterprise');
        return {
            provider: config.get<string>('aiProvider', 'bedrock'),
            region: config.get<string>('bedrockRegion', 'us-east-1'),
            modelId: config.get<string>('modelId', 'anthropic.claude-3-sonnet-20240229-v1:0')
        };
    }
}