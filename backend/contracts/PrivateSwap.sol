// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, euint64, externalEuint32, externalEuint64} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title PrivateSwap - Single-contract FHE swap demo (amount + slippage kept private)
/// @notice Follows Zama template patterns for inputs, operations and ACL, returning encrypted handles
contract PrivateSwap is SepoliaConfig {
    // Prices are stored as fixed-point with 1e4 decimals (e.g. price = 1.5 => 15_000)
    // We keep two directions for a simple pair A<->B
    euint32 private _priceAtoB; // scaled by 1e6
    euint32 private _priceBtoA; // scaled by 1e6

    // Last encrypted quote result per user for UI decrypt; not authoritative for settlement
    mapping(address => euint64) private _lastQuoteOut;

    event PricesUpdated();
    event Quoted(address indexed user);

    /// @notice Set default prices to 1.0 (1e4) at deployment to avoid uninitialized handles
    constructor() {
        euint32 one = FHE.asEuint32(10_000);
        _priceAtoB = one;
        _priceBtoA = one;
        FHE.allowThis(_priceAtoB);
        FHE.allowThis(_priceBtoA);
    }

    /// @notice Initialize prices in plaintext (owner-less demo). In production, use access control.
    /// @dev Expect values scaled by 1e4
    function initPrices(uint32 priceAtoB_1e4, uint32 priceBtoA_1e4) external {
        _priceAtoB = FHE.asEuint32(priceAtoB_1e4);
        _priceBtoA = FHE.asEuint32(priceBtoA_1e4);
        // Allow this contract to reuse and callers to decrypt on demand
        FHE.allowThis(_priceAtoB);
        FHE.allowThis(_priceBtoA);
    }

    /// @notice Update prices with encrypted inputs
    function setPrices(
        externalEuint32 priceAtoB_encrypted,
        externalEuint32 priceBtoA_encrypted,
        bytes calldata inputProof
    ) external {
        euint32 p1 = FHE.fromExternal(priceAtoB_encrypted, inputProof);
        euint32 p2 = FHE.fromExternal(priceBtoA_encrypted, inputProof);
        _priceAtoB = p1;
        _priceBtoA = p2;
        FHE.allowThis(_priceAtoB);
        FHE.allowThis(_priceBtoA);
        emit PricesUpdated();
    }

    /// @notice Quote output for swapping A->B given encrypted amountIn and encrypted max slippage in bps (1e4)
    /// @dev Further optimized: remove the final division on-chain to reduce HCU.
    ///      We return a numerator scaled by 1e8; the frontend divides after decryption.
    ///      Returns an encrypted amountOutNumerator; frontend decrypts and scales by 1e8.
    function quoteAtoB(
        externalEuint32 amountIn_encrypted,
        externalEuint32 maxSlippagePpm_encrypted,
        bytes calldata inputProof
    ) external returns (euint64) {
        euint32 amountIn32 = FHE.fromExternal(amountIn_encrypted, inputProof);
        euint32 maxSlippagePpm = FHE.fromExternal(maxSlippagePpm_encrypted, inputProof);

        // Compute factor = (1e4 - maxSlippagePpm)
        euint32 factor32 = FHE.sub(FHE.asEuint32(10_000), maxSlippagePpm);
        // Compute in 64-bit to avoid overflow, and return numerator scaled by 1e8.
        // discountedNumerator = amountIn * (1e4 - slippagePpm) * price
        euint64 discounted = FHE.mul(
            FHE.mul(FHE.asEuint64(amountIn32), FHE.asEuint64(factor32)),
            FHE.asEuint64(_priceAtoB)
        );

        _lastQuoteOut[msg.sender] = discounted;
        // Grant contract + caller permissions on the handle so frontend can decrypt
        FHE.allowThis(discounted);
        FHE.allow(discounted, msg.sender);
        emit Quoted(msg.sender);
        return discounted;
    }

    /// @notice Quote output for swapping B->A (symmetric to A->B). Slippage in bps (1e4)
    /// @dev Further optimized: remove the final division on-chain; return numerator scaled by 1e8
    function quoteBtoA(
        externalEuint32 amountIn_encrypted,
        externalEuint32 maxSlippagePpm_encrypted,
        bytes calldata inputProof
    ) external returns (euint64) {
        euint32 amountIn32 = FHE.fromExternal(amountIn_encrypted, inputProof);
        euint32 maxSlippagePpm = FHE.fromExternal(maxSlippagePpm_encrypted, inputProof);

        // Compute factor = (1e4 - maxSlippagePpm)
        euint32 factor32 = FHE.sub(FHE.asEuint32(10_000), maxSlippagePpm);
        // Compute in 64-bit and return numerator scaled by 1e8.
        // discountedNumerator = amountIn * (1e4 - slippagePpm) * price
        euint64 discounted = FHE.mul(
            FHE.mul(FHE.asEuint64(amountIn32), FHE.asEuint64(factor32)),
            FHE.asEuint64(_priceBtoA)
        );

        _lastQuoteOut[msg.sender] = discounted;
        FHE.allowThis(discounted);
        FHE.allow(discounted, msg.sender);
        emit Quoted(msg.sender);
        return discounted;
    }

    /// @notice Expose last quote handle for decrypt in frontend
    function getLastQuoteHandle(address user) external view returns (euint64) {
        return _lastQuoteOut[user];
    }

    /// @notice Get price handles for read-only UI; decrypt requires ACL and is discouraged publicly.
    function getPrices() external view returns (euint32, euint32) {
        return (_priceAtoB, _priceBtoA);
    }
}


