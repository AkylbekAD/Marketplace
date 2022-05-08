import chai from "chai"
import { expect } from "chai";
import { ethers, network } from "hardhat";
import { Contract } from "ethers"
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { solidity } from "ethereum-waffle"
import { IGunGirls721, IGunGirls1155, IQoukkaToken } from "../typechain-types/contracts/interfaces"
import { JsonRpcSigner } from "@ethersproject/providers/lib/json-rpc-provider";

chai.use(solidity);

describe("Marketplace contract", function() {
  let Marketplace;
  let MarketplaceInterface: Contract;
  let GunGirls721: Contract;
  let GunGirls1155: Contract;
  let QoukkaToken: Contract;
  let NFTadmin: JsonRpcSigner;
  let marketOwner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let ERC721address: string = "0xfB90d78f44f39aeB1ddeC89fAfc29bFd8B533623";
  let ERC1155address: string = "0x3bE826d07A4440F2E5EA9f85CbFEF6D9c2316663";
  let ERC20address: string = "0x04d9dfeA1b3815B62B7E105AF570A742a2Ba6334";
  const bytes32 = "0x736f6d65646174610000000000000000000000000000000000000000000000"

  beforeEach(async function() {
    await network.provider.request({
      method: "hardhat_reset",
      params: [
        {
          forking: {
            jsonRpcUrl: `https://eth-rinkeby.alchemyapi.io/v2/${process.env.ALCHEMY_KEY}`,
            blockNumber: 10630272
          },
        },
      ],
    });

    await ethers.provider.send("hardhat_impersonateAccount", ["0xa162b39f86a7341948a2e0a8dac3f0dff071d509"]);
    NFTadmin = ethers.provider.getSigner("0xa162b39f86a7341948a2e0a8dac3f0dff071d509")

    GunGirls721 = <IGunGirls721>(await ethers.getContractAt("IGunGirls721", ERC721address));
    GunGirls1155 = <IGunGirls1155>(await ethers.getContractAt("IGunGirls1155", ERC1155address));
    QoukkaToken = <IQoukkaToken>(await ethers.getContractAt("IQoukkaToken", ERC20address))

    Marketplace = await ethers.getContractFactory("Marketplace");
    [marketOwner, user1, user2] = await ethers.getSigners()   ;
    MarketplaceInterface = await Marketplace.deploy(ERC721address, ERC1155address, ERC20address);
    await MarketplaceInterface.deployed(); 

    await GunGirls721.connect(NFTadmin).giveAdminRights(MarketplaceInterface.address);
    await GunGirls1155.connect(NFTadmin).giveAdminRights(MarketplaceInterface.address);
  });

  describe("Deployment", function() {
    it("Minting NFT721 to user1", async function() {
      await GunGirls721.connect(NFTadmin).mintTo(user1.address)
      expect(await GunGirls721.balanceOf(user1.address)).to.equal("1")
    })

    it("Minting NFT1155 to user1", async function() {
      await GunGirls1155.connect(NFTadmin).mint(user1.address, 1, 10, bytes32)
      expect(await GunGirls1155.balanceOf(user1.address, 1)).to.equal("10")
    })
  })

  describe("createItem721 function", function() {
    it("Only account with ADMIN_ROLE can create new nft", async function() {
      expect(MarketplaceInterface.connect(user1).createItem721(user1.address)).to.be.reverted
    })

    it("Account with ADMIN_ROLE can create new nft", async function() {
      await MarketplaceInterface.connect(marketOwner).createItem721(marketOwner.address)
      expect(await GunGirls721.balanceOf(marketOwner.address)).to.be.equal("1")
    })
  })

  describe("createItem1155 function", function() {
    it("Only account with ADMIN_ROLE can create new nft", async function() {
      expect(MarketplaceInterface.connect(user1).createItem1155(user1.address, 1, 10)).to.be.reverted
    })

    it("Account with ADMIN_ROLE can create new nft", async function() {
      await MarketplaceInterface.connect(marketOwner).createItem1155(marketOwner.address, 1, 10)
      expect(await GunGirls1155.balanceOf(marketOwner.address, 1)).to.be.equal("10")
    })
  }) 

  describe("listItem721 function", function() {
    it("NFT item tokenStatus index have to be equal '0' or 'Owned'", async function() {
      await MarketplaceInterface.connect(marketOwner).createItem721(user1.address)
      await QoukkaToken.connect(NFTadmin).transfer(user2.address, 1000000000000000)
      await GunGirls721.connect(user1).approve(MarketplaceInterface.address, 9)
      await MarketplaceInterface.connect(user1).listItem721(9, 1000000000)

      expect(MarketplaceInterface.connect(user1).listItem721(9, 1000000000)).to.be.revertedWith("Status not Owned")
    })

    it("User with NFT can list it on sale for QTN tokens", async function() {
      await MarketplaceInterface.connect(marketOwner).createItem721(user1.address)
      await QoukkaToken.connect(NFTadmin).transfer(user2.address, 1000000000000000)
      await GunGirls721.connect(user1).approve(MarketplaceInterface.address, 9)
      await MarketplaceInterface.connect(user1).listItem721(9, 1000000000)
      const result = await MarketplaceInterface.order721(9)

      expect(result[1]).to.be.equal(user1.address)
      expect(result[5]).to.be.equal(1)
      expect(ethers.utils.formatUnits(result[3], 0)).to.be.equal("1000000000")
    })
  })

  describe("buyItem721 function", function() {
    it("NFT has to be 'OnSale' to be bought", async function() {
      await MarketplaceInterface.connect(marketOwner).createItem721(user1.address)
      await QoukkaToken.connect(NFTadmin).transfer(user2.address, 1000000000000000)

      expect(MarketplaceInterface.connect(user2).buyItem721(9)).to.be.revertedWith("Not on sale")
    })

    it("User can buy NFT on sale for QTN", async function() {
      await MarketplaceInterface.connect(marketOwner).createItem721(user1.address)
      await QoukkaToken.connect(NFTadmin).transfer(user2.address, 1000000000000000)
      await GunGirls721.connect(user1).approve(MarketplaceInterface.address, 9)
      await MarketplaceInterface.connect(user1).listItem721(9, 1000000000)
      await QoukkaToken.connect(user2).approve(user1.address, 1000000000)
      await MarketplaceInterface.connect(user2).buyItem721(9)
      const result = await MarketplaceInterface.order721(9)

      expect(result[1]).to.be.equal(user2.address)
      expect(result[5]).to.be.equal(0)
      expect(ethers.utils.formatUnits(result[3], 0)).to.be.equal("0")
    })
  })



})
