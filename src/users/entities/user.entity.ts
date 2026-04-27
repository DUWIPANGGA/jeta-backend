import {  
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  BeforeInsert,
  BeforeUpdate, 
} from 'typeorm';

import * as bcrypt from 'bcrypt';


export enum UserRole {
  ADMIN = 'admin',
  PIC = 'pic',
  CUSTOMER = 'customer',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.CUSTOMER })
  role: UserRole;

  @Column({ nullable: true })
  password: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}