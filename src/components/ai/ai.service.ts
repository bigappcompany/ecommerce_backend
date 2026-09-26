import { Injectable } from '@nestjs/common';
import { OpenAI } from 'openai';
import { Anthropic } from '@anthropic-ai/sdk';
import { CohereClient } from 'cohere-ai';
import { HfInference } from '@huggingface/inference';
import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';

@Injectable()
export class AIService {
  async generateResponse(
    provider: string,
    apiKey: string,
    model: string,
    userInput: string,
    agentRole?: string,
    agentInstructions?: string,
    description?: string,
  ): Promise<string> {
    // Constructing a well-structured prompt
    const prompt =
      `Role: ${agentRole}\nDescription: ${description || 'N/A'}\nInstructions: ${agentInstructions}\n\nUser Query: ${userInput}\n\n`;
    try {
      switch (provider) {
        case 'openai': {
          const openai = new OpenAI({ apiKey });
          const response = await openai.completions.create({
            model,
            prompt,
            max_tokens: 150,
          });
          return response.choices[0].text;
        }

        case 'anthropic': {
          const anthropic = new Anthropic({ apiKey });
          const response = await anthropic.completions.create({
            model,
            prompt,
            max_tokens_to_sample: 150,
          });
          return response.completion;
        }

        case 'cohere': {
          const cohere = new CohereClient({ token: apiKey });
          const response = await cohere.generate({
            model,
            prompt,
            maxTokens: 150,
          });
          return response.generations[0].text;
        }

        case 'huggingface': {
          const hf = new HfInference(apiKey);
          const response = await hf.textGeneration({
            model,
            inputs: prompt,
          });
          return response.generated_text;
        }

        case 'google': {
          const genAI = new GoogleGenerativeAI(apiKey);
          const generativeModel = genAI.getGenerativeModel({ model });
          const result = await generativeModel.generateContent(prompt);
          return result.response.text();
        }

        case 'deepseek': {
          const response = await axios.post(
            'https://api.deepseek.com/v1/completions',
            {
              model,
              prompt,
              max_tokens: 150,
            },
            {
              headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
              },
            },
          );
          return response.data.choices[0].text;
        }

        default:
          throw new Error(`Unsupported provider: ${provider}`);
      }
    } catch (error) {
      console.error(`Error generating response from ${provider}:`, error);
      throw new Error(`Failed to generate response: ${error.message}`);
    }
  }
}
