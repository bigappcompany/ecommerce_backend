import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('AI Providers')
@Controller('providers')
export class AIProvidersController {
  @Get('llm-providers')
  async getProviders(@Res() res) {
    const providers = {
      OPENAI: {
        name: 'openai',
        models: ['gpt-4', 'gpt-3.5-turbo'],
      },
      ANTHROPIC: {
        name: 'anthropic',
        models: ['claude-v1', 'claude-v2'],
      },
      COHERE: {
        name: 'cohere',
        models: ['command', 'command-nightly'],
      },
      HUGGINGFACE: {
        name: 'huggingface',
        models: ['gpt2', 'flan-t5-large'],
      },
      GOOGLE: {
        name: 'google',
        models: ['gemini-pro', 'gemini-ultra'],
      },
      DEEPSEEK: {
        name: 'deepseek',
        models: ['deepseek-chat', 'deepseek-coder'],
      },
    };
    return res.status(HttpStatus.OK).json({
      statusCode: HttpStatus.OK,
      message: 'LLM Providers',
      data: providers,
    });
  }
  @Get('webcrawler-poviders')
  WebCrawlerProviders(@Res() res) {
    const providers = {
      providers: {
        FIRECRAWL: {
          name: 'firecrawl',
          models: [],
        },
        SCRAPY: {
          name: 'scrapy',
          models: [],
        },
        PUPPETEER: {
          name: 'puppeteer',
          models: [],
        },
        SELENIUM: {
          name: 'selenium',
          models: [],
        },
        PLAYWRIGHT: {
          name: 'playwright',
          models: [],
        },
      },
    };
    return res.status(HttpStatus.OK).json({
      statusCode: HttpStatus.OK,
      message: 'Webcrawler Providers',
      data: providers,
    });
  }
  @Get('embedding-poviders')
  EmbeddingProviders(@Res() res) {
    const providers = {
      providers: {
        OPENAI: {
          name: 'openai',
          models: [],
        },
        COHERE: {
          name: 'cohere',
          models: [],
        },
        GOOGLE: {
          name: 'google',
          models: [],
        },
        TOGETHERAI: {
          name: 'togetherai',
          models: [],
        },
        HUGGINGFACE: {
          name: 'huggingface',
          models: [],
        },
      },
    };
    return res.status(HttpStatus.OK).json({
      statusCode: HttpStatus.OK,
      message: 'Embedding Providers',
      data: providers,
    });
  }
  @Get('vectorstore-poviders')
  VectorStoreProviders(@Res() res) {
    const providers = {
      providers: {
        MILVUS: {
          name: 'milvus',
          models: [],
        },
        PINECONE: {
          name: 'pinecone',
          models: [],
        },
        QDRANT: {
          name: 'qdrant',
          models: [],
        },
        WEAVIATE: {
          name: 'weaviate',
          models: [],
        },
        CHROMADB: {
          name: 'chromadb',
          models: [],
        },
      },
    };
    return res.status(HttpStatus.OK).json({
      statusCode: HttpStatus.OK,
      message: 'VectorStore Providers',
      data: providers,
    });
  }
}
