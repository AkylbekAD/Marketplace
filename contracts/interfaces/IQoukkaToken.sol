// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface IQoukkaToken {
  function transfer(address to, uint tokens) external returns(bool);

  function balanceOf(address tokenOwner) external view returns(uint balance);

  function approve(address spender, uint tokens) external returns(bool);

  function transferFrom(address from, address to, uint tokens) external returns(bool);
}