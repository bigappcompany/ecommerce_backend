import { 
  IsNotEmpty, 
  IsOptional, 
  IsString, 
  IsNumber, 
  ValidateNested, 
  IsArray 
} from 'class-validator';
import { Type } from 'class-transformer';

class FeatureDto {
  @IsNotEmpty()
  @IsString()
  type: any;

  @IsNotEmpty()
  config: Record<string, any>;

  @IsNotEmpty()
  @IsNumber()
  priority: number;
}

export class CreateAgentDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  agent_role?: string;

  @IsOptional()
  @IsString()
  agent_instructions?: string;

  @IsOptional()
  @IsString()
  examples?: string;

  @IsOptional()
  @IsString()
  tool?: string;

  @IsOptional()
  @IsString()
  tool_usage_description?: string;

  @IsNotEmpty()
  @IsString()
  provider: string;

  @IsNotEmpty()
  @IsString()
  model: string;

  @IsOptional()
  @IsNumber()
  temperature?: number;

  @IsOptional()
  @IsNumber()
  top_p?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FeatureDto)
  features?: FeatureDto[];
}



// {
//   "name": "Sales Assistant",
//   "description": "AI for assisting in sales queries.",
//   "agent_role": "sales_agent",
//   "agent_instructions": "Provide recommendations based on customer preferences.",
//   "examples": "Q: Recommend a laptop under $1000. A: Sure, here are some options...",
//   "tool": "retrieval",
//   "tool_usage_description": "Fetches relevant sales data.",
//   "provider": "openai",
//   "model": "gpt-4",
//   "temperature": 0.8,
//   "top_p": 0.9,
//   "features": [
//     {
//       "type": "memory",
//       "config": {
//         "context_length": 15
//       },
//       "priority": 1
//     },
//     {
//       "type": "retrieval",
//       "config": {
//         "source": "CRM_database"
//       },
//       "priority": 2
//     }
//   ]
// }
