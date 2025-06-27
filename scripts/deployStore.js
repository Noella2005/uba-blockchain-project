// scripts/deployStore.js
const hre = require("hardhat");
const { ethers } = hre;

async function main() {
  // 1. Address of the MyToken contract you already deployed.
  // This should be your G1TK token's address.
  const myTokenAddress = "0xc9f9936e14c033Ca913E14AEd364Cf99F58F3831";
  
  // 2. Fee to verify a document, e.g., 5 G1TK tokens.
  // We use parseUnits to handle the 18 decimals of the token.
  // This represents 5 followed by 18 zeros.
  const verificationFee = ethers.parseUnits("5", 18);

  console.log("Deploying UBaEducationCredentialsStore...");
  console.log(`It will be linked to the G2TK token at: ${myTokenAddress}`);
  console.log(`The verification fee will be: 5 G2TK`);

  const Store = await ethers.getContractFactory("UBaEducationCredentialsStore");
  // Deploy the contract with its two constructor arguments:
  const store = await Store.deploy(myTokenAddress, verificationFee);

  await store.waitForDeployment();
  const contractAddress = await store.getAddress();
  
  console.log(`\nUBaEducationCredentialsStore deployed to: ${contractAddress}`);

  // 3. Print the command needed to verify the contract on Etherscan
  console.log("\nTo verify on Etherscan, run the following command:");
  console.log(`npx hardhat verify --network sepolia ${contractAddress} "${myTokenAddress}" "${verificationFee.toString()}"`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});