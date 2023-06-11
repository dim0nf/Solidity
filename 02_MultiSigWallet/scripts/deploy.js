const { ethers } = require("hardhat");

async function main() {
    const [deployer, addr1,addr2, addr3] = await ethers.getSigners();
    const vote = 2;
  
    console.log("Deploying contracts with the account:", deployer.address);
    console.log("Account balance:", (await deployer.getBalance()).toString());

    const MultiSigWallet = await ethers.getContractFactory("MultiSigWallet");
    const multisigwallet = await MultiSigWallet.deploy(
      [addr1.address,addr2.address,addr3.address],
      // ["0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
      // "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
      // "0x90F79bf6EB2c4f870365E785982E1f101E93b906"],
      vote);
  
    console.log("MultiSigWallet address:", multisigwallet.address);
    console.log("Deployer address:", deployer);
  }
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });