require("@nomicfoundation/hardhat-toolbox");
require("@typechain/hardhat");
require("@nomiclabs/hardhat-etherscan");
require("hardhat-tracer");
require("hardhat-gas-reporter");
require("solidity-coverage");
require("@openzeppelin/hardhat-upgrades");

require("dotenv").config();

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

module.exports = {
  // solidity: "0.8.9",
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      gas: 2100000,
      gasPrice: 8000000000,
      blockGasLimit: 0x1fffffffffffff,
      chainId: 31337,
      blockConfirmations: 1,
      allowUnlimitedContractSize: true,
    },
    goerli: {
      url: process.env.GOERLI_URL,
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
      //   accounts: {
      //     mnemonic: MNEMONIC,
      //   },
      saveDeployments: true,
      chainId: 5,
      allowUnlimitedContractSize: true,
    },
    // gasReporter: {
    //   enabled: process.env.REPORT_GAS !== undefined,
    //   currency: "USD",
    // },
    // etherscan: {
    //   apiKey: process.env.ETHERSCAN_API_KEY,
    // },
  },

  solidity: {
    compilers: [
      {
        version: "0.6.6",
      },
      {
        version: "0.8.9",
      },
    ],
  },
};
