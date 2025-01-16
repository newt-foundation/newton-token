import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";
import "./tasks/deploy";

require('@openzeppelin/hardhat-upgrades');
dotenv.config(); // Load environment variables from .env file

const PRIVATE_KEY = process.env.PRIVATE_KEY || ""; // Your private key
const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY || ""; // Your Alchemy API key

if (!process.env.PRIVATE_KEY) {
  throw new Error("Please set your PRIVATE_KEY and INFURA_API_KEY in a .env file");
}

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  networks: {
    sepolia: {
      url: `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};

export default config;
