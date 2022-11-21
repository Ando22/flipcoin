const config = {
  31337: {
    name: "hardhat",
    vrfCoordinatorV2: "0x2ca8e0c643bde4c2e08ab1fa0da3401adad7734d",
    linkToken: "0x326C977E6efc84E512bB9C30f76E30c160eD06FB",
    //declaring 50% chance, (0.5*(uint256+1))
    chance:
      "57896044618658097711785492504343953926634992332820282019728792003956564819968",
    // https://docs.chain.link/docs/vrf/v2/subscription/supported-networks/#configurations
    keyHash:
      "0x2ed0feb3e7fd2022120aa84fab1945545a9f2ffc9076fd6156fa96eaff4c1311",
    tokenAddress: "0xeD24FC36d5Ee211Ea25A80239Fb8C4Cfd80f12Ee",
  },
  5: {
    name: "goerli",
    vrfCoordinatorV2: "0x2ca8e0c643bde4c2e08ab1fa0da3401adad7734d",
    linkToken: "0x326C977E6efc84E512bB9C30f76E30c160eD06FB",
    //declaring 50% chance, (0.5*(uint256+1))
    chance:
      "57896044618658097711785492504343953926634992332820282019728792003956564819968",
    // https://docs.chain.link/docs/vrf/v2/subscription/supported-networks/#configurations
    keyHash:
      "0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15",
    tokenAddress: "0xeD24FC36d5Ee211Ea25A80239Fb8C4Cfd80f12Ee",
  },
};

const developmentChains = ["hardhat", "localhost"]
const VERIFICATION_BLOCK_CONFIRMATIONS = 6

module.exports = {
  config,
  developmentChains,
  VERIFICATION_BLOCK_CONFIRMATIONS
}
