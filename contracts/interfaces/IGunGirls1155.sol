// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";

interface IGunGirls1155 is IERC1155 {
    function mint(address account, uint256 id, uint256 amount, bytes calldata data) external;

    function burn(address account, uint256 id, uint256 amount) external;

    function giveAdminRights (address newChanger) external;

    function revokeAdminRights (address newChanger) external;
}