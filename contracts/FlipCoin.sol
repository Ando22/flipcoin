// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

// import "hardhat/console.sol";
import "hardhat/console.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBase.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";

error FlipCoin__NotEnoughBalance();
error FlipCoin__TokenIsNotContract();
error FlipCoin__GameNotOpen();
error FlipCoin__BetNotAcceptable();
error FlipCoin__NotFlipCoinState();

contract FlipCoin is VRFConsumerBase {
    using SafeERC20 for ERC20;

    enum GameState {
        OPEN,
        CLOSE
    }

    address internal VFRC_address;

    uint256 internal fee;
    uint256 private randomResult;
    uint256 public balanceAmount;
    GameState private gameState;

    // define contract token and admin
    address private admin;
    address private linkAddress;
    address private tokenAddress;

    uint256 internal chance;
    //keyHash - one of the component from which will be generated final random value by Chainlink VFRC.
    bytes32 internal keyHash;

    uint256 public rounds;
    uint256 public totalWinner;

    uint256 public gameId;
    uint256 public lastGameId;
    mapping(uint256 => Game) public games;

    struct Game {
        uint256 id;
        uint256 bet;
        uint256 amount;
        address payable player;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "caller is not the admin");
        _;
    }

    modifier onlyVFRC() {
        require(msg.sender == VFRC_address, "only VFRC can call this function");
        _;
    }

    event InjectBalance(address admin, uint256 amount);
    event Withdraw(address admin, uint256 amount);
    event FlipCoinState(GameState state);

    event Result(
        uint256 indexed id,
        uint256 bet,
        uint256 amount,
        address player,
        uint256 winAmount,
        string message,
        uint256 time
    );

    constructor(
        address _vfrcAddress, // contract address
        address _linkToken, // contract address
        bytes32 _keyHash,
        uint256 _chance,
        address _tokenAddress // contract address
    ) VRFConsumerBase(_vfrcAddress, _linkToken) {
        if (!!Address.isContract(_tokenAddress)) {
            revert FlipCoin__TokenIsNotContract();
        }
        VFRC_address = _vfrcAddress;
        fee = 0.1 * 10**18; // 0.1 LINK
        admin = msg.sender;
        chance = _chance;
        keyHash = _keyHash;
        gameState = GameState.OPEN;
        tokenAddress = _tokenAddress;
        linkAddress = _linkToken;
    }

    function retrieveBalance(uint256 _amount)
        internal
    {
        ERC20 token = ERC20(tokenAddress);
        token.transferFrom(
            address(msg.sender),
            address(this),
            _amount
        );
    }

    /* Allows this contract to receive payments */
    receive() external payable {
        balanceAmount += msg.value;
        emit InjectBalance(msg.sender, msg.value);
    }

    function game(uint256 bet, uint256 amount) public payable {
        if (gameState != GameState.OPEN) {
            revert FlipCoin__GameNotOpen();
        }
        if (balanceAmount < amount * 2) {
            revert FlipCoin__NotEnoughBalance();
        }
        if (bet > 1) {
            revert FlipCoin__BetNotAcceptable();
        }
        // collect user bet amount
        balanceAmount += amount;

        //each bet has unique id
        games[gameId] = Game(gameId, bet, amount, payable(msg.sender));

        //increase gameId for the next bet
        gameId = gameId + 1;

        // calculate game round
        rounds += 1;

        getRandomNumber();
    }

    /**
     * Request randomness to chainlink vrfCosumerbase
     */
    function getRandomNumber() internal returns (bytes32 requestId) {
        require(
            LINK.balanceOf(address(this)) > fee,
            "Error, not enough LINK - fill contract with LINK"
        );
        
        return requestRandomness(keyHash, fee);
    }

    /**
     * Callback function used by ChainLink's VRF Coordinator
     */
    function fulfillRandomness(
        bytes32, /* requestId */
        uint256 randomness
    ) internal override {
        randomResult = randomness;

        verdict(randomResult);
    }

    function verdict(uint256 random) public payable onlyVFRC {
        //check bets from latest betting round, one by one
        //check bets from latest betting round, one by one
        for (uint256 i = lastGameId; i < gameId; i++) {
            //reset winAmount for current user
            uint256 winAmount = 0;

            if (
                (random >= chance && games[i].bet == 1) ||
                (random < chance && games[i].bet == 0)
            ) {
                //if user wins, then receives 2x of their betting amount
                winAmount = games[i].amount * 2;

                ERC20 token = ERC20(tokenAddress);
                token.transferFrom(address(this), games[i].player, winAmount);

                balanceAmount -= winAmount;
                totalWinner += 1;

                emit Result(
                    games[i].id,
                    games[i].bet,
                    games[i].amount,
                    games[i].player,
                    winAmount,
                    "Win bet",
                    block.timestamp
                );
            } else {
                emit Result(
                    games[i].id,
                    games[i].bet,
                    games[i].amount,
                    games[i].player,
                    winAmount,
                    "Lose bet",
                    block.timestamp
                );
            }
        }

        lastGameId = gameId;
    }

    /**
     * Withdraw LINK from this contract (admin option).
     */
    function withdrawLink(uint256 amount) public onlyAdmin {
        require(LINK.transferFrom(address(this), address(msg.sender), amount), "Error, unable to transfer");
    }

    /**
     * Withdraw ERC20 TOKEN from this contract (admin option).
     */
    function withdrawToken(uint256 amount) public payable onlyAdmin {
        ERC20 token = ERC20(tokenAddress);

        uint256 _amount = token.balanceOf(address(this));
        require(_amount >= amount, "Error, contract has insufficent balance");

        token.transferFrom(address(this), address(msg.sender), amount);

        balanceAmount -= amount;
        emit Withdraw(admin, amount);
    }

    function getAdmin() public view returns (address) {
        return admin;
    }

    function getBalanceAmount() public view onlyAdmin returns (uint256) {
        return address(this).balance;
    }

    function getFlipCoinState() public view returns (GameState) {
        return gameState;
    }

    function setFlipCoinState(uint256 _state) public onlyAdmin {
        if (0 < _state && _state > 1) {
            revert FlipCoin__NotFlipCoinState();
        }
        if (_state == 1) {
            gameState = GameState.CLOSE;
        }
        if (_state == 0) {
            gameState = GameState.OPEN;
        }

        emit FlipCoinState(gameState);
    }
}
