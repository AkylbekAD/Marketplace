import { task } from "hardhat/config";

const MarketplaceAddress = "0xE5Ce788D505a7C4e612D83283b9F80c1b2AE8843"

task("tokenId721", "Returns token`s info on marketplace")
    .addParam("id", "ERC721 token id you want to get info")
    .setAction(async (taskArgs, hre) => {
        const MarketplaceInterface = await hre.ethers.getContractAt("Marketplace", MarketplaceAddress)
        const result = await MarketplaceInterface.tokenId721(taskArgs.id)
        console.log(result)
    })