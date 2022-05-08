import hre from 'hardhat';
const ethers = hre.ethers;

let ERC721address: string = "0xfB90d78f44f39aeB1ddeC89fAfc29bFd8B533623";
let ERC1155address: string = "0x3bE826d07A4440F2E5EA9f85CbFEF6D9c2316663";
let ERC20address: string = "0x04d9dfeA1b3815B62B7E105AF570A742a2Ba6334";

async function main() {
    const [owner] = await ethers.getSigners()
    const Marketplace = await ethers.getContractFactory('Marketplace', owner)
    const marketplace = await Marketplace.deploy(
      ERC721address,
      ERC1155address,
      ERC20address
    )
    await marketplace.deployed()
    console.log(marketplace.address)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });