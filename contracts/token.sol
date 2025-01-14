// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

contract CustomToken is ERC20, ERC20Burnable, AccessControl, ERC20Permit {
    uint256 private immutable _cap;
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    constructor(
        string memory name,
        string memory symbol,
        uint256 cap_,
        address defaultAdmin,
        address[] memory minters
    ) ERC20(name, symbol) ERC20Permit(name) {
        require(cap_ > 0, "Cap must be greater than 0");
        _cap = cap_;
        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
        for(uint i = 0; i < minters.length; i++) {
            _grantRole(MINTER_ROLE, minters[i]);
        }
    }

    function supplyCap() public view returns (uint256) {
        return _cap;
    }

    function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
        require(totalSupply() + amount <= supplyCap(), "ERC20: cap exceeded");
        _mint(to, amount);
    }
}
