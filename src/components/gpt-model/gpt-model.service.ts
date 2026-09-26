import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GptModel } from './entities/gpt-model.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class GptModelsService {
  constructor(
    @InjectRepository(GptModel)
    private readonly gptModelRepository: Repository<GptModel>,

    @InjectRepository(User) // Inject User repository to fetch the user
    private readonly userRepository: Repository<User>,
  ) {}

  // Create Method
  async create(req: any, name: string, description: string): Promise<GptModel> {
    const userId = req.user.id;
    const user = await this.userRepository.findOne(userId); // Find the User entity
    if (!user) {
      throw new Error('User not found');
    }

    const gptModel = this.gptModelRepository.create({
      name,
      description,
      user, // Assign the full User entity
    });

    return await this.gptModelRepository.save(gptModel);
  }

  // Update Method
  async update(
    id: string,
    name: string,
    description: string,
    req: any,
  ): Promise<GptModel> {
    const userId = req.user.id;
    const user = await this.userRepository.findOne(userId); // Get the user

    if (!user) {
      throw new Error('User not found');
    }

    const gptModel = await this.gptModelRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!gptModel) {
      throw new Error('GptModel not found');
    }

    // Check if the user is the owner of the GPT model (optional)
    if (gptModel.user.id !== userId) {
      throw new Error('You can only update your own GPT models');
    }

    // Update the GPT model fields
    gptModel.name = name;
    gptModel.description = description;

    return await this.gptModelRepository.save(gptModel);
  }

  // Delete Method
  async delete(id: string, req: any): Promise<void> {
    const userId = req.user.id;
    const user = await this.userRepository.findOne(userId);

    if (!user) {
      throw new Error('User not found');
    }

    const gptModel = await this.gptModelRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!gptModel) {
      throw new Error('GptModel not found');
    }

    // Check if the user is the owner of the GPT model (optional)
    if (gptModel.user.id !== userId) {
      throw new Error('You can only delete your own GPT models');
    }

    await this.gptModelRepository.remove(gptModel); // Delete the model
  }

  // FindOne Method
  async findOne(id: string): Promise<GptModel> {
    const gptModel = await this.gptModelRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!gptModel) {
      throw new Error('GptModel not found');
    }

    return gptModel;
  }
}


