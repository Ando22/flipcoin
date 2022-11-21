const { assert, expect } = require("chai");
const { parseUnits } = require("ethers/lib/utils");
const { network, deployments, ethers } = require("hardhat");
const { developmentChains, config } = require("../config");
const { BigNumber } = require("ethers");

const MaxUint256 = BigNumber.from(
  "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
);

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("FlipCoin Unit Test", async function () {
      const ONE_MILLION = "1000000";
      const BASE_BALANCE = "10";
      const BASE_FEE_BALNCE = "10";
      // Math.floor(Math.random() * Math.floor(1e9))
      const SEED = 230746577;

      const chainId = network.config.chainId;

      let admin,
        player,
        flipCoinContract,
        vrfCoordinatorMockContract,
        BUSDContract;

      before(async function () {
        const [_admin, _player] = await ethers.getSigners(); // could also do with getNamedAccounts
        admin = _admin;
        player = _player;

        const GOD = await ethers.getContractFactory("GodModeERC20");
        BUSDContract = await GOD.deploy("BUSD", "BUSD", 18);

        const MockLink = await ethers.getContractFactory("MockLink");
        const link = await MockLink.deploy();

        console.log("LinkToken address", link.address);

        // deploy vrf mocks
        const VRFCoordinatorMock = await ethers.getContractFactory(
          "VRFCoordinatorMock"
        );
        vrfCoordinatorMockContract = await VRFCoordinatorMock.deploy(
          link.address
        );

        console.log(
          "vrfCoordinatork address",
          vrfCoordinatorMockContract.address
        );
        // deploy flip coin game
        const FlipCoinContract = await ethers.getContractFactory("FlipCoin");
        flipCoinContract = await FlipCoinContract.deploy(
          vrfCoordinatorMockContract.address,
          link.address,
          config[chainId]["keyHash"],
          config[chainId]["chance"],
          config[chainId]["tokenAddress"]
        );

        console.log("flip contract address", flipCoinContract.address);

        await flipCoinContract.deployed();

        await link.transfer(flipCoinContract.address, "2000000000000000000");

        await BUSDContract.mintToken(
          admin.address,
          parseUnits(ONE_MILLION, 18)
        ).then(() => {
          console.log("Minted BUSD to admin address");
        });

        await BUSDContract.mintToken(
          player.address,
          parseUnits(ONE_MILLION, 18)
        ).then(() => {
          console.log("Minted BUSD to player address");
        });

        await BUSDContract.connect(admin).approve(
          flipCoinContract.address,
          MaxUint256
        );

        await admin.sendTransaction({
          to: flipCoinContract.address,
          value: ethers.utils.parseEther(BASE_BALANCE),
        });
      });

      describe("constructor", function () {
        it("Game state should be open", async () => {
          const flipCoinState = await flipCoinContract.getFlipCoinState();
          assert.equal(flipCoinState, 0);
        });

        it("Game round should be zero", async () => {
          const flipCoinRound = (await flipCoinContract.rounds()).toString();
          assert.equal(flipCoinRound, 0);
        });

        it("Should have the deployed as admin", async () => {
          const _admin = await flipCoinContract.getAdmin();
          expect(_admin).to.equal(admin.address);
        });

        it("Amount balance should be 10", async () => {
          const balanceAmount = await flipCoinContract
            .connect(admin)
            .balanceAmount();
          assert.equal(
            balanceAmount,
            ethers.utils.parseEther(BASE_BALANCE).toString()
          );
        });
      });

      describe("mutable", function () {
        it("Game state should be changeable", async () => {
          await flipCoinContract.connect(admin).setFlipCoinState(1);
          assert.equal(await flipCoinContract.getFlipCoinState(), 1);

          await flipCoinContract.connect(admin).setFlipCoinState(0);
          assert.equal(await flipCoinContract.getFlipCoinState(), 0);
        });

        it("Game state should not be change over the state", async () => {
          await expect(flipCoinContract.connect(admin).setFlipCoinState(3)).to
            .be.reverted;
        });

        it("Game state should be changed by admin", async () => {
          await expect(
            flipCoinContract.connect(player).setFlipCoinState(0)
          ).to.be.revertedWith("caller is not the admin");
        });
      });

      describe("Play game, send money to winner", function () {
        it("Game can only be played when the state is open", async () => {
          await flipCoinContract.connect(admin).setFlipCoinState(1);

          assert.equal(await flipCoinContract.getFlipCoinState(), 1);

          await expect(
            flipCoinContract
              .connect(player)
              .game(1, ethers.utils.parseEther("0.1"))
          ).to.be.reverted;
        });

        it("Game is accesable", async () => {
          await flipCoinContract.connect(admin).setFlipCoinState(0);
          assert.equal(await flipCoinContract.getFlipCoinState(), 0);
          const tx = await flipCoinContract
            .connect(player)
            .game(1, ethers.utils.parseEther("0.1"));
          await tx.wait(1);

          const flipCoinRound = (await flipCoinContract.rounds()).toString();
          assert.equal(flipCoinRound, 1);
        });

        it("Game able to send money to winner", async () => {
          flipCoinContract.once("Result", async () => {
            console.log("Result event fired!");

            try {
              const rounds = await flipCoinContract.rounds();
              const totalWinner = await flipCoinContract.totalWinner();
              const winnerBalance = await player.getBalance();
              await expect(flipCoinContract.getFlipCoinState(0)).to.be.reverted;

              assert.equal(totalWinner.toString(), 1);
              assert.equal(rounds, 1);

              assert.equal(
                winnerBalance.toString(),
                startingBalance
                  .add(ethers.utils.parseEther("0.1").mul(2))
                  .toString()
              );

              resolve();
            } catch (e) {
              reject(e);
            }
          });
          const tx = await flipCoinContract
            .connect(player)
            .game(1, ethers.utils.parseEther("0.1"));
          const txReceipt = await tx.wait(1);
          const requestId = txReceipt.events[2].topics[0]
          const startingBalance = await player.getBalance();

          await vrfCoordinatorMockContract.callBackWithRandomness(
            requestId,
            "777",
            flipCoinContract.address
          );
        });
      });
    });
