// scripts/deploy.js
const hre = require("hardhat");

async function main() {
  // IMPORTANT: Replace these with three different addresses you control.
  // You can create new accounts in MetaMask for this purpose.
  const multisig1 = "0x676fc9e77cc8e29844cd9f085caadebd7a181b35";
  const multisig2 = "0x05DE0f07380365C76D0c5C2Cb0D5d343145Cd6b5";
  const multisig3 = "0x32324C66cf418Fe48b80be250a1E4AC5B062cb0E";

  if (multisig1 === "0xYourFirstAddress" || multisig2 === "0xYourSecondAddress" || multisig3 === "0xYourThirdAddress") {
    console.error("Please replace the placeholder multisig addresses in the deploy script.");
    process.exit(1);
  }

  console.log("Deploying MyToken contract...");

  const MyToken = await hre.ethers.getContractFactory("MyToken");
  const myToken = await MyToken.deploy(multisig1, multisig2, multisig3);

  await myToken.waitForDeployment();

  const contractAddress = await myToken.getAddress();
  console.log(`MyToken deployed to: ${contractAddress}`);
  
  console.log("\nDeployment arguments:");
  console.log(`multisig1: ${multisig1}`);
  console.log(`multisig2: ${multisig2}`);
  console.log(`multisig3: ${multisig3}`);
  console.log("\nTo verify on Etherscan, run the following command:");
  console.log(`npx hardhat verify --network sepolia ${contractAddress} "${multisig1}" "${multisig2}" "${multisig3}"`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});