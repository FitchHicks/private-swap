import { isAddress, Eip1193Provider, JsonRpcProvider } from "ethers";
import type { FhevmInstance, FhevmInstanceConfig } from "../fhevmTypes";
import { RelayerSDKLoader, FhevmWindowType } from "./RelayerSDKLoader";
import { publicKeyStorageGet, publicKeyStorageSet } from "./PublicKeyStorage";

export class FhevmReactError extends Error {
  code: string;
  constructor(code: string, message?: string, options?: ErrorOptions) {
    super(message, options);
    this.code = code;
    this.name = "FhevmReactError";
  }
}

const isFhevmInitialized = (): boolean => {
  if (!("relayerSDK" in window)) return false;
  return (window as any).relayerSDK.__initialized__ === true;
};

const fhevmLoadSDK = () => {
  const loader = new RelayerSDKLoader({ trace: console.log });
  return loader.load();
};

const fhevmInitSDK = async (options?: unknown) => {
  const win = window as unknown as FhevmWindowType;
  const result = await win.relayerSDK.initSDK(options as any);
  win.relayerSDK.__initialized__ = result;
  if (!result) throw new Error("initSDK failed");
};

async function getChainId(providerOrUrl: Eip1193Provider | string): Promise<number> {
  if (typeof providerOrUrl === "string") {
    const provider = new JsonRpcProvider(providerOrUrl);
    return Number((await provider.getNetwork()).chainId);
  }
  const chainId = await providerOrUrl.request({ method: "eth_chainId" });
  return Number.parseInt(chainId as string, 16);
}

async function getWeb3Client(rpcUrl: string) {
  const rpc = new JsonRpcProvider(rpcUrl);
  try {
    const version = await rpc.send("web3_clientVersion", []);
    return version;
  } finally {
    rpc.destroy();
  }
}

async function getFHEVMRelayerMetadata(rpcUrl: string) {
  const rpc = new JsonRpcProvider(rpcUrl);
  try {
    const version = await rpc.send("fhevm_relayer_metadata", []);
    return version;
  } finally {
    rpc.destroy();
  }
}

async function tryFetchFHEVMHardhatNodeRelayerMetadata(rpcUrl: string) {
  const version = await getWeb3Client(rpcUrl);
  if (typeof version !== "string" || !version.toLowerCase().includes("hardhat")) {
    return undefined;
  }
  try {
    const metadata = await getFHEVMRelayerMetadata(rpcUrl);
    if (!metadata || typeof metadata !== "object") return undefined;
    if (!("ACLAddress" in metadata) || typeof (metadata as any).ACLAddress !== "string") return undefined;
    if (!("InputVerifierAddress" in metadata) || typeof (metadata as any).InputVerifierAddress !== "string") return undefined;
    if (!("KMSVerifierAddress" in metadata) || typeof (metadata as any).KMSVerifierAddress !== "string") return undefined;
    return metadata as { ACLAddress: `0x${string}`; InputVerifierAddress: `0x${string}`; KMSVerifierAddress: `0x${string}` };
  } catch {
    return undefined;
  }
}

type ResolveResult = { isMock: boolean; chainId: number; rpcUrl?: string };
async function resolve(providerOrUrl: Eip1193Provider | string, mockChains?: Record<number, string>): Promise<ResolveResult> {
  const chainId = await getChainId(providerOrUrl);
  let rpcUrl = typeof providerOrUrl === "string" ? providerOrUrl : undefined;
  const _mockChains: Record<number, string> = { 31337: "http://localhost:8545", ...(mockChains ?? {}) };
  if (Object.hasOwn(_mockChains, chainId)) {
    if (!rpcUrl) rpcUrl = _mockChains[chainId];
    return { isMock: true, chainId, rpcUrl };
  }
  return { isMock: false, chainId, rpcUrl };
}

export const createFhevmInstance = async (parameters: {
  provider: Eip1193Provider | string;
  mockChains?: Record<number, string>;
  signal: AbortSignal;
  onStatusChange?: (status: "sdk-loading" | "sdk-loaded" | "sdk-initializing" | "sdk-initialized" | "creating") => void;
}): Promise<FhevmInstance> => {
  const { provider: providerOrUrl, mockChains, signal, onStatusChange } = parameters;
  const throwIfAborted = () => { if (signal.aborted) throw new Error("aborted"); };
  const notify = (s: any) => onStatusChange?.(s);

  const { isMock, rpcUrl, chainId } = await resolve(providerOrUrl, mockChains);

  if (isMock && rpcUrl) {
    const meta = await tryFetchFHEVMHardhatNodeRelayerMetadata(rpcUrl);
    if (meta) {
      notify("creating");
      const fhevmMock = await import("./mock/fhevmMock");
      const mockInstance = await fhevmMock.fhevmMockCreateInstance({ rpcUrl, chainId, metadata: meta });
      throwIfAborted();
      return mockInstance as unknown as FhevmInstance;
    }
  }

  throwIfAborted();
  if (!("relayerSDK" in window)) {
    notify("sdk-loading");
    await fhevmLoadSDK();
    throwIfAborted();
    notify("sdk-loaded");
  }
  if (!isFhevmInitialized()) {
    notify("sdk-initializing");
    await fhevmInitSDK();
    throwIfAborted();
    notify("sdk-initialized");
  }

  const relayerSDK = (window as unknown as FhevmWindowType).relayerSDK;
  const aclAddress = relayerSDK.SepoliaConfig.aclContractAddress;
  if (!isAddress(aclAddress)) throw new Error(`Invalid ACL address ${aclAddress}`);

  const aclAddressHex = aclAddress as `0x${string}`;
  const pub = await publicKeyStorageGet(aclAddressHex);
  throwIfAborted();

  const config: FhevmInstanceConfig = {
    ...relayerSDK.SepoliaConfig,
    network: providerOrUrl,
    publicKey: pub.publicKey,
    publicParams: pub.publicParams,
  } as any;

  notify("creating");
  const instance = await relayerSDK.createInstance(config);
  await publicKeyStorageSet(aclAddressHex, instance.getPublicKey(), instance.getPublicParams(2048));
  throwIfAborted();
  return instance as FhevmInstance;
};


