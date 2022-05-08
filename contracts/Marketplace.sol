//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./interfaces/IGunGirls1155.sol";
import "./interfaces/IGunGirls721.sol";
import "./interfaces/IQoukkaToken.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract Marketplace is AccessControl {
    address public ERC721address;
    address public ERC1155address;
    address public ERC20address;
    address public creator;
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    enum Status{Owned, OnSale, OnAuction}

    mapping (uint => NFT721) public order721;
    mapping (uint => uint) internal numberOfBids721;

    struct NFT721 {
        uint id;
        address owner;
        address bestBider;
        uint bestOffer;
        uint auctionDeadline;
        Status tokenStatus;
    }

    mapping (uint => mapping (address => NFT1155)) public order1155;

    struct NFT1155 {
        uint id;
        uint amount;
        address owner;
        address bestBider;
        uint bestOffer;
        uint auctionDeadline;
        uint numberOfBids1155;
        Status tokenStatus;
    }

    constructor(address erc721, address erc1155, address erc20) {
        creator = msg.sender;
        ERC721address = erc721;
        ERC1155address = erc1155;
        ERC20address = erc20;
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(ADMIN_ROLE, msg.sender);
    }

    function giveAdminRights (address account) external {
        require(msg.sender == creator);
        _grantRole(ADMIN_ROLE, account);
    }

    function revokeAdminRights (address account) external {
        require(msg.sender == creator);
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
        require(order721[tokenId].tokenStatus == Status.Owned, "Status not Owned");

        IGunGirls721(ERC721address).safeTransferFrom(msg.sender, address(this), tokenId);

        if(order721[tokenId].id == 0) {
            order721[tokenId].id = tokenId;
            order721[tokenId].owner = msg.sender;
            order721[tokenId].bestOffer = priceQTN;
            order721[tokenId].tokenStatus = Status.OnSale;
        } else {
            order721[tokenId].owner = msg.sender;
            order721[tokenId].bestOffer = priceQTN;
            order721[tokenId].tokenStatus = Status.OnSale;
        }
    }

    function buyItem721(uint tokenId) external {
        require(order721[tokenId].tokenStatus == Status.OnSale, "Not on sale");

        IQoukkaToken(ERC20address).transferFrom(
            msg.sender,
            order721[tokenId].owner,
            order721[tokenId].bestOffer
            );

        IGunGirls721(ERC721address).transferFrom(address(this), msg.sender, order721[tokenId].id);

        order721[tokenId].owner = msg.sender;
        order721[tokenId].bestOffer = 0;
        order721[tokenId].tokenStatus = Status.Owned;
    }

    function cancelList721(uint tokenId) external {
        require(msg.sender == order721[tokenId].owner, "Not owner");
        require(order721[tokenId].tokenStatus == Status.OnSale, "Not on sale");

        IGunGirls721(ERC721address).transferFrom(address(this), order721[tokenId].owner, order721[tokenId].id);

        order721[tokenId].owner = msg.sender;
        order721[tokenId].bestOffer = 0;
        order721[tokenId].tokenStatus = Status.Owned;
    }

    function createItem721(address recipient) external {
        require(hasRole(ADMIN_ROLE, msg.sender), "Not Admin");
        IGunGirls721(ERC721address).mintTo(recipient);
    }

    function createItem1155(address recipient, uint id, uint amount) external {
        require(hasRole(ADMIN_ROLE, msg.sender), "Not Admin");
        IGunGirls1155(ERC1155address).mint(recipient, id, amount, bytes("0"));

        order1155[id][recipient].id = id;
        order1155[id][recipient].amount = amount;
        order1155[id][recipient].owner = recipient;
    }

    function listItem1155(uint tokenId, uint amount, uint priceQTN) external {
        require(order1155[tokenId][msg.sender].tokenStatus == Status.Owned, "Status not Owned");

        IGunGirls1155(ERC1155address).safeTransferFrom(
            msg.sender, address(this),
            tokenId,
            amount,
            bytes("0")
        );

        order1155[tokenId][msg.sender].id = tokenId;
        order1155[tokenId][msg.sender].owner = msg.sender;
        order1155[tokenId][msg.sender].amount = amount;
        order1155[tokenId][msg.sender].bestOffer = priceQTN;
        order1155[tokenId][msg.sender].tokenStatus = Status.OnSale;
    }

    function buyItem1155(uint tokenId, address seller) external {
        require(order1155[tokenId][seller].tokenStatus == Status.OnSale, "Not on sale");

        IQoukkaToken(ERC20address).transferFrom(
            msg.sender,
            order1155[tokenId][seller].owner,
            order1155[tokenId][seller].bestOffer
            );

        IGunGirls1155(ERC1155address).safeTransferFrom(
            address(this),
            msg.sender,
            order1155[tokenId][seller].id,
            order1155[tokenId][seller].amount,
            bytes("0")
            );

        order1155[tokenId][seller].owner = msg.sender;
        order1155[tokenId][seller].bestOffer = 0;
        order1155[tokenId][seller].tokenStatus = Status.Owned;
    }

    function cancelList1155(uint tokenId) external {
        require(msg.sender == order1155[tokenId][msg.sender].owner, "Not owner");
        require(order1155[tokenId][msg.sender].tokenStatus == Status.OnSale, "Not on sale");

        IGunGirls1155(ERC1155address).safeTransferFrom(
            address(this),
            msg.sender,
            order1155[tokenId][msg.sender].id,
            order1155[tokenId][msg.sender].amount,
            bytes("0")
            );

        order1155[tokenId][msg.sender].owner = msg.sender;
        order1155[tokenId][msg.sender].bestOffer = 0;
        order1155[tokenId][msg.sender].tokenStatus = Status.Owned;
    }

    function listItemOnAuction721(uint tokenId, uint startPriceQTN) external {
        require(order721[tokenId].tokenStatus == Status.Owned, "Status not Owned");

        IGunGirls721(ERC721address).safeTransferFrom(msg.sender, address(this), tokenId);

        order721[tokenId].id = tokenId;
        order721[tokenId].owner = msg.sender;
        order721[tokenId].bestOffer = startPriceQTN;
        order721[tokenId].tokenStatus = Status.OnAuction;
        order721[tokenId].auctionDeadline = block.timestamp + 3 days;
    }

    function makeBid(uint tokenId, uint amountQTN) external {
        require(order721[tokenId].tokenStatus == Status.OnAuction, "Not on auction");
        require(amountQTN > order721[tokenId].bestOffer, "Best offer is higher");
        require(block.timestamp < order721[tokenId].auctionDeadline, "Auction ended");

        IQoukkaToken(ERC20address).transferFrom(
            msg.sender,
            address(this),
            amountQTN
        );

        if (numberOfBids721[tokenId] == 0) {
            order721[tokenId].bestOffer = amountQTN;
            order721[tokenId].bestBider = msg.sender;
        } else {
            IQoukkaToken(ERC20address).transfer(
                order721[tokenId].bestBider,
                order721[tokenId].bestOffer
            );
            order721[tokenId].bestOffer = amountQTN;
            order721[tokenId].bestBider = msg.sender;
        }

        numberOfBids721[tokenId] += 1;
    }

    function finishAuction721(uint tokenId) external {
        require(order721[tokenId].tokenStatus == Status.OnAuction, "Not on auction");  
        require(block.timestamp > order721[tokenId].auctionDeadline, "Auction is not ended");

        if (numberOfBids721[tokenId] > 2) {
            IQoukkaToken(ERC20address).transfer(
                order721[tokenId].owner,
                order721[tokenId].bestOffer
            );

            IGunGirls721(ERC721address).transferFrom(
                address(this),
                order721[tokenId].bestBider,
                tokenId
            );

            order721[tokenId].owner = order721[tokenId].bestBider;
        } else {
            IQoukkaToken(ERC20address).transfer(
                order721[tokenId].bestBider,
                order721[tokenId].bestOffer
            );

            IGunGirls721(ERC721address).transferFrom(
                address(this),
                order721[tokenId].owner,
                tokenId
            );
        }
        order721[tokenId].bestBider = address(0);
        order721[tokenId].tokenStatus = Status.Owned;
        order721[tokenId].auctionDeadline = 0;

        numberOfBids721[tokenId] = 0;
    }

    function listItemOnAuction1155 (uint tokenId, uint amount, uint startPriceQTN) external {
        require(order1155[tokenId][msg.sender].tokenStatus == Status.Owned, "Status not Owned");

        IGunGirls1155(ERC1155address).safeTransferFrom(
            msg.sender,
            address(this),
            tokenId,
            amount,
            bytes("0")
        );

        order1155[tokenId][msg.sender].id = tokenId;
        order1155[tokenId][msg.sender].amount = amount;
        order1155[tokenId][msg.sender].owner = msg.sender;
        order1155[tokenId][msg.sender].bestOffer = startPriceQTN;
        order1155[tokenId][msg.sender].tokenStatus = Status.OnAuction;
        order1155[tokenId][msg.sender].auctionDeadline = block.timestamp + 3 days;
    }

    function makeBid1155 (uint tokenId, address seller,uint amountQTN) external {
        require(order1155[tokenId][seller].tokenStatus == Status.OnAuction, "Not on auction");
        require(amountQTN > order1155[tokenId][seller].bestOffer, "Best offer is higher");
        require(block.timestamp < order1155[tokenId][seller].auctionDeadline, "Auction ended");

        IQoukkaToken(ERC20address).transferFrom(
            msg.sender,
            address(this),
            amountQTN
        );

        if (order1155[tokenId][seller].numberOfBids1155 == 0) {
            order1155[tokenId][seller].bestOffer = amountQTN;
            order1155[tokenId][seller].bestBider = msg.sender;
        } else {
            IQoukkaToken(ERC20address).transfer(
                order1155[tokenId][seller].bestBider,
                order1155[tokenId][seller].bestOffer
            );
            order1155[tokenId][seller].bestOffer = amountQTN;
            order1155[tokenId][seller].bestBider = msg.sender;
        }

        order1155[tokenId][seller].numberOfBids1155 += 1;
    }

    function finishAuction1155(uint tokenId, address seller) external {
        require(order1155[tokenId][seller].tokenStatus == Status.OnAuction, "Not on auction");  
        require(block.timestamp > order1155[tokenId][seller].auctionDeadline, "Auction is not ended");

        if (order1155[tokenId][seller].numberOfBids1155 > 2) {
            IQoukkaToken(ERC20address).transfer(
                order1155[tokenId][seller].owner,
                order1155[tokenId][seller].bestOffer
            );

            IGunGirls721(ERC721address).transferFrom(
                address(this),
                order1155[tokenId][seller].bestBider,
                tokenId
            );

            order1155[tokenId][seller].owner = order1155[tokenId][seller].bestBider;
        } else {
            IQoukkaToken(ERC20address).transfer(
                order1155[tokenId][seller].bestBider,
                order1155[tokenId][seller].bestOffer
            );

            IGunGirls721(ERC721address).transferFrom(
                address(this),
                order1155[tokenId][seller].owner,
                tokenId
            );
        }
        order1155[tokenId][seller].bestBider = address(0);
        order1155[tokenId][seller].tokenStatus = Status.Owned;
        order1155[tokenId][seller].auctionDeadline = 0;
        order1155[tokenId][seller].numberOfBids1155 = 0;
    }
}
