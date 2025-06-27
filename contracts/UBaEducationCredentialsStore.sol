// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract UBaEducationCredentialsStore is Ownable {
    // --- State Variables ---
    IERC20 public immutable token; // The custom ERC20 token used for payments (Your G1TK)
    uint256 public verificationFee; // The fee in tokens to verify a credential

    // Mapping from a document hash to a boolean indicating if it has been added by the owner
    mapping(bytes32 => bool) public credentialHashes;

    // --- Events ---
    event CredentialAdded(bytes32 indexed documentHash, address indexed addedBy);
    event CredentialVerified(bytes32 indexed documentHash, address indexed verifiedBy);
    event FeesWithdrawn(address indexed to, uint256 amount);

    // --- Constructor ---
    // This runs once when you deploy the contract.
    // _tokenAddress is the address of your G1TK token contract.
    // _initialFee is the price in G1TK to verify one document.
    constructor(address _tokenAddress, uint256 _initialFee) Ownable(msg.sender) {
        token = IERC20(_tokenAddress);
        verificationFee = _initialFee;
    }

    // --- Owner-Only Functions ---

    /**
     * @dev Allows the owner (the university) to add the hash of a credential to the system.
     * @param _documentJson The JSON string of the document.
     */
    function addCredential(string calldata _documentJson) external onlyOwner {
        bytes32 documentHash = keccak256(bytes(_documentJson));
        require(!credentialHashes[documentHash], "Credential already exists");
        credentialHashes[documentHash] = true;
        emit CredentialAdded(documentHash, msg.sender);
    }

    /**
     * @dev Allows the owner to withdraw all collected fee tokens from this contract.
     */
    function withdrawFees() external onlyOwner {
        uint256 balance = token.balanceOf(address(this));
        require(balance > 0, "No fees to withdraw");
        token.transfer(owner(), balance);
        emit FeesWithdrawn(owner(), balance);
    }

    /**
     * @dev Allows the owner to update the verification fee.
     */
    function setVerificationFee(uint256 _newFee) external onlyOwner {
        verificationFee = _newFee;
    }

    // --- Public Functions ---

    /**
     * @dev Allows anyone to verify a credential by paying a fee in G1TK.
     * The user must first approve this contract to spend their tokens.
     * @param _documentJson The JSON string of the document to verify.
     * @return A boolean indicating if the credential is valid (i.e., its hash is stored).
     */
    function verifyCredential(string calldata _documentJson) external returns (bool) {
        require(token.balanceOf(msg.sender) >= verificationFee, "Insufficient token balance");
        
        // Pull the fee from the user's wallet to this contract.
        // The user MUST have called token.approve(this_contract_address, amount) beforehand.
        bool success = token.transferFrom(msg.sender, address(this), verificationFee);
        require(success, "Token transfer failed. Did you approve first?");

        bytes32 documentHash = keccak256(bytes(_documentJson));
        
        emit CredentialVerified(documentHash, msg.sender);
        
        // Returns true if the hash exists in our system, false otherwise.
        return credentialHashes[documentHash];
    }
}