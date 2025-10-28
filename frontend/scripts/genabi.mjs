import * as fs from "fs";
import * as path from "path";

const CONTRACT_NAME = "PrivateSwap";
const rel = "../backend";
const outdir = path.resolve("./abi");

if (!fs.existsSync(outdir)) { fs.mkdirSync(outdir, { recursive: true }); }

const deploymentsDir = path.join(path.resolve(rel), "deployments");
const artifactsDir = path.join(path.resolve(rel), "artifacts", "contracts");

function readDeployment(chainName, chainId, contractName, optional) {
  const chainDeploymentDir = path.join(deploymentsDir, chainName);
  if (!fs.existsSync(chainDeploymentDir)) {
    if (!optional) {
      console.error(`Missing deployments for ${chainName}. Run 'npx hardhat deploy --network ${chainName}' in backend`);
      process.exit(1);
    }
    return undefined;
  }
  const jsonString = fs.readFileSync(path.join(chainDeploymentDir, `${contractName}.json`), "utf-8");
  const obj = JSON.parse(jsonString);
  obj.chainId = chainId;
  return obj;
}

function readArtifact(contractName) {
  // backend/artifacts/contracts/PrivateSwap.sol/PrivateSwap.json
  const contractFolder = path.join(artifactsDir, `${contractName}.sol`);
  const artifactPath = path.join(contractFolder, `${contractName}.json`);
  if (!fs.existsSync(artifactPath)) {
    return undefined;
  }
  const jsonString = fs.readFileSync(artifactPath, "utf-8");
  const obj = JSON.parse(jsonString);
  return { abi: obj.abi };
}

const deployHardhat = readDeployment("hardhat", 31337, CONTRACT_NAME, true);
const deployLocalhost = readDeployment("localhost", 31337, CONTRACT_NAME, true);
const deployAnvil = readDeployment("anvil", 31337, CONTRACT_NAME, true);
const deploySepolia = readDeployment("sepolia", 11155111, CONTRACT_NAME, true);

const source = deployHardhat || deployLocalhost || deployAnvil || deploySepolia || readArtifact(CONTRACT_NAME);
if (!source) {
  console.error(`No deployments or artifacts found for ${CONTRACT_NAME}. Run 'npm run compile' in backend`);
  process.exit(1);
}

const tsCode = `
/*
  This file is auto-generated.
  Command: 'npm run genabi'
*/
export const ${CONTRACT_NAME}ABI = ${JSON.stringify({ abi: source.abi }, null, 2)} as const;
`;

const addr = {
  "11155111": { address: deploySepolia?.address ?? "0x0000000000000000000000000000000000000000", chainId: 11155111, chainName: "sepolia" },
  "31337": { address: (deployHardhat?.address ?? deployAnvil?.address ?? deployLocalhost?.address) ?? "0x0000000000000000000000000000000000000000", chainId: 31337, chainName: "hardhat" },
};

const tsAddresses = `
/*
  This file is auto-generated.
  Command: 'npm run genabi'
*/
export const ${CONTRACT_NAME}Addresses = ${JSON.stringify(addr, null, 2)} as const;
`;

fs.writeFileSync(path.join(outdir, `${CONTRACT_NAME}ABI.ts`), tsCode, "utf-8");
fs.writeFileSync(path.join(outdir, `${CONTRACT_NAME}Addresses.ts`), tsAddresses, "utf-8");
console.log(`Generated ABI and addresses for ${CONTRACT_NAME}`);


