"use client";

import { ethers } from "ethers";
import { useCallback, useMemo, useRef, useState } from "react";
import type { FhevmInstance } from "@/fhevm/fhevmTypes";
import { FhevmDecryptionSignature } from "@/fhevm/FhevmDecryptionSignature";
import { GenericStringStorage } from "@/fhevm/GenericStringStorage";
import { PrivateSwapABI } from "@/abi/PrivateSwapABI";
import { PrivateSwapAddresses } from "@/abi/PrivateSwapAddresses";

type HookParams = {
  instance: FhevmInstance | undefined;
  storage: GenericStringStorage;
  chainId: number | undefined;
  ethersSigner: ethers.JsonRpcSigner | undefined;
  ethersReadonlyProvider: ethers.ContractRunner | undefined;
  sameChain: React.RefObject<(chainId: number | undefined) => boolean>;
  sameSigner: React.RefObject<(ethersSigner: ethers.JsonRpcSigner | undefined) => boolean>;
};

export function usePrivateSwap(params: HookParams) {
  const { instance, storage, chainId, ethersSigner, ethersReadonlyProvider, sameChain, sameSigner } = params;

  const [lastQuoteHandle, setLastQuoteHandle] = useState<string | undefined>(undefined);
  const [clearQuote, setClearQuote] = useState<bigint | undefined>(undefined);
  const [isQuoting, setIsQuoting] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [message, setMessage] = useState("");

  const contractInfo = useMemo(() => {
    if (!chainId) return { abi: PrivateSwapABI.abi };
    const entry = PrivateSwapAddresses[chainId.toString() as keyof typeof PrivateSwapAddresses];
    if (!entry || entry.address === ethers.ZeroAddress) return { abi: PrivateSwapABI.abi, chainId };
    return { abi: PrivateSwapABI.abi, address: entry.address as `0x${string}`, chainId: entry.chainId, chainName: entry.chainName };
  }, [chainId]);

  const canQuote = useMemo(() => {
    return Boolean(contractInfo.address && instance && ethersSigner && !isQuoting);
  }, [contractInfo.address, instance, ethersSigner, isQuoting]);

  const canDecrypt = useMemo(() => {
    return Boolean(contractInfo.address && instance && ethersSigner && lastQuoteHandle && !isDecrypting);
  }, [contractInfo.address, instance, ethersSigner, lastQuoteHandle, isDecrypting]);

  const refreshLastHandle = useCallback(() => {
    if (!contractInfo.address || !ethersReadonlyProvider) {
      setLastQuoteHandle(undefined);
      return;
    }
    const thisAddress = contractInfo.address;
    const c = new ethers.Contract(thisAddress, contractInfo.abi, ethersReadonlyProvider);
    const signerAddr = ethersSigner?.address;
    if (!signerAddr) return;
    c.getLastQuoteHandle(signerAddr).then((h: string) => setLastQuoteHandle(h)).catch(() => {});
  }, [contractInfo.address, contractInfo.abi, ethersReadonlyProvider, ethersSigner?.address]);

  const quoteAtoB = useCallback((amountIn: bigint, maxSlippagePpm: number) => {
    if (isQuoting) return;
    if (!contractInfo.address || !ethersSigner || !instance) return;

    setIsQuoting(true);
    setMessage("🔐 Encrypting your data securely...");

    const thisAddress = contractInfo.address;
    const thisChainId = chainId;
    const thisSigner = ethersSigner;

    const run = async () => {
      try {
        const input = instance.createEncryptedInput(
          thisAddress as `0x${string}`,
          thisSigner.address as `0x${string}`
        );
        input.add32(Number(amountIn));
        input.add32(maxSlippagePpm);
        await new Promise((r) => setTimeout(r, 100));
        const enc = await input.encrypt();

        const contract = new ethers.Contract(thisAddress, contractInfo.abi, thisSigner);
        setMessage("📡 Submitting your encrypted quote request...");
        const tx: ethers.TransactionResponse = await contract.quoteAtoB(enc.handles[0], enc.handles[1], enc.inputProof);
        await tx.wait();
        setMessage("✅ Quote successfully created! You can now decrypt the result.");
        refreshLastHandle();
      } catch (e) {
        setMessage("❌ Quote request failed. Please try again.");
      } finally {
        setIsQuoting(false);
      }
    };
    run();
  }, [contractInfo.address, contractInfo.abi, ethersSigner, instance, isQuoting, chainId, refreshLastHandle]);

  const decryptLastQuote = useCallback(() => {
    if (isDecrypting) return;
    if (!contractInfo.address || !instance || !ethersSigner) return;
    if (!lastQuoteHandle || lastQuoteHandle === ethers.ZeroHash) return;

    setIsDecrypting(true);
    setMessage("🔓 Decrypting your private quote...");

    const thisAddress = contractInfo.address;
    const thisHandle = lastQuoteHandle;
    const thisSigner = ethersSigner;

    const run = async () => {
      try {
        const sig = await FhevmDecryptionSignature.loadOrSign(
          instance,
          [thisAddress],
          thisSigner,
          storage
        );
        if (!sig) {
          setMessage("❌ Unable to generate decryption signature. Please try again.");
          return;
        }
        const res = await instance.userDecrypt(
          [{ handle: thisHandle, contractAddress: thisAddress }],
          sig.privateKey,
          sig.publicKey,
          sig.signature,
          sig.contractAddresses,
          sig.userAddress,
          sig.startTimestamp,
          sig.durationDays
        );
        const SCALE_1E8 = 100_000_000n;
        const decryptedNumerator = res[thisHandle];
        const scaled = decryptedNumerator / SCALE_1E8;
        setClearQuote(scaled);
        setMessage("✨ Decryption complete! Your result is ready.");
      } catch (e) {
        setMessage("❌ Decryption failed. Please check your connection and try again.");
      } finally {
        setIsDecrypting(false);
      }
    };
    run();
  }, [contractInfo.address, instance, ethersSigner, lastQuoteHandle, storage, isDecrypting]);

  return {
    contractAddress: contractInfo.address,
    lastQuoteHandle,
    clearQuote,
    canQuote,
    canDecrypt,
    quoteAtoB,
    decryptLastQuote,
    message,
  } as const;
}


