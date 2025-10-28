import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const deployedPrivateSwap = await deploy("PrivateSwap", {
    from: deployer,
    log: true,
  });

  console.log(`PrivateSwap contract: `, deployedPrivateSwap.address);
};
export default func;
func.id = "deploy_private_swap"; // prevent reexecution
func.tags = ["PrivateSwap"];


