// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IPyth} from "@pythnetwork/pyth-sdk-solidity/IPyth.sol";
import {PythStructs} from "@pythnetwork/pyth-sdk-solidity/PythStructs.sol";

/**
 * @title PythPriceConsumer
 * @notice Minimal multi-feed consumer wrapper for Pyth price feeds.
 *         Allows initializing a set of supported feed IDs, updating on-chain prices
 *         via posted price update data, and storing the last pulled price parameters.
 *
 *         Only the contract owner can register new supported feeds. Anyone can call
 *         update functions supplying the required Pyth price update data along with
 *         the exact fee returned by IPyth.getUpdateFee. Any excess msg.value is refunded.
 */
contract PythPriceConsumer {
    IPyth public immutable pyth;
    address public owner;

    // Track if a feedId is supported.
    mapping(bytes32 => bool) public supportedFeedIds;

    // Store last price & publish time pulled for a feed.
    struct StoredPriceData {
        int64 price;      // Mantissa
        int32 expo;       // Exponent (scale factor)
        uint publishTime; // Publish time returned by Pyth
    }

    mapping(bytes32 => StoredPriceData) public lastPriceData;

    event OwnerTransferred(address indexed previousOwner, address indexed newOwner);
    event FeedSupported(bytes32 indexed feedId);
    event FeedPriceUpdated(bytes32 indexed feedId, int64 price, int32 expo, uint publishTime);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor(address _pythAddress, bytes32[] memory initialFeedIds) {
        require(_pythAddress != address(0), "Pyth addr zero");
        pyth = IPyth(_pythAddress);
        owner = msg.sender;

        for (uint i = 0; i < initialFeedIds.length; i++) {
            supportedFeedIds[initialFeedIds[i]] = true;
            emit FeedSupported(initialFeedIds[i]);
        }
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "New owner zero");
        emit OwnerTransferred(owner, newOwner);
        owner = newOwner;
    }

    function addSupportedFeed(bytes32 feedId) external onlyOwner {
        require(!supportedFeedIds[feedId], "Already supported");
        supportedFeedIds[feedId] = true;
        emit FeedSupported(feedId);
    }

    /**
     * @notice Update a single feed using provided priceUpdateData and store latest price.
     * @param priceUpdateData Raw update messages for one or more feeds (Hermes response segments).
     * @param feedId Target feed ID to read after update.
     * @return price Mantissa value
     * @return expo  Exponent (scale factor)
     */
    function updateAndGetPrice(
        bytes[] calldata priceUpdateData,
        bytes32 feedId
    ) external payable returns (int64 price, int32 expo) {
        require(supportedFeedIds[feedId], "Feed not supported");

        uint fee = pyth.getUpdateFee(priceUpdateData);
        require(msg.value >= fee, "Insufficient fee");

        // Pay only the required fee to Pyth; refund any excess.
        pyth.updatePriceFeeds{value: fee}(priceUpdateData);
        if (msg.value > fee) {
            unchecked {
                payable(msg.sender).transfer(msg.value - fee);
            }
        }

        PythStructs.Price memory p = pyth.getPriceUnsafe(feedId);
        lastPriceData[feedId] = StoredPriceData(p.price, p.expo, p.publishTime);
        emit FeedPriceUpdated(feedId, p.price, p.expo, p.publishTime);
        return (p.price, p.expo);
    }

    /**
     * @notice Batch update and pull multiple feeds (return arrays).
     * @param priceUpdateData Raw update messages covering all desired feeds.
     * @param feedIds Array of feed IDs to fetch after update.
     */
    function updateAndGetMultiple(
        bytes[] calldata priceUpdateData,
        bytes32[] calldata feedIds
    ) external payable returns (int64[] memory prices, int32[] memory expos) {
        uint fee = pyth.getUpdateFee(priceUpdateData);
        require(msg.value >= fee, "Insufficient fee");
        pyth.updatePriceFeeds{value: fee}(priceUpdateData);
        if (msg.value > fee) {
            unchecked { payable(msg.sender).transfer(msg.value - fee); }
        }

        uint len = feedIds.length;
        prices = new int64[](len);
        expos = new int32[](len);
        for (uint i = 0; i < len; i++) {
            bytes32 fid = feedIds[i];
            require(supportedFeedIds[fid], "Unsupported feed");
            PythStructs.Price memory p = pyth.getPriceUnsafe(fid);
            lastPriceData[fid] = StoredPriceData(p.price, p.expo, p.publishTime);
            emit FeedPriceUpdated(fid, p.price, p.expo, p.publishTime);
            prices[i] = p.price;
            expos[i] = p.expo;
        }
        return (prices, expos);
    }

    /**
     * @notice Read stored price data without performing an update.
     */
    function getStoredPrice(bytes32 feedId) external view returns (StoredPriceData memory) {
        return lastPriceData[feedId];
    }
}
