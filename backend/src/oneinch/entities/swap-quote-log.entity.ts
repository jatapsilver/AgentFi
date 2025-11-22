import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'swap_quote_logs' })
export class SwapQuoteLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  userId?: string;

  @Column()
  chainId: string;

  @Column()
  fromTokenAddress: string;

  @Column()
  toTokenAddress: string;

  @Column('numeric', { precision: 78, scale: 0 })
  amountIn: string;

  @Column('numeric', { precision: 78, scale: 0, nullable: true })
  amountOut?: string;

  @Column({ nullable: true })
  fromAddress?: string;

  @Column({ nullable: true })
  oneInchRequestId?: string;

  @Column({ type: 'jsonb', nullable: true })
  rawResponse?: any;

  @CreateDateColumn()
  createdAt: Date;
}
