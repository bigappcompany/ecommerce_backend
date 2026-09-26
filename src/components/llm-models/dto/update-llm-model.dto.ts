import { CreateLLMModelDto } from './create-llm-model.dto';

import { PartialType } from '@nestjs/mapped-types';

export class UpdateLLMModelDto extends PartialType(CreateLLMModelDto) {}
