// scripts/transfer.js
const hre = require("hardhat");

async function main() {
  const contractAddress = "0xc9f9936e14c033Ca913E14AEd364Cf99F58F3831"; // <-- Paste your contract address here
  const recipientAddress = "0x0874207411f712D90edd8ded353fdc6f9a417903";
  
  // The amount of tokens to transfer (10 tokens).
  // ERC20 tokens have decimals, so we need to account for that.
  // 10 tokens with 18 decimals is 10 * 10^18.
  const amount = hre.ethers.parseUnits("10", 18);

  const MyToken = await hre.ethers.getContractAt("MyToken", contractAddress);

  console.log(`Transferring ${hre.ethers.formatUnits(amount, 18)} G2TK to ${recipientAddress}...`);

  const tx = await MyToken.transfer(recipientAddress, amount);
  await tx.wait(); // Wait for the transaction to be mined

  console.log("Transfer successful!");
  console.log(`Transaction Hash: ${tx.hash}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});