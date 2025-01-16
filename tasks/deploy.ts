import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

task("deploy-proxy-token", "Deploys a custom ERC20")
  .addParam("name", "Token name")
  .addParam("symbol", "Token symbol")
  .addParam("cap", "Maximum cap (Representation in tokens, not Wei)")
  .addParam("minters", "Comma separated list of address(s) to be granted minting permissions")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
  try {
    const { ethers, upgrades } = hre;
    const [deployer] = await ethers.getSigners();
    // Token Parameters
    const name = taskArgs.name;
    const symbol = taskArgs.symbol;
    const cap = hre.ethers.parseEther(taskArgs.cap);

    console.log("Deploying Custom Token contract...");
    console.log(`Name: ${name}`);
    console.log(`Symbol: ${symbol}`);
    console.log(`Cap: ${cap}`);
    console.log(`Admin: ${deployer.address}`);

    // Get the contract factory
    const CustomToken = await ethers.getContractFactory("CustomTokenUpgradeable");
    const default_admin = deployer.address;
    const minters = taskArgs.minters.split(',').map((addr: string) => addr.trim());
    minters.forEach((addr: string) => {
    if (!ethers.isAddress(addr)) {
          throw new Error(`Invalid minter address: ${addr}`);
        }
    });
    console.log(`Minters: ${minters}`);

    // Deploy the contract
    const customToken = await upgrades.deployProxy(
        CustomToken,
        [name, symbol, cap, default_admin, minters],
        { initializer: "initialize" }
    );
    const address = await customToken.getAddress();
    console.log(`Token deployed to: ${address}`);

    const implementationAddress = await upgrades.erc1967.getImplementationAddress(
        address
    );
    console.log("Implementation Contract Address: ", implementationAddress);

    // Verify proxy contract on Etherscan (if not on a local network)
    if (network.name !== "hardhat" && network.name !== "localhost") {
      console.log("Waiting for block confirmations...");
      await customToken.deploymentTransaction()?.wait(6);

      console.log("Verifying contract on Etherscan...");
      await verify(address, []);
      await verify(implementationAddress, []);
    }

  } catch (error) {
    console.error("Error during deployment:", error);
    process.exit(1);
  }
});

task("deploy-final-upgrade", "Deploys a custom ERC20")
    .addParam("proxy", "Proxy Contract Address")
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {

    const CustomTokenFinal = await ethers.getContractFactory("CustomTokenFinal");
    const upgradedToken = await upgrades.upgradeProxy(taskArgs.proxy, CustomTokenFinal);
    if (network.name !== "hardhat" && network.name !== "localhost") {
      console.log("Waiting for block confirmations...");
      await upgradedToken.deploymentTransaction()?.wait(6);
      await verify(upgradedToken.getAddresss(), []);
    }
    console.log("Upgraded to final implementation at:", upgradedToken.getAddress());
});

async function verify(contractAddress: string, args: any[]) {
  try {
    await run("verify:verify", {
      address: contractAddress,
      constructorArguments: args,
    });
  } catch (error: any) {
    if (error.message.toLowerCase().includes("already verified")) {
      console.log("Contract is already verified!");
    } else {
      console.error("Error verifying contract:", error);
    }
  }
}

export default {};
