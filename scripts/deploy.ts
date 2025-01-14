import { ethers } from "hardhat";

async function main() {
  try {
    const [deployer] = await ethers.getSigners();
    // Token Parameters
    const name = "Custom Token";
    const symbol = "CTK";
    const cap = ethers.parseEther("1000");

    console.log("Deploying Custom Token contract...");
    console.log(`Name: ${name}`);
    console.log(`Symbol: ${symbol}`);
    console.log(`Cap: ${cap}`);

    // Get the contract factory
    const CustomToken = await ethers.getContractFactory("CustomToken");
    const default_admin = deployer.address;
    const minter = "0xa184e1da445832d14CC2Ec5a08b0688673E7F787";
    const pauser = "0xd7a146B2C7111F6dD1bED322b47865851c096a59";
    console.log(`Minter: ${minter}`);
    console.log(`Pauser: ${pauser}`);

    // Deploy the contract
    const customToken = await CustomToken.deploy(name, symbol, cap, default_admin, minter, pauser);
    await customToken.waitForDeployment();

    const address = await customToken.getAddress();
    console.log(`Token deployed to: ${address}`);

    // Verify contract on Etherscan (if not on a local network)
    if (network.name !== "hardhat" && network.name !== "localhost") {
      console.log("Waiting for block confirmations...");
      await customToken.deploymentTransaction()?.wait(6);

      console.log("Verifying contract on Etherscan...");
      await verify(address, [name, symbol, cap, default_admin, minter, pauser]);
    }

  } catch (error) {
    console.error("Error during deployment:", error);
    process.exit(1);
  }
}

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

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
