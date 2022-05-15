# Marketplace smart-contract project
Marketplace allows to list on sale or list on auction ERC721 and ERC1155 tokens for QTN ERC20 tokens

Etherscan - https://rinkeby.etherscan.io/address/0x764147027Aafd628221216B51454AFd3224a7B84#code

Tokens inputed for deploy:

ERC1155 - https://rinkeby.etherscan.io/address/0x3bE826d07A4440F2E5EA9f85CbFEF6D9c2316663#code

ERC721 - https://rinkeby.etherscan.io/address/0xfB90d78f44f39aeB1ddeC89fAfc29bFd8B533623#code

ERC20 - https://rinkeby.etherscan.io/address/0x04d9dfeA1b3815B62B7E105AF570A742a2Ba6334#code

## hardhat-contract-sizer and hardhat-gas-reporter configured
run ```npx hardhat test``` to see Gas report, coinmarketapi key required in ```.env``` file

run ```npx hardhat size-contracts``` to get size(KB) of the contract