"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const func = async function (hre) {
    const { deployer } = await hre.getNamedAccounts();
    const { deploy } = hre.deployments;
    const deployedPrivateSwap = await deploy("PrivateSwap", {
        from: deployer,
        log: true,
    });
    console.log(`PrivateSwap contract: `, deployedPrivateSwap.address);
};
exports.default = func;
func.id = "deploy_private_swap"; // prevent reexecution
func.tags = ["PrivateSwap"];
