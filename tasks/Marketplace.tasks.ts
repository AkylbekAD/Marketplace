import { task } from "hardhat/config";

// const MarketplaceAddress = "0xE5Ce788D505a7C4e612D83283b9F80c1b2AE8843"
const MarketplaceAddress = "0x764147027Aafd628221216B51454AFd3224a7B84"

task("tokenId721", "Returns token721 info on marketplace")
    .addParam("id", "ERC721 token id you want to get info")
    .setAction(async (taskArgs, hre) => {
        const MarketplaceInterface = await hre.ethers.getContractAt("Marketplace", MarketplaceAddress)
        const result = await MarketplaceInterface.tokenId721(taskArgs.id)
        console.log(result)
    })

task("tokenId1155", "Returns token1155 info on marketplace")
    .addParam("id", "ERC721 token id you want to get info")
    .addParam("address", "Lister address you want to get info")
    .setAction(async (taskArgs, hre) => {
        const MarketplaceInterface = await hre.ethers.getContractAt("Marketplace", MarketplaceAddress)
        const result = await MarketplaceInterface.tokenId1155(taskArgs.id, taskArgs.address)
        console.log(result)
    })

task("giveAdminRights", "Give rights to createItem721 and createItem1155 functions")
    .addParam("address", "Address you want to make admin")
    .setAction(async (taskArgs, hre) => {
        const MarketplaceInterface = await hre.ethers.getContractAt("Marketplace", MarketplaceAddress)
        await MarketplaceInterface.giveAdminRights(taskArgs.address)
        console.log(`You have made ${taskArgs.address} as Admin`)
    })

task("revokeAdminRights", "Revoke rights to createItem721 and createItem1155 functions")
    .addParam("address", "Address you want to revoke admin rights")
    .setAction(async (taskArgs, hre) => {
        const MarketplaceInterface = await hre.ethers.getContractAt("Marketplace", MarketplaceAddress)
        await MarketplaceInterface.revokeAdminRights(taskArgs.address)
        console.log(`You have revoke Admin rights from ${taskArgs.address}`)
    })

task("listItem721", "Listing token721 on marketplace")
    .addParam("id", "ERC721 token id you want to list")
    .addParam("price", "Amount of QTN you want to set as price")
    .setAction(async (taskArgs, hre) => {
        const MarketplaceInterface = await hre.ethers.getContractAt("Marketplace", MarketplaceAddress)
        await MarketplaceInterface.listItem721(taskArgs.id, taskArgs.amount)
        console.log(`You have listed ERC721 id №${taskArgs.id} for ${taskArgs.price}`)
    })

task("listItem1155", "Listing amount of token1155 on marketplace")
    .addParam("id", "ERC1155 token id you want to list")
    .addParam("amount", "Amount on token1155 you want to list")
    .addParam("price", "Amount of QTN you want to set as price")
    .setAction(async (taskArgs, hre) => {
        const MarketplaceInterface = await hre.ethers.getContractAt("Marketplace", MarketplaceAddress)
        await MarketplaceInterface.listItem1155(taskArgs.id, taskArgs.amount, taskArgs.price)
        console.log(`You have listed ERC1155 id №${taskArgs.id} with ${taskArgs.amount} amount for ${taskArgs.price}`)
    })

task("buyItem721", "Buying token721 on marketplace")
    .addParam("id", "ERC721 token id you want to buy")
    .setAction(async (taskArgs, hre) => {
        const MarketplaceInterface = await hre.ethers.getContractAt("Marketplace", MarketplaceAddress)
        await MarketplaceInterface.buyItem721(taskArgs.id)
        console.log(`You have bought ERC721 №${taskArgs.id} for ${taskArgs.amount}`)
    })

task("cancelList721", "Cancel list token721 on marketplace")
    .addParam("id", "ERC721 token id you want to cancel list")
    .setAction(async (taskArgs, hre) => {
        const MarketplaceInterface = await hre.ethers.getContractAt("Marketplace", MarketplaceAddress)
        await MarketplaceInterface.cancelList721(taskArgs.id)
        console.log(`You have cancel list ERC721 №${taskArgs.id}`)
    })

