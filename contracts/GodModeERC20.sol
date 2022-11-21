// SPDX-License-Identifier: WTFPL
pragma solidity >=0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract GodModeERC20 is ERC20, Ownable {
    event Burn(address indexed holder, uint256 burnAmount);

    event Mint(address indexed beneficiary, uint256 mintAmount);

    uint8 internal _decimals = 18;

    constructor(
        string memory name_,
        string memory symbol_,
        uint8 decimals_
    ) ERC20(name_, symbol_) {
        _decimals = decimals_;
    }

    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }

    function mintToken(address beneficiary, uint256 mintAmount)
        external
        onlyOwner
    {
        _mint(beneficiary, mintAmount);
    }
}
