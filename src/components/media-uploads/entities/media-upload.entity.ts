import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { MediaUploadFileTypesEnum } from '../constants/media-uploads.enum';
import { User } from 'src/components/users/entities/user.entity';

@Entity()
export class MediaUpload {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  hash: string;

  @Column({
    nullable: true,
  })
  url: string;

  @Column()
  key: string;

  @Column()
  mime_type: string;

  @Column({
    type: 'enum',
    enum: MediaUploadFileTypesEnum,
  })
  file_type: MediaUploadFileTypesEnum;

  @Column()
  extension: string;

  @Column({ default: false })
  is_s3_direct_upload: boolean;
  
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  created_by: User;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
