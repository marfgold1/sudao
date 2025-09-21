// Canister IDs and network configuration
export const NETWORK = process.env.DFX_NETWORK || 'local';

// Default canister IDs (will be overridden by declarations)
export const CANISTER_IDS = {
  EXPLORER: process.env.CANISTER_ID_SUDAO_BE_EXPLORER || 'rrkah-fqaaa-aaaaa-aaaaq-cai',
  BACKEND: process.env.CANISTER_ID_SUDAO_BACKEND || 'rno2w-sqaaa-aaaaa-aaacq-cai',
  AMM: process.env.CANISTER_ID_SUDAO_AMM || 'rdmx6-jaaaa-aaaaa-aaadq-cai',
  ICP_LEDGER: process.env.CANISTER_ID_ICP_LEDGER_CANISTER || 'ryjl3-tyaaa-aaaaa-aaaba-cai',
  SUDAO_LEDGER: process.env.CANISTER_ID_SUDAO_LEDGER || 'u6s2n-gx777-77774-qaaba-cai',
  PROPOSAL: process.env.CANISTER_ID_SUDAO_PROPOSAL || '4wdf2-nrj7u-5fe7i-ngftq',
};

// API endpoints
export const API_ENDPOINTS = {
  IC_HOST: NETWORK === 'ic' ? 'https://ic0.app' : 'http://localhost:4943',
};

// App configuration
export const APP_CONFIG = {
  APP_NAME: 'SUDAO',
  VERSION: '1.0.0',
  DESCRIPTION: 'Decentralized Autonomous Organization Platform',
};