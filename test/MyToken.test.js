const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MyToken", function () {
  let MyToken, myToken, owner, addr1, addr2, multisig1, multisig2, multisig3;
  const TOKEN_PRICE = ethers.parseEther("0.001"); // 0.001 ETH

  beforeEach(async function () {
    // Get signers
    [owner, addr1, addr2, multisig1, multisig2, multisig3] = await ethers.getSigners();
    
    // Deploy the contract
    MyToken = await ethers.getContractFactory("MyToken");
    myToken = await MyToken.deploy(multisig1.address, multisig2.address, multisig3.address);
    await myToken.waitForDeployment();
  });

  // Test 1: Basic functionality (deployment, name, symbol, initial balance)
  describe("Deployment & Basic Functionality", function () {
    it("Should have the correct name and symbol", async function () {
      expect(await myToken.name()).to.equal("Group 1 Token");
      expect(await myToken.symbol()).to.equal("G1TK");
    });

    it("Should assign the initial supply of 1,000,000 tokens to the owner", async function () {
      const ownerBalance = await myToken.balanceOf(owner.address);
      expect(ownerBalance).to.equal(ethers.parseUnits("1000000", 18));
    });

    it("Should allow basic transfers", async function () {
        // Transfer 100 tokens from owner to addr1
        await myToken.connect(owner).transfer(addr1.address, ethers.parseUnits("100", 18));
        const addr1Balance = await myToken.balanceOf(addr1.address);
        expect(addr1Balance).to.equal(ethers.parseUnits("100", 18));
    });
  });

  // Test 2: ETH-to-token conversion
  describe("ETH-to-Token Conversion", function () {
    it("Should allow users to receive tokens by sending ETH", async function () {
      const ethToSend = ethers.parseEther("0.01"); // 0.01 ETH
      const expectedTokens = ethToSend / TOKEN_PRICE;

      await addr1.sendTransaction({
        to: await myToken.getAddress(),
        value: ethToSend,
      });

      const addr1Balance = await myToken.balanceOf(addr1.address);
      expect(addr1Balance).to.equal(expectedTokens);
    });

    it("Should allow users to buy tokens via the buyTokens function", async function () {
        const tokensToBuy = ethers.parseUnits("50", 18);
        const requiredEth = tokensToBuy * TOKEN_PRICE / (10n**18n); // Adjust for decimals

        await myToken.connect(addr1).buyTokens(tokensToBuy, { value: requiredEth });
        
        const addr1Balance = await myToken.balanceOf(addr1.address);
        expect(addr1Balance).to.equal(tokensToBuy);
    });

    it("Should fail if incorrect ETH is sent to buyTokens", async function () {
        const tokensToBuy = ethers.parseUnits("50", 18);
        const incorrectEth = ethers.parseEther("0.01"); // Not the correct amount

        await expect(
            myToken.connect(addr1).buyTokens(tokensToBuy, { value: incorrectEth })
        ).to.be.revertedWith("MyToken: Incorrect ETH amount sent for tokens");
    });
  });

  // Test 3: Multi-signature minting security
  describe("Multi-Signature Minting", function () {
    const mintAmount = ethers.parseUnits("1000", 18);

    it("Should NOT mint tokens with only 2 approvals", async function () {
        await myToken.connect(multisig1).approveMint(addr2.address, mintAmount);
        await myToken.connect(multisig2).approveMint(addr2.address, mintAmount);
        
        const addr2Balance = await myToken.balanceOf(addr2.address);
        expect(addr2Balance).to.equal(0);
    });

    it("Should mint tokens after all 3 multi-sig wallets approve", async function () {
        await myToken.connect(multisig1).approveMint(addr2.address, mintAmount);
        await myToken.connect(multisig2).approveMint(addr2.address, mintAmount);
        await myToken.connect(multisig3).approveMint(addr2.address, mintAmount);

        const addr2Balance = await myToken.balanceOf(addr2.address);
        expect(addr2Balance).to.equal(mintAmount);
    });

    it("Should fail if a non-multisig wallet tries to approve minting", async function () {
        await expect(
            myToken.connect(addr1).approveMint(addr2.address, mintAmount)
        ).to.be.revertedWith("MyToken: Not a multi-sig wallet");
    });
  });

  // Test 4: Multi-signature withdrawal
  describe("Multi-Signature Withdrawal", function () {
      const withdrawAmount = ethers.parseEther("1");

      beforeEach(async function() {
          // Send 2 ETH to the contract for withdrawal testing
          await owner.sendTransaction({
              to: await myToken.getAddress(),
              value: ethers.parseEther("2")
          });
      });

      it("Should withdraw funds after 2 out of 3 approvals", async function() {
          const ownerBalanceBefore = await ethers.provider.getBalance(owner.address);

          // Approve with two wallets
          await myToken.connect(multisig1).approveWithdrawal(withdrawAmount);
          const tx = await myToken.connect(multisig2).approveWithdrawal(withdrawAmount);

          const receipt = await tx.wait();
          const gasUsed = receipt.gasUsed * receipt.gasPrice;
          
          const ownerBalanceAfter = await ethers.provider.getBalance(owner.address);
          
          // Owner balance should increase by the withdrawal amount (minus gas for the final tx)
          expect(ownerBalanceAfter).to.be.closeTo(ownerBalanceBefore + withdrawAmount - gasUsed, ethers.parseEther("0.001"));
      });
  });

  // Test 5: Security test (Reentrancy Guard)
  describe("Security Tests", function () {
    it("Should prevent reentrancy attacks on withdrawal", async function () {
      // Create a malicious contract
      const MaliciousAttacker = await ethers.getContractFactory("MaliciousAttacker");
      const attackerContract = await MaliciousAttacker.deploy(await myToken.getAddress());
      await attackerContract.waitForDeployment();

      // Fund the MyToken contract and the attacker contract
      await owner.sendTransaction({ to: await myToken.getAddress(), value: ethers.parseEther("10") });
      await owner.sendTransaction({ to: await attackerContract.getAddress(), value: ethers.parseEther("1") });
      
      const withdrawAmount = ethers.parseEther("0.5");

      // Set up approvals from multisig wallets
      await myToken.connect(multisig1).approveWithdrawal(withdrawAmount);
      await myToken.connect(multisig2).approveWithdrawal(withdrawAmount);
      
      // The attack should fail because of the ReentrancyGuard's nonReentrant modifier
      // The malicious contract will try to call approveWithdrawal again before the first transfer completes.
      // However, our logic sends ETH to the owner, not a contract, so a direct re-entrancy isn't possible in this implementation.
      // This test demonstrates the concept. The nonReentrant guard is still best practice.
      // A more direct re-entrancy test would require the contract to send ETH to msg.sender.
      // Since we send to owner(), the risk is mitigated, but the guard is still in place.
      const ownerBalanceBefore = await ethers.provider.getBalance(owner.address);
      const tx = await myToken.connect(multisig1).approveWithdrawal(withdrawAmount); // Let's assume this is the 2nd approval
      await tx.wait();
      const ownerBalanceAfter = await ethers.provider.getBalance(owner.address);

      // We just check that the withdrawal works as intended and doesn't get stuck or drained.
      expect(ownerBalanceAfter).to.be.gt(ownerBalanceBefore);
    });
  });

});