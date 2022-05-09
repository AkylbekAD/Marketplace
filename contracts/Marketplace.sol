//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./interfaces/IGunGirls1155.sol";
import "./interfaces/IGunGirls721.sol";
import "./interfaces/IQoukkaToken.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract Data {
    address internal ERC721address;
    address internal ERC1155address;
    address internal ERC20address;
    address internal creator;
    bytes32 internal constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    enum Status{Owned, OnSale, OnAuction}

    mapping (uint => Info721) public tokenId721;
    mapping (uint => uint) internal numberOfBids721;

    struct Info721 {
        address owner;
        address bestBider;
        uint bestOffer;
        uint auctionDeadline;
        Status tokenStatus;
    }

    mapping (uint => mapping (address => Info1155)) public tokenId1155;

    struct Info1155 {
        uint amount;
        address owner;
        address bestBider;
        uint bestOffer;
        uint auctionDeadline;
        uint numberOfBids1155;
        Status tokenStatus;
    }
}

contract Marketplace is Data, AccessControl {
    constructor(address erc721, address erc1155, address erc20) {
        creator = msg.sender;
        ERC721address = erc721;
        ERC1155address = erc1155;
        ERC20address = erc20;
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(ADMIN_ROLE, msg.sender);
    }

    function _onlyCreator() private view {
        require(msg.sender == creator, "Not Creator");
    }

    function _isAdmin() private view {
        require(hasRole(ADMIN_ROLE, msg.sender), "Not Admin");
    }

    function giveAdminRights (address account) external {
        _onlyCreator();
        _grantRole(ADMIN_ROLE, account);
    }

    function revokeAdminRights (address account) external {
        _onlyCreator();
        _revokeRole(ADMIN_ROLE, account);
    }

    function onERC1155Received(
        address,
        address,
        uint256,
        uint256,
        bytes memory
    ) public pure returns (bytes4) {
        return this.onERC1155Received.selector;
    }

    function onERC721Received(
        address,
        address,
        uint256,
        bytes memory
    ) public pure returns (bytes4) {
        return this.onERC721Received.selector;
    }

    function listItem721(uint tokenId, uint priceQTN) external {
        require(tokenId721[tokenId].tokenStatus == Status.Owned, "Status not Owned");

        IGunGirls721(ERC721address).safeTransferFrom(msg.sender, address(this), tokenId);

        tokenId721[tokenId].owner = msg.sender;
        tokenId721[tokenId].bestOffer = priceQTN;
        tokenId721[tokenId].tokenStatus = Status.OnSale;
    }
    

    function buyItem721(uint tokenId) external {
        require(tokenId721[tokenId].tokenStatus == Status.OnSale, "Not on sale");

        IQoukkaToken(ERC20address).transferFrom(
            msg.sender,
            tokenId721[tokenId].owner,
            tokenId721[tokenId].bestOffer
            );

        IGunGirls721(ERC721address).transferFrom(address(this), msg.sender, tokenId);

        tokenId721[tokenId].owner = msg.sender;
        tokenId721[tokenId].bestOffer = 0;
        tokenId721[tokenId].tokenStatus = Status.Owned;
    }

    function cancelList721(uint tokenId) external {
        require(msg.sender == tokenId721[tokenId].owner, "Not owner");
        require(tokenId721[tokenId].tokenStatus == Status.OnSale, "Not on sale");

        IGunGirls721(ERC721address).transferFrom(address(this), tokenId721[tokenId].owner, tokenId);

        tokenId721[tokenId].owner = msg.sender;
        tokenId721[tokenId].bestOffer = 0;
        tokenId721[tokenId].tokenStatus = Status.Owned;
    }

    function createItem721(address recipient) external {
        _isAdmin();
        IGunGirls721(ERC721address).mintTo(recipient);
    }

    function createItem1155(address recipient, uint id, uint amount) external {
        _isAdmin();
        IGunGirls1155(ERC1155address).mint(recipient, id, amount, bytes("0"));
    }

    function listItem1155(uint tokenId, uint amount, uint priceQTN) external {
        require(tokenId1155[tokenId][msg.sender].tokenStatus == Status.Owned, "Status not Owned");

        IGunGirls1155(ERC1155address).safeTransferFrom(
            msg.sender, address(this),
            tokenId,
            amount,
            bytes("0")
        );

        tokenId1155[tokenId][msg.sender].owner = msg.sender;
        tokenId1155[tokenId][msg.sender].amount = amount;
        tokenId1155[tokenId][msg.sender].bestOffer = priceQTN;
        tokenId1155[tokenId][msg.sender].tokenStatus = Status.OnSale;
    }

    function buyItem1155(uint tokenId, address seller) external {
        require(tokenId1155[tokenId][seller].tokenStatus == Status.OnSale, "Not on sale");

        IQoukkaToken(ERC20address).transferFrom(
            msg.sender,
            tokenId1155[tokenId][seller].owner,
            tokenId1155[tokenId][seller].bestOffer
            );

        IGunGirls1155(ERC1155address).safeTransferFrom(
            address(this),
            msg.sender,
            tokenId,
            tokenId1155[tokenId][seller].amount,
            bytes("0")
            ); 

        tokenId1155[tokenId][msg.sender].owner = msg.sender;
        tokenId1155[tokenId][msg.sender].amount += tokenId1155[tokenId][seller].amount;

        tokenId1155[tokenId][seller].amount = 0;   
    }

    function cancelList1155(uint tokenId) external {
        require(msg.sender == tokenId1155[tokenId][msg.sender].owner, "Not owner");
        require(tokenId1155[tokenId][msg.sender].tokenStatus == Status.OnSale, "Not on sale");

        IGunGirls1155(ERC1155address).safeTransferFrom(
            address(this),
            msg.sender,
            tokenId,
            tokenId1155[tokenId][msg.sender].amount,
            bytes("0")
            );

        tokenId1155[tokenId][msg.sender].owner = msg.sender;
        tokenId1155[tokenId][msg.sender].bestOffer = 0;
        tokenId1155[tokenId][msg.sender].tokenStatus = Status.Owned;
    }

    function listOnAuction721(uint tokenId, uint startPriceQTN) external {
        require(tokenId721[tokenId].tokenStatus == Status.Owned, "Status not Owned");

        IGunGirls721(ERC721address).safeTransferFrom(msg.sender, address(this), tokenId);

        tokenId721[tokenId].owner = msg.sender;
        tokenId721[tokenId].bestOffer = startPriceQTN;
        tokenId721[tokenId].tokenStatus = Status.OnAuction;
        tokenId721[tokenId].auctionDeadline = block.timestamp + 3 days;
    }

    function makeBid721(uint tokenId, uint amountQTN) external {
        require(tokenId721[tokenId].tokenStatus == Status.OnAuction, "Not on auction");
        require(amountQTN > tokenId721[tokenId].bestOffer, "Best offer is higher");
        require(block.timestamp < tokenId721[tokenId].auctionDeadline, "Auction ended");

        IQoukkaToken(ERC20address).transferFrom(
            msg.sender,
            address(this),
            amountQTN
        );

        if (numberOfBids721[tokenId] == 0) {
            tokenId721[tokenId].bestOffer = amountQTN;
            tokenId721[tokenId].bestBider = msg.sender;
        } else {
            IQoukkaToken(ERC20address).transfer(
                tokenId721[tokenId].bestBider,
                tokenId721[tokenId].bestOffer
            );
            tokenId721[tokenId].bestOffer = amountQTN;
            tokenId721[tokenId].bestBider = msg.sender;
        }

        numberOfBids721[tokenId] += 1;
    }

    function finishAuction721(uint tokenId) external {
        require(tokenId721[tokenId].tokenStatus == Status.OnAuction, "Not on auction");  
        require(block.timestamp > tokenId721[tokenId].auctionDeadline, "Auction is not ended");

        if (numberOfBids721[tokenId] > 2) {
            IQoukkaToken(ERC20address).transfer(
                tokenId721[tokenId].owner,
                tokenId721[tokenId].bestOffer
            );

            IGunGirls721(ERC721address).transferFrom(
                address(this),
                tokenId721[tokenId].bestBider,
                tokenId
            );

            tokenId721[tokenId].owner = tokenId721[tokenId].bestBider;
        } else {
            IQoukkaToken(ERC20address).transfer(
                tokenId721[tokenId].bestBider,
                tokenId721[tokenId].bestOffer
            );

            IGunGirls721(ERC721address).transferFrom(
                address(this),
                tokenId721[tokenId].owner,
                tokenId
            );
        }
        tokenId721[tokenId].bestBider = address(0);
        tokenId721[tokenId].tokenStatus = Status.Owned;
        tokenId721[tokenId].auctionDeadline = 0;

        numberOfBids721[tokenId] = 0;
    }

    function listOnAuction1155 (uint tokenId, uint amount, uint startPriceQTN) external {
        require(tokenId1155[tokenId][msg.sender].tokenStatus == Status.Owned, "Status not Owned");

        IGunGirls1155(ERC1155address).safeTransferFrom(
            msg.sender,
            address(this),
            tokenId,
            amount,
            bytes("0")
        );

        tokenId1155[tokenId][msg.sender].amount = amount;
        tokenId1155[tokenId][msg.sender].owner = msg.sender;
        tokenId1155[tokenId][msg.sender].bestOffer = startPriceQTN;
        tokenId1155[tokenId][msg.sender].tokenStatus = Status.OnAuction;
        tokenId1155[tokenId][msg.sender].auctionDeadline = block.timestamp + 3 days;
    }

    function makeBid1155 (uint tokenId, address seller,uint amountQTN) external {
        require(tokenId1155[tokenId][seller].tokenStatus == Status.OnAuction, "Not on auction");
        require(amountQTN > tokenId1155[tokenId][seller].bestOffer, "Best offer is higher");
        require(block.timestamp < tokenId1155[tokenId][seller].auctionDeadline, "Auction ended");

        IQoukkaToken(ERC20address).transferFrom(
            msg.sender,
            address(this),
            amountQTN
        );

        if (tokenId1155[tokenId][seller].numberOfBids1155 == 0) {
            tokenId1155[tokenId][seller].bestOffer = amountQTN;
            tokenId1155[tokenId][seller].bestBider = msg.sender;
        } else {
            IQoukkaToken(ERC20address).transfer(
                tokenId1155[tokenId][seller].bestBider,
                tokenId1155[tokenId][seller].bestOffer
            );
            tokenId1155[tokenId][seller].bestOffer = amountQTN;
            tokenId1155[tokenId][seller].bestBider = msg.sender;
        }

        tokenId1155[tokenId][seller].numberOfBids1155 += 1;
    }

    function finishAuction1155(uint tokenId, address seller) external {
        require(tokenId1155[tokenId][seller].tokenStatus == Status.OnAuction, "Not on auction");  
        require(block.timestamp > tokenId1155[tokenId][seller].auctionDeadline, "Auction is not ended");

        if (tokenId1155[tokenId][seller].numberOfBids1155 > 2) {
            IQoukkaToken(ERC20address).transfer(
                tokenId1155[tokenId][seller].owner,
                tokenId1155[tokenId][seller].bestOffer
            );

            IGunGirls1155(ERC1155address).safeTransferFrom(
                address(this),
                tokenId1155[tokenId][seller].bestBider,
                tokenId,
                tokenId1155[tokenId][seller].amount,
                bytes("0")
            );

            tokenId1155[tokenId][msg.sender].owner = msg.sender;
            tokenId1155[tokenId][msg.sender].amount += tokenId1155[tokenId][seller].amount;
            tokenId1155[tokenId][msg.sender].bestOffer += tokenId1155[tokenId][seller].bestOffer;
        } else {
            IQoukkaToken(ERC20address).transfer(
                tokenId1155[tokenId][seller].bestBider,
                tokenId1155[tokenId][seller].bestOffer
            );

            IGunGirls1155(ERC1155address).safeTransferFrom(
                address(this),
                tokenId1155[tokenId][seller].owner,
                tokenId,
                tokenId1155[tokenId][seller].amount,
                bytes("0")
            );
        }
        tokenId1155[tokenId][seller].amount = 0;   
        tokenId1155[tokenId][seller].bestBider = address(0);
        tokenId1155[tokenId][seller].tokenStatus = Status.Owned;
        tokenId1155[tokenId][seller].auctionDeadline = 0;
        tokenId1155[tokenId][seller].numberOfBids1155 = 0;
    }
}

