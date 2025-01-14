import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

task("deploy-token", "Deploys a custom ERC20")
  .addParam("name", "Token name")
  .addParam("symbol", "Token symbol")
  .addParam("cap", "Maximum cap (Representation in tokens, not Wei)")
  .addParam("minters", "Comma separated list of address(s) to be granted minting permissions")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
  try {
    const [deployer] = await hre.ethers.getSigners();
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
    const CustomToken = await hre.ethers.getContractFactory("CustomToken");
    const default_admin = deployer.address;
    const minters = taskArgs.minters.split(',').map((addr: string) => addr.trim());
    minters.forEach((addr: string) => {
	if (!hre.ethers.isAddress(addr)) {
          throw new Error(`Invalid minter address: ${addr}`);
        }
    });
    console.log(`Minters: ${minters}`);

    // Deploy the contract
    const customToken = await CustomToken.deploy(name, symbol, cap, default_admin, minters);
    await customToken.waitForDeployment();

    const address = await customToken.getAddress();
    console.log(`Token deployed to: ${address}`);

    // Verify contract on Etherscan (if not on a local network)
    if (network.name !== "hardhat" && network.name !== "localhost") {
      console.log("Waiting for block confirmations...");
      await customToken.deploymentTransaction()?.wait(6);

      console.log("Verifying contract on Etherscan...");
      await verify(address, [name, symbol, cap, default_admin, minters]);
    }

  } catch (error) {
    console.error("Error during deployment:", error);
    process.exit(1);
  }
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
