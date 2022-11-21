const { network, verify } = require("hardhat");
const { config, developmentChains } = require("../config");

async function main() {
  console.log("start to deploy");

  const chainId = network.config.chainId;
  console.log(network.name, chainId)

  let vrfCoordinatorAddress;

  if (developmentChains.includes(network.name)) {

    const VRFCoordinator = await ethers.getContractFactory(
      "VRFCoordinatorMock"
    );
    const VRFCoordinatorContract = await VRFCoordinator.deploy(config[chainId]["linkToken"]);
    vrfCoordinatorAddress = VRFCoordinatorContract.address
  } else {
    vrfCoordinatorAddress = config[chainId]["vrfCoordinator"];
  }

  const linkToken = config[chainId]["linkToken"];
  const keyHash = config[chainId]["keyHash"];
  const chance = config[chainId]["chance"];
  const tokenAddress = config[chainId]["tokenAddress"];

  const args = [
    vrfCoordinatorAddress,
    linkToken,
    keyHash,
    chance,
    tokenAddress,
  ];
  console.log("deploying FlipCoin contract!!");
  const FlipCoinContract = await ethers.getContractFactory(
    "FlipCoin"
  );
  const flipCoin = await FlipCoinContract.deploy(...args);
  if (
    !developmentChains.includes(network.name) &&
    process.env.ETHERSCAN_API_KEY
  ) {
    console.log("Contract verifying....");
    await verify(flipCoin.address, args);
  }

  console.log("FlipCoin contract deployed!!");
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
