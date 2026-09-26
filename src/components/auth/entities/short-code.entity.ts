import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
  } from 'typeorm';
  import { AuthCodeVerificationTypeEnum } from '../constants/auth.enum';
  
  @Entity()
  export class ShortCode {
    @PrimaryGeneratedColumn('uuid')
    id: any;
  
    @Column()
    code: string;
  }
  