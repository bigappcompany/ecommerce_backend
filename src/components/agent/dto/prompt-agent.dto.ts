import { 
  IsNotEmpty, 
  IsOptional, 
  IsString, 
  IsNumber, 
  ValidateNested, 
  IsArray 
} from 'class-validator';


export class PromptAgentDto {
  @IsNotEmpty()
  @IsString()
  prompt: string;
}

