# UBa Distributed Systems and Blockchains Security Project

This repository contains the full Hardhat project for the Distributed Systems and Blockchains Security course at The University of Bamenda. The project involves creating a custom ERC20 token (`G2TK`), a multi-signature wallet system for minting and withdrawals, and a second smart contract (`UBaEducationCredentialsStore`) that uses the token for service payments.

---

## Deployed Contract Addresses (Sepolia Testnet)

*   **MyToken (G2TK):** `0xc9f9936e14c033Ca913E14AEd364Cf99F58F3831`
    *   [View on Sepolia Etherscan](https://sepolia.etherscan.io/address/0xc9f9936e14c033Ca913E14AEd364Cf99F58F3831#code)

*   **UBaEducationCredentialsStore:** `0xC1dAadB1bCdA5cf4615b35E0dDF9AABC9DfcdF8a`
    *   [View on Sepolia Etherscan](https://sepolia.etherscan.io/address/0xC1dAadB1bCdA5cf4615b35E0dDF9AABC9DfcdF8a#code)

---

## Setup and Installation

Follow these steps to set up the project locally.

1.  **Prerequisites:**
    *   [Node.js](https://nodejs.org/) (LTS version)
    *   [Git](https://git-scm.com/)

2.  **Clone the Repository:**
    ```bash
    git clone https://github.com/Noella2005/uba-blockchain-project.git
    cd uba-blockchain-project
    ```
    
3.  **Install Dependencies:**
    ```bash
    npm install
    ```

4.  **Create `.env` File:**
    Create a file named `.env` in the root of the project folder and add the following, replacing the placeholder values with your own secrets.
    ```env
    SEPOLIA_RPC_URL="YOUR_ALCHEMY_OR_INFURA_HTTPS_URL"
    PRIVATE_KEY="YOUR_METAMASK_PRIVATE_KEY_WITHOUT_0x"
    ETHERSCAN_API_KEY="YOUR_ETHERSCAN_API_KEY"
    ```

---

## Executing Tests

To run the full suite of unit tests, execute the following command:

```bash
npx hardhat test
```
The tests cover basic token functionality, ETH-to-token conversion, and multi-signature security features.

---

## Deployment

The project includes scripts to deploy both contracts to a network like Sepolia.

1.  **Deploy `MyToken.sol`:**
    *   Update the three multisig wallet addresses in `scripts/deploy.js`.
    *   Run the deployment script:
        ```bash
        npx hardhat run scripts/deploy.js --network sepolia
        ```

2.  **Deploy `UBaEducationCredentialsStore.sol`:**
    *   Update the `myTokenAddress` in `scripts/deployStore.js` with the newly deployed `MyToken` contract address.
    *   Run the deployment script:
        ```bash
        npx hardhat run scripts/deployStore.js --network sepolia
        ```

Both scripts will output the contract addresses and the commands needed for Etherscan verification.