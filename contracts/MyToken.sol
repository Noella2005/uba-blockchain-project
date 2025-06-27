// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

// This is your custom ERC20 token contract.
contract MyToken is ERC20, Ownable, ReentrancyGuard {
    // --- State Variables ---

    // The 3 addresses that are required to approve minting and withdrawals.
    address[3] public multisigWallets;

    // A constant price for buying tokens: 1 token = 0.001 ETH.
    uint256 public constant TOKEN_PRICE = 0.001 ether;

    // --- Mappings for Multi-Signature Logic ---
    
    // Minting approvals: keccak256(to, amount) => approverAddress => hasApproved
    mapping(bytes32 => mapping(address => bool)) public mintApprovals;
    // Minting approval count: keccak256(to, amount) => count
    mapping(bytes32 => uint256) public mintApprovalCount;

    // Withdrawal approvals: keccak256(amount) => approverAddress => hasApproved
    mapping(bytes32 => mapping(address => bool)) public withdrawApprovals;
    // Withdrawal approval count: keccak256(amount) => count
    mapping(bytes32 => uint256) public withdrawApprovalCount;

    // --- Events ---
    event MintRequestApproved(bytes32 indexed requestId, address indexed approver);
    event TokensMinted(bytes32 indexed requestId, address indexed to, uint256 amount);
    event WithdrawRequestApproved(bytes32 indexed requestId, address indexed approver);
    event FundsWithdrawn(bytes32 indexed requestId, address indexed to, uint256 amount);
    event TokensPurchased(address indexed buyer, uint256 ethAmount, uint256 tokenAmount);

    // --- Constructor ---
    // This is executed only once when the contract is deployed.
    constructor(
        address _multisig1,
        address _multisig2,
        address _multisig3
    ) ERC20("Group 2 Token", "G2TK") Ownable(msg.sender) {
        // Set the three multi-signature wallets. These cannot be changed later.
        multisigWallets[0] = _multisig1;
        multisigWallets[1] = _multisig2;
        multisigWallets[2] = _multisig3;

        // Mint 1,000,000 initial tokens to the contract deployer (owner).
        _mint(msg.sender, 1_000_000 * 10**decimals());
    }

    // --- Public & External Functions ---

    /**
     * @dev Allows users to receive tokens by sending ETH directly to the contract.
     * The transaction will fail if no ETH is sent.
     */
    receive() external payable {
        require(msg.value > 0, "MyToken: Must send ETH to receive tokens");
        uint256 tokensToMint = msg.value / TOKEN_PRICE;
        _mint(msg.sender, tokensToMint);
        emit TokensPurchased(msg.sender, msg.value, tokensToMint);
    }

    /**
     * @dev Allows users to buy a specific number of tokens by sending the exact ETH amount.
     * @param _tokenAmount The amount of tokens to buy.
     */
    function buyTokens(uint256 _tokenAmount) external payable {
        uint256 requiredEth = _tokenAmount * TOKEN_PRICE;
        require(msg.value == requiredEth, "MyToken: Incorrect ETH amount sent for tokens");
        _mint(msg.sender, _tokenAmount);
        emit TokensPurchased(msg.sender, msg.value, _tokenAmount);
    }

    /**
     * @dev Allows a multi-sig wallet to approve a minting request.
     * Requires all 3 multi-sig wallets to approve the exact same request.
     * @param _to The address to mint tokens to.
     * @param _amount The amount of tokens to mint (in wei, i.e., including decimals).
     */
    function approveMint(address _to, uint256 _amount) external {
        require(isMultisig(msg.sender), "MyToken: Not a multi-sig wallet");
        
        bytes32 requestId = keccak256(abi.encodePacked("mint", _to, _amount));
        require(!mintApprovals[requestId][msg.sender], "MyToken: Already approved this mint");

        mintApprovals[requestId][msg.sender] = true;
        mintApprovalCount[requestId]++;
        emit MintRequestApproved(requestId, msg.sender);

        if (mintApprovalCount[requestId] == 3) {
            _executeMint(requestId, _to, _amount);
        }
    }

    /**
     * @dev Allows a multi-sig wallet to approve a fund withdrawal request.
     * Requires 2 out of 3 multi-sig wallets to approve.
     * @param _amount The amount of ETH to withdraw.
     */
    function approveWithdrawal(uint256 _amount) external {
        require(isMultisig(msg.sender), "MyToken: Not a multi-sig wallet");

        bytes32 requestId = keccak256(abi.encodePacked("withdraw", _amount));
        require(!withdrawApprovals[requestId][msg.sender], "MyToken: Already approved this withdrawal");

        withdrawApprovals[requestId][msg.sender] = true;
        withdrawApprovalCount[requestId]++;
        emit WithdrawRequestApproved(requestId, msg.sender);

        if (withdrawApprovalCount[requestId] >= 2) {
            _executeWithdrawal(requestId, _amount);
        }
    }

    // --- Internal & Private Functions ---

    /**
     * @dev Internal function to execute the minting after sufficient approvals.
     * This is nonReentrant to prevent re-entrancy attacks.
     */
    function _executeMint(bytes32 _requestId, address _to, uint256 _amount) private nonReentrant {
        _mint(_to, _amount);
        emit TokensMinted(_requestId, _to, _amount);
        // Reset approvals for this specific request to prevent replay attacks
        delete mintApprovalCount[_requestId];
    }

    /**
     * @dev Internal function to execute the ETH withdrawal after sufficient approvals.
     * This is nonReentrant to prevent re-entrancy attacks.
     */
    function _executeWithdrawal(bytes32 _requestId, uint256 _amount) private nonReentrant {
        require(address(this).balance >= _amount, "MyToken: Insufficient contract balance");
        
        // Transfer funds to the contract owner
        (bool success, ) = owner().call{value: _amount}("");
        require(success, "MyToken: ETH transfer failed");
        
        emit FundsWithdrawn(_requestId, owner(), _amount);
        // Reset approvals for this specific request
        delete withdrawApprovalCount[_requestId];
    }

    /**
     * @dev Helper function to check if an address is one of the designated multi-sig wallets.
     */
    function isMultisig(address _account) public view returns (bool) {
        return (_account == multisigWallets[0] || 
                _account == multisigWallets[1] || 
                _account == multisigWallets[2]);
    }
}