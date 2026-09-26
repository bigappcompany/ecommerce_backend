import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
  } from 'typeorm';
  import {
    AuthCodeVerificationTypeEnum,
    AuthUserTypeEnum,
  } from '../constants/auth.enum';
  
  @Entity()
  export class AuthCodeVerification {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column()
    code_hash: string;
  
    @Column({ type: 'uuid' })
    user_id: any;
  
    @CreateDateColumn({ type: 'timestamp' })
    created_at: Date;
  
    @UpdateDateColumn({ type: 'timestamp' })
    updated_at: Date;
  }
  