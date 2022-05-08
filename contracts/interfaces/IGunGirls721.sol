// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

interface IGunGirls721 is IERC721 {
  function mintTo(address recepient) external returns (uint256);

  function burn(uint256 tokenId) external;

  function giveAdminRights (address newChanger) external;

  function revokeAdminRights (address newChanger) external;
}