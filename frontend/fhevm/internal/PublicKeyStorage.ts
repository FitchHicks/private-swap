import { openDB, DBSchema, IDBPDatabase } from "idb";
import type { FhevmInstanceConfigPublicKey, FhevmInstanceConfigPublicParams } from "../fhevmTypes";

type FhevmStoredPublicKey = {
  publicKeyId: string;
  publicKey: Uint8Array;
};
type FhevmStoredPublicParams = {
  publicParamsId: string;
  publicParams: Uint8Array;
};

interface PublicParamsDB extends DBSchema {
  publicKeyStore: { key: string; value: { acl: `0x${string}`; value: FhevmStoredPublicKey } };
  paramsStore: { key: string; value: { acl: `0x${string}`; value: FhevmStoredPublicParams } };
}

let __dbPromise: Promise<IDBPDatabase<PublicParamsDB>> | undefined = undefined;
async function _getDB(): Promise<IDBPDatabase<PublicParamsDB> | undefined> {
  if (__dbPromise) return __dbPromise;
  if (typeof window === "undefined") return undefined;
  __dbPromise = openDB<PublicParamsDB>("fhevm", 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("paramsStore")) db.createObjectStore("paramsStore", { keyPath: "acl" });
      if (!db.objectStoreNames.contains("publicKeyStore")) db.createObjectStore("publicKeyStore", { keyPath: "acl" });
    },
  });
  return __dbPromise;
}

export async function publicKeyStorageGet(aclAddress: `0x${string}`): Promise<{ publicKey?: FhevmInstanceConfigPublicKey; publicParams: FhevmInstanceConfigPublicParams | null; }> {
  const db = await _getDB();
  if (!db) return { publicParams: null };
  const storedPublicKey = await db.get("publicKeyStore", aclAddress);
  const storedPublicParams = await db.get("paramsStore", aclAddress);
  const publicKey = storedPublicKey?.value?.publicKeyId && storedPublicKey?.value?.publicKey
    ? { id: storedPublicKey.value.publicKeyId, data: storedPublicKey.value.publicKey }
    : undefined;
  const publicParams = storedPublicParams?.value ? { "2048": storedPublicParams.value } : null;
  return { ...(publicKey && { publicKey }), publicParams };
}

export async function publicKeyStorageSet(
  aclAddress: `0x${string}`,
  publicKey: FhevmStoredPublicKey | null,
  publicParams: FhevmStoredPublicParams | null
) {
  const db = await _getDB();
  if (!db) return;
  if (publicKey) await db.put("publicKeyStore", { acl: aclAddress, value: publicKey });
  if (publicParams) await db.put("paramsStore", { acl: aclAddress, value: publicParams });
}


