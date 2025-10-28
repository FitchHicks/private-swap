import type { Eip1193Provider } from "ethers";

export type EIP712Type = {
  domain: Record<string, unknown>;
  message: Record<string, unknown>;
  primaryType: string;
  types: Record<string, unknown>;
};

export interface FhevmInstanceConfigPublicKey {
  id: string | null;
  data: Uint8Array | null;
}

export interface FhevmInstanceConfigPublicParams {
  "2048": {
    publicParamsId: string;
    publicParams: Uint8Array;
  };
}

export type FhevmInstanceConfig = {
  aclContractAddress: `0x${string}`;
  kmsContractAddress: `0x${string}`;
  inputVerifierContractAddress: `0x${string}`;
  chainId: number;
  gatewayChainId: number;
  network: Eip1193Provider | string;
  relayerUrl: string;
  publicKey?: FhevmInstanceConfigPublicKey;
  publicParams?: FhevmInstanceConfigPublicParams | null;
};

export interface FhevmInstance {
  createEncryptedInput: (
    contractAddress: `0x${string}`,
    userAddress: `0x${string}`
  ) => {
    add8: (v: number | bigint) => void;
    add16: (v: number | bigint) => void;
    add32: (v: number | bigint) => void;
    add64: (v: number | bigint) => void;
    add128: (v: bigint) => void;
    add256: (v: bigint) => void;
    addBool: (v: boolean) => void;
    addAddress: (v: `0x${string}`) => void;
    encrypt: () => Promise<{ handles: string[]; inputProof: string }>;
  };
  createEIP712: (
    publicKey: string,
    contractAddresses: string[],
    startTimestamp: number,
    durationDays: number
  ) => EIP712Type;
  generateKeypair: () => { publicKey: string; privateKey: string };
  userDecrypt: (
    items: { handle: string; contractAddress: `0x${string}` }[],
    privateKey: string,
    publicKey: string,
    signature: string,
    contractAddresses: string[],
    userAddress: `0x${string}`,
    startTimestamp: number,
    durationDays: number
  ) => Promise<Record<string, bigint>>;
  getPublicKey: () => { publicKeyId: string; publicKey: Uint8Array } | null;
  getPublicParams: (size: 2048) => { publicParamsId: string; publicParams: Uint8Array } | null;
}


