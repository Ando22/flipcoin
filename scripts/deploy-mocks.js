const { network } = require("hardhat")
const { config } = require("../config");

const BASE_FEE = ethers.utils.parseEther("0.25");
const GAS_PRICE_LINK = 1e9;

async function mocks() {
  const chainId = network.config.chainId
  const args = config[chainId]["linkToken"];
  
  if (chainId == 31337) {
    console.log("local network!");

    const VRFCoordinator = await ethers.getContractFactory(
      "VRFCoordinatorMock"
    );
    await VRFCoordinator.deploy(args);

    console.log("mock deployed!");
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
mocks().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
