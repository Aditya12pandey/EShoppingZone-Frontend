export interface Statement {
  statementId: string;
  transactionType: string;
  amount: number;
  date: Date;
  remarks: string;
  walletId: string;
}

export interface EWallet {
  walletId: string; // Same as UserId
  currentBalance: number;
  statements: Statement[];
}

export interface AddMoneyDto {
  amount: number;
}
