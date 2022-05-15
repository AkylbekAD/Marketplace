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

  async function passAuctionTime() {
    await ethers.provider.send("evm_increaseTime", [259201]) // pass auction time
    await ethers.provider.send("evm_mine", [])
  }

  describe("createItem721 function", function() {
    it("Only account with ADMIN_ROLE can create new nft", async function() {
      expect(MarketplaceInterface.connect(user1).createItem721(user1.address)).to.be.revertedWith("Not Admin")
    })

    it("Account with ADMIN_ROLE can create new nft", async function() {
      await MarketplaceInterface.connect(marketOwner).createItem721(marketOwner.address)
      expect(await GunGirls721.balanceOf(marketOwner.address)).to.be.equal("1")
    })
  })

  describe("createItem1155 function", function() {
    it("Only account with ADMIN_ROLE can create new nft", async function() {
      expect(MarketplaceInterface.connect(user1).createItem1155(user1.address, 1, 10)).to.be.revertedWith("Not Admin")
    })

    it("Account with ADMIN_ROLE can create new nft", async function() {
      await MarketplaceInterface.connect(marketOwner).createItem1155(marketOwner.address, 1, 10)
      expect(await GunGirls1155.balanceOf(marketOwner.address, 1)).to.be.equal("10")
    })
  }) 

  describe("giveAdminRights function", function() {
    it("Only creator can give ADMIN_ROLE to another", async function() {
      expect(MarketplaceInterface.connect(user1).giveAdminRights(user1.address)).to.be.revertedWith("Not Creator")
    })

    it("Creator can give ADMIN_ROLE to another", async function() {
      await MarketplaceInterface.connect(marketOwner).giveAdminRights(user1.address)

      expect(await MarketplaceInterface.hasRole("0xa49807205ce4d355092ef5a8a18f56e8913cf4a201fbe287825b095693c21775", user1.address)).to.be.equal(true)
    })
  })

  describe("revokeAdminRights function", function() {
    it("Only creator can revoke ADMIN_ROLE to another", async function() {
      expect(MarketplaceInterface.connect(user1).revokeAdminRights(user1.address)).to.be.revertedWith("Not Creator")
    })

    it("Creator can revoke ADMIN_ROLE from another", async function() {
      await MarketplaceInterface.connect(marketOwner).giveAdminRights(user1.address)
      expect(await MarketplaceInterface.hasRole("0xa49807205ce4d355092ef5a8a18f56e8913cf4a201fbe287825b095693c21775", user1.address)).to.be.equal(true)
      await MarketplaceInterface.connect(marketOwner).revokeAdminRights(user1.address)
      expect(await MarketplaceInterface.hasRole("0xa49807205ce4d355092ef5a8a18f56e8913cf4a201fbe287825b095693c21775", user1.address)).to.be.equal(false)
    })
  }) 

  describe("ERC721 market funcitons", function() {
    beforeEach(async function() {
      await MarketplaceInterface.connect(marketOwner).createItem721(user1.address)
      await QoukkaToken.connect(NFTadmin).transfer(user2.address, 1000000000000000)
    })

    describe("listItem721 function", function() {
      it("NFT item tokenStatus index have to be equal '0' or 'Owned'", async function() {
        await GunGirls721.connect(user1).approve(MarketplaceInterface.address, 9)
        await MarketplaceInterface.connect(user1).listItem721(9, 1000000000)
  
        expect(MarketplaceInterface.connect(user1).listItem721(9, 1000000000)).to.be.revertedWith("Status not Owned")
      })
  
      it("User with NFT can list it on sale for QTN tokens", async function() {
        await GunGirls721.connect(user1).approve(MarketplaceInterface.address, 9)
        await MarketplaceInterface.connect(user1).listItem721(9, 1000000000)
        const result = await MarketplaceInterface.tokenId721(9)
  
        expect(result[0]).to.be.equal(user1.address)
        expect(result[4]).to.be.equal(1)
        expect(ethers.utils.formatUnits(result[2], 0)).to.be.equal("1000000000")
      })
    })
  
    describe("buyItem721 function", function() {
      it("NFT has to be 'OnSale' to be bought", async function() {
        expect(MarketplaceInterface.connect(user2).buyItem721(9)).to.be.revertedWith("Not on sale")
      })
  
      it("User can buy NFT on sale for QTN", async function() {
        await GunGirls721.connect(user1).approve(MarketplaceInterface.address, 9)
        await MarketplaceInterface.connect(user1).listItem721(9, 1000000000)
        await QoukkaToken.connect(user2).approve(user1.address, 1000000000)
        await MarketplaceInterface.connect(user2).buyItem721(9)
        const result = await MarketplaceInterface.tokenId721(9)
  
        expect(result[0]).to.be.equal(user2.address)
        expect(result[4]).to.be.equal(0)
        expect(ethers.utils.formatUnits(result[2], 0)).to.be.equal("0")
      })
    })

    describe("cancelList721 function", function() {
      it("Only NFT owner can cancel listing", async function() {
        await GunGirls721.connect(user1).approve(MarketplaceInterface.address, 9)
        await MarketplaceInterface.connect(user1).listItem721(9, 1000000000)
      
        expect(MarketplaceInterface.connect(user2).cancelList721(9)).to.be.revertedWith("Not owner")
      })

      it("NFT has to be 'OnSale' to cancel listing", async function() {
        await GunGirls721.connect(user1).approve(MarketplaceInterface.address, 9)
        await MarketplaceInterface.connect(user1).listOnAuction721(9, 1000000000)

        expect(MarketplaceInterface.connect(user1).cancelList721(9)).to.be.revertedWith("Not on sale")
      })
  
      it("Owner of NFT can cancel listing before anyone bought NFT", async function() {
        await GunGirls721.connect(user1).approve(MarketplaceInterface.address, 9)
        await MarketplaceInterface.connect(user1).listItem721(9, 1000000000)
        await MarketplaceInterface.connect(user1).cancelList721(9)
        const result = await MarketplaceInterface.tokenId721(9)
  
        expect(result[0]).to.be.equal(user1.address)
        expect(result[4]).to.be.equal(0)
        expect(ethers.utils.formatUnits(result[2], 0)).to.be.equal("0")
      })
    })
   
    describe("listOnAuction721 function", function() {
      it("NFT can not be list on auction if its not 'Owned'", async function() {
        await GunGirls721.connect(user1).approve(MarketplaceInterface.address, 9)
        await MarketplaceInterface.connect(user1).listItem721(9, 1000000000)
      
        expect(MarketplaceInterface.connect(user1).listOnAuction721(9, 1000000000)).to.be.revertedWith("Status not Owned")
      })

      it("Only owner of NFT can list it on auction", async function() {
        await GunGirls721.connect(user1).approve(MarketplaceInterface.address, 9)
  
        expect(MarketplaceInterface.connect(user2).listOnAuction721(9, 1000000000)).to.be.revertedWith("ERC721: transfer from incorrect owner")
      })
  
      it("NFT owner can list it on auction for QTN", async function() {
        await GunGirls721.connect(user1).approve(MarketplaceInterface.address, 9)
        await MarketplaceInterface.connect(user1).listOnAuction721(9, 1000000000)
        const result = await MarketplaceInterface.tokenId721(9)
  
        expect(result[0]).to.be.equal(user1.address)
        expect(result[4]).to.be.equal(2)
        expect(ethers.utils.formatUnits(result[2], 0)).to.be.equal("1000000000")
      })
    })

    describe("", function() {
      it("NFT must be on auction to make a bid",async function() {
        expect(MarketplaceInterface.connect(user2).makeBid721(9, 1000000000)).to.be.revertedWith("Not on auction")
      })
    })

    describe("makeBid721 function", function() {
      beforeEach(async function() {
        await GunGirls721.connect(user1).approve(MarketplaceInterface.address, 9)
        await MarketplaceInterface.connect(user1).listOnAuction721(9, 100000000)
      })

      it("To make a bid amountQTN must be higher then best offer", async function() {
        expect(MarketplaceInterface.connect(user2).makeBid721(9, 100)).to.be.revertedWith("Best offer is higher")
      })
  
      it("User can not make a bid if auction time is passed", async function() {
        await passAuctionTime()

        expect(MarketplaceInterface.connect(user2).makeBid721(9, 1000000000)).to.be.revertedWith("Auction ended")
      })

      it("First bider can make a bid with QTN if amount is enough and auction not ended", async function() {
        await QoukkaToken.connect(user2).approve(MarketplaceInterface.address, 1000000000)
        await MarketplaceInterface.connect(user2).makeBid721(9, 1000000000)
        const result = await MarketplaceInterface.tokenId721(9)
  
        expect(result[0]).to.be.equal(user1.address)
        expect(result[1]).to.be.equal(user2.address)
        expect(result[4]).to.be.equal(2)
        expect(ethers.utils.formatUnits(result[2], 0)).to.be.equal("1000000000")
      })

      it("Other biders have to transfer back last biders bids to make their`s best", async function() {
        await QoukkaToken.connect(user2).approve(MarketplaceInterface.address, 200000000)
        await MarketplaceInterface.connect(user2).makeBid721(9, 200000000)
        const balanceBefore = await QoukkaToken.balanceOf(user2.address)
        expect(ethers.utils.formatUnits(balanceBefore, 0)).to.be.equal("999999800000000")

        await QoukkaToken.connect(NFTadmin).approve(MarketplaceInterface.address, 3000000000)
        await MarketplaceInterface.connect(NFTadmin).makeBid721(9, 300000000)
        const balanceAfter = await QoukkaToken.balanceOf(user2.address)
        expect(ethers.utils.formatUnits(balanceAfter, 0)).to.be.equal("1000000000000000")
      })
    })

    describe("finishAuction721 function", function() {
      it("NFT must be on auction to finish it",async function() {
        expect(MarketplaceInterface.connect(user2).finishAuction721(9)).to.be.revertedWith("Not on auction")
      })
    })

    describe("finishAuction721 function", function() {
      beforeEach(async function() {
        await GunGirls721.connect(user1).approve(MarketplaceInterface.address, 9)
        await MarketplaceInterface.connect(user1).listOnAuction721(9, 100000000)
      })
  
      it("User can not finish auction if 3 days not passed", async function() {
        expect(MarketplaceInterface.connect(user1).finishAuction721(9)).to.be.revertedWith("Auction is not ended")
      })

      it("If there were less then 3 bids, NFT transfers to owner, best bid goes back to bider", async function() {
        await QoukkaToken.connect(user2).approve(MarketplaceInterface.address, 1000000000)
        await MarketplaceInterface.connect(user2).makeBid721(9, 1000000000)

        await passAuctionTime()

        await MarketplaceInterface.connect(user2).finishAuction721(9)
        const result = await MarketplaceInterface.tokenId721(9)
  
        expect(result[0]).to.be.equal(user1.address)
        expect(result[1]).to.be.equal("0x0000000000000000000000000000000000000000")
        expect(result[4]).to.be.equal(0)
        expect(ethers.utils.formatUnits(result[2], 0)).to.be.equal("1000000000")
        expect(await GunGirls721.ownerOf(9)).to.be.equal(user1.address)

        const balanceAfter = await QoukkaToken.balanceOf(user2.address)
        expect(ethers.utils.formatUnits(balanceAfter, 0)).to.be.equal("1000000000000000")
      })

      it("If there were more then 2 bids, NFT transfers to best bider, best bid goes owner", async function() {
        await QoukkaToken.connect(user2).approve(MarketplaceInterface.address, 1000000000)
        await MarketplaceInterface.connect(user2).makeBid721(9, 1000000000)
        await QoukkaToken.connect(NFTadmin).approve(MarketplaceInterface.address, 2000000000)
        await MarketplaceInterface.connect(NFTadmin).makeBid721(9, 2000000000)
        await QoukkaToken.connect(user2).approve(MarketplaceInterface.address, 3000000000)
        await MarketplaceInterface.connect(user2).makeBid721(9, 3000000000)

        await passAuctionTime()

        await MarketplaceInterface.connect(user2).finishAuction721(9)
        const result = await MarketplaceInterface.tokenId721(9)
  
        expect(result[0]).to.be.equal(user2.address)
        expect(result[1]).to.be.equal("0x0000000000000000000000000000000000000000")
        expect(result[4]).to.be.equal(0)
        expect(ethers.utils.formatUnits(result[2], 0)).to.be.equal("3000000000")
        expect(await GunGirls721.ownerOf(9)).to.be.equal(user2.address)

        const balanceAfter = await QoukkaToken.balanceOf(user1.address)
        expect(ethers.utils.formatUnits(balanceAfter, 0)).to.be.equal("3000000000")
      })
    }) 
  })

  describe("ERC1155 market funcitons", function() {
    beforeEach(async function() {
      await MarketplaceInterface.connect(marketOwner).createItem1155(user1.address, 1, 10)
      await QoukkaToken.connect(NFTadmin).transfer(user2.address, 1000000000000000)
      await GunGirls1155.connect(user1).setApprovalForAll(MarketplaceInterface.address, true) //approving to transfer 1155 to Marketplace
    })

    describe("listItem1155 function", function() {
      it("NFT item tokenStatus index have to be equal '0' or 'Owned'", async function() {
        await MarketplaceInterface.connect(user1).listItem1155(1, 10, 1000000000)

        expect(MarketplaceInterface.connect(user1).listItem1155(1, 10, 1000000000)).to.be.revertedWith("Status not Owned")
      })

      it("User with NFT can list it on sale for QTN tokens", async function() {
        await MarketplaceInterface.connect(user1).listItem1155(1, 10, 1000000000)
        const result = await MarketplaceInterface.tokenId1155(1, user1.address)

        expect(result[0]).to.be.equal("10")
        expect(result[5]).to.be.equal(1)
        expect(ethers.utils.formatUnits(result[2], 0)).to.be.equal("1000000000")
      })
    })

    describe("buyItem1155 function", function() {
      it("NFT has to be 'OnSale' to be bought", async function() {
        expect(MarketplaceInterface.connect(user2).buyItem1155(1, user1.address)).to.be.revertedWith("Not on sale")
      })

      it("User can buy NFT on sale for QTN", async function() {
        await MarketplaceInterface.connect(user1).listItem1155(1, 10, 1000000000)
        await QoukkaToken.connect(user2).approve(user1.address, 1000000000)
        await MarketplaceInterface.connect(user2).buyItem1155(1, user1.address)
        const result = await MarketplaceInterface.tokenId1155(1, user2.address)

        expect(result[0]).to.be.equal("10")
        expect(result[5]).to.be.equal(0)
        expect(ethers.utils.formatUnits(result[2], 0)).to.be.equal("0")
      })
    })

    describe("listOnAuction1155 function", function() {
      it("NFT can not be list on auction if its not 'Owned'", async function() {
        await MarketplaceInterface.connect(user1).listItem1155(1, 10, 1000000000)
      
        expect(MarketplaceInterface.connect(user1).listOnAuction1155(1, 10, 1000000000)).to.be.revertedWith("Status not Owned")
      })

      it("Only owner of NFT can list it on auction", async function() {
        expect(MarketplaceInterface.connect(user2).listOnAuction1155(1, 10, 1000000000)).to.be.revertedWith("ERC1155: caller is not owner nor approved")
      })

      it("NFT owner can list it on auction for QTN", async function() {
        await MarketplaceInterface.connect(user1).listOnAuction1155(1, 10, 1000000000)
        const result = await MarketplaceInterface.tokenId1155(1, user1.address)

        expect(result[0]).to.be.equal("10")
        expect(result[5]).to.be.equal(2)
        expect(ethers.utils.formatUnits(result[2], 0)).to.be.equal("1000000000")
      })
    })

    describe("", function() {
      it("NFT must be on auction to make a bid",async function() {
        expect(MarketplaceInterface.connect(user2).makeBid1155(1, user1.address, 1000000000)).to.be.revertedWith("Not on auction")
      })
    })

    describe("makeBid1155 function", function() {
      beforeEach(async function() {
        await MarketplaceInterface.connect(user1).listOnAuction1155(1, 10, 100000000)
      })

      it("To make a bid amountQTN must be higher then best offer", async function() {
        expect(MarketplaceInterface.connect(user2).makeBid1155(1, user1.address, 100)).to.be.revertedWith("Best offer is higher")
      })

      it("User can not make a bid if auction time is passed", async function() {
        await passAuctionTime()

        expect(MarketplaceInterface.connect(user2).makeBid1155(1, user1.address, 1000000000)).to.be.revertedWith("Auction ended")
      })

      it("First bider can make a bid with QTN if amount is enough and auction not ended", async function() {
        await QoukkaToken.connect(user2).approve(MarketplaceInterface.address, 1000000000)
        await MarketplaceInterface.connect(user2).makeBid1155(1, user1.address, 1000000000)
        const result = await MarketplaceInterface.tokenId1155(1, user1.address)

        expect(result[1]).to.be.equal(user2.address)
        expect(result[5]).to.be.equal(2)
        expect(ethers.utils.formatUnits(result[2], 0)).to.be.equal("1000000000")
      })

      it("Other biders have to transfer back last biders bids to make their`s best", async function() {
        await QoukkaToken.connect(user2).approve(MarketplaceInterface.address, 200000000)
        await MarketplaceInterface.connect(user2).makeBid1155(1, user1.address, 200000000)
        const balanceBefore = await QoukkaToken.balanceOf(user2.address)
        expect(ethers.utils.formatUnits(balanceBefore, 0)).to.be.equal("999999800000000")

        await QoukkaToken.connect(NFTadmin).approve(MarketplaceInterface.address, 3000000000)
        await MarketplaceInterface.connect(NFTadmin).makeBid1155(1, user1.address, 300000000)
        const balanceAfter = await QoukkaToken.balanceOf(user2.address)
        expect(ethers.utils.formatUnits(balanceAfter, 0)).to.be.equal("1000000000000000")
      })
    })

    describe("finishAuction1155 function", function() {
      it("NFT must be on auction to finish it",async function() {
        expect(MarketplaceInterface.connect(user2).finishAuction1155(1, user1.address)).to.be.revertedWith("Not on auction")
      })
    })

    describe("finishAuction1155 function", function() {
      beforeEach(async function() {
        await MarketplaceInterface.connect(user1).listOnAuction1155(1, 10, 100000000)
      })

      it("User can not finish auction if 3 days not passed", async function() {
        expect(MarketplaceInterface.connect(user1).finishAuction1155(1, user1.address)).to.be.revertedWith("Auction is not ended")
      })

      it("If there were less then 3 bids, NFT transfers to owner, best bid goes back to bider", async function() {
        await QoukkaToken.connect(user2).approve(MarketplaceInterface.address, 1000000000)
        await MarketplaceInterface.connect(user2).makeBid1155(1, user1.address, 1000000000)

        await passAuctionTime()

        await MarketplaceInterface.connect(marketOwner).finishAuction1155(1, user1.address)
        const result = await MarketplaceInterface.tokenId1155(1, user1.address)

        expect(result[1]).to.be.equal("0x0000000000000000000000000000000000000000")
        expect(result[5]).to.be.equal(0)
        expect(ethers.utils.formatUnits(result[2], 0)).to.be.equal("1000000000")
        expect(await GunGirls1155.balanceOf(user1.address, 1)).to.be.equal("10")

        const balanceAfter = await QoukkaToken.balanceOf(user2.address)
        expect(ethers.utils.formatUnits(balanceAfter, 0)).to.be.equal("1000000000000000")
      })

      it("If there were more then 2 bids, NFT transfers to best bider, best bid goes owner", async function() {
        await QoukkaToken.connect(user2).approve(MarketplaceInterface.address, 1000000000)
        await MarketplaceInterface.connect(user2).makeBid1155(1, user1.address, 1000000000)
        await QoukkaToken.connect(NFTadmin).approve(MarketplaceInterface.address, 2000000000)
        await MarketplaceInterface.connect(NFTadmin).makeBid1155(1, user1.address, 2000000000)
        await QoukkaToken.connect(user2).approve(MarketplaceInterface.address, 3000000000)
        await MarketplaceInterface.connect(user2).makeBid1155(1, user1.address, 3000000000)

        await passAuctionTime()

        await MarketplaceInterface.connect(marketOwner).finishAuction1155(1, user1.address)
        const result = await MarketplaceInterface.tokenId1155(1, user2.address)

        expect(result[1]).to.be.equal("0x0000000000000000000000000000000000000000")
        expect(result[5]).to.be.equal(0)
        expect(ethers.utils.formatUnits(result[2], 0)).to.be.equal("3000000000")
        expect(await GunGirls1155.balanceOf(user2.address, 1)).to.be.equal("10")

        const balanceAfter = await QoukkaToken.balanceOf(user1.address)
        expect(ethers.utils.formatUnits(balanceAfter, 0)).to.be.equal("3000000000")
      })
    }) 
  })
})