task("buyItem1155", "buying amount of token1155 on marketplace")
    .addParam("id", "ERC1155 token id you want to buy")
    .addParam("seller", "Seller address you want to buy from")
    .setAction(async (taskArgs, hre) => {
        const MarketplaceInterface = await hre.ethers.getContractAt("Marketplace", MarketplaceAddress)
        await MarketplaceInterface.buyItem1155(taskArgs.id, taskArgs.seller)
        console.log(`You have bought ERC1155 id №${taskArgs.id} from ${taskArgs.seller}`)
    })

task("listOnAuction721", "Listing token721 on auction on marketplace")
    .addParam("id", "ERC721 token id you want to list on auction")
    .addParam("price", "Amount of QTN you want to set as a start price")
    .setAction(async (taskArgs, hre) => {
        const MarketplaceInterface = await hre.ethers.getContractAt("Marketplace", MarketplaceAddress)
        await MarketplaceInterface.listOnAuction721(taskArgs.id, taskArgs.price)
        console.log(`You have listed on auction ERC721 id №${taskArgs.id} for ${taskArgs.price}`)
    })

task("listOnAuction1155", "Listing token1155 on auction on marketplace")
    .addParam("id", "ERC1155 token id you want to list on auction")
    .addParam("amount", "ERC1155 token amount you want to list on auction")
    .addParam("price", "Amount of QTN you want to set as a start price")
    .setAction(async (taskArgs, hre) => {
        const MarketplaceInterface = await hre.ethers.getContractAt("Marketplace", MarketplaceAddress)
        await MarketplaceInterface.listOnAuction1155(taskArgs.id, taskArgs.amount, taskArgs.price)
        console.log(`You have listed on auction ERC1155 id №${taskArgs.id} with ${taskArgs.amount} amount for ${taskArgs.price}`)
    })

task("makeBid721", "Make a bid for token721 on auction on marketplace")
    .addParam("id", "ERC721 token id you want to get")
    .addParam("bid", "Amount of QTN you want to set as a best bid")
    .setAction(async (taskArgs, hre) => {
        const MarketplaceInterface = await hre.ethers.getContractAt("Marketplace", MarketplaceAddress)
        await MarketplaceInterface.makeBid721(taskArgs.id, taskArgs.bid)
        console.log(`You have made a bid on auction for ERC721 id №${taskArgs.id} with amount ${taskArgs.bid}`)
    })

task("makeBid1155", "Make a bid for token1155 on auction on marketplace")
    .addParam("id", "ERC1155 token id you want to get")
    .addParam("seller", "Seller address you want to buy from")
    .addParam("bid", "Amount of QTN you want to set as a best bid")
    .setAction(async (taskArgs, hre) => {
        const MarketplaceInterface = await hre.ethers.getContractAt("Marketplace", MarketplaceAddress)
        await MarketplaceInterface.makeBid1155(taskArgs.id, taskArgs.seller, taskArgs.bid)
        console.log(`You have made a bid on auction for ERC1155 id №${taskArgs.id} with amount ${taskArgs.bid} from ${taskArgs.seller}`)
    })

task("finishAuction721", "Finish token721 auction on marketplace")
    .addParam("id", "ERC721 token auction you want to finish")
    .setAction(async (taskArgs, hre) => {
        const MarketplaceInterface = await hre.ethers.getContractAt("Marketplace", MarketplaceAddress)
        await MarketplaceInterface.finishAuction721(taskArgs.id)
        console.log(`You have finished ERC721 id №${taskArgs.id} auction`)
    })

task("finishAuction1155", "Finish token1155 auction on marketplace")
    .addParam("id", "ERC1155 token auction you want to finish")
    .addParam("seller", "Seller address you want to buy from")
    .setAction(async (taskArgs, hre) => {
        const MarketplaceInterface = await hre.ethers.getContractAt("Marketplace", MarketplaceAddress)
        await MarketplaceInterface.finishAuction1155(taskArgs.id, taskArgs.seller)
        console.log(`You have finished ERC1155 id №${taskArgs.id} auction with ${taskArgs.seller} seller`)
    })