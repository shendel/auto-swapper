// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

abstract contract ReentrancyGuard {
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;

    uint256 private _status;

    constructor() {
        _status = _NOT_ENTERED;
    }
    modifier nonReentrant() {
        _nonReentrantBefore();
        _;
        _nonReentrantAfter();
    }
    function _nonReentrantBefore() private {
        require(_status != _ENTERED, "ReentrancyGuard: reentrant call");
        _status = _ENTERED;
    }
    function _nonReentrantAfter() private {
        _status = _NOT_ENTERED;
    }
    function _reentrancyGuardEntered() internal view returns (bool) {
        return _status == _ENTERED;
    }
}

interface IERC20 {
    function name() external view returns (string memory);
    function symbol() external view returns (string memory);
    function decimals() external view returns (uint8);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 value) external returns (bool);
}

interface IUniswapV2Router {
    function getAmountsOut(uint256 amountIn, address[] memory path)
        external
        view
        returns (uint256[] memory amounts);

    function swapExactETHForTokens(
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external payable returns (uint256[] memory amounts);
}

// --- V3 Router Interface (from Uniswap V3 Periphery) ---
interface ISwapRouter {
    struct ExactInputSingleParams {
        address tokenIn;
        address tokenOut;
        uint24 fee;
        address recipient;
        uint256 deadline;
        uint256 amountIn;
        uint256 amountOutMinimum;
        uint160 sqrtPriceLimitX96;
    }

    function exactInputSingle(ExactInputSingleParams calldata params) external payable returns (uint256 amountOut);
}

interface IUniswapV3Quoter {
    function quoteExactInputSingle(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint24 fee,
        uint160 sqrtPriceLimitX96
    ) external returns (uint256 amountOut);
}

interface IUniswapV3Factory {
    function getPool(address tokenA, address tokenB, uint24 fee) external view returns (address);
}

interface IUniswapV3Pool {
    function slot0()
        external
        view
        returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked);
}

contract TokenSwapper is ReentrancyGuard  {
    enum DexVersion { V2, V3 }

    address public owner;
    address public targetToken;
    address public routerV2;
    address public routerV3;
    uint24 public v3PoolFee;
    DexVersion public dexVersion = DexVersion.V2;

    uint256 public minAmountOut;

    // Official Uniswap V3 Quoter (mainnet & many L2s)
    address public QUOTER;
    address public WETH;

    bool public inited = false;

    address public reciever;
    
    mapping(uint256 => address) public allowedTokens;
    mapping(address => bool) public allowedTokensExists;
    mapping(address => uint256) public allowedTokensIds;

    uint256 public allowedTokensCount;

    uint256 public totalEthIn = 0;
    uint256 public totalSwapOut = 0;

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }
    constructor(address _owner) {
        owner = _owner;
        reciever = _owner;
    }

    function init(
        address _weth,
        address _targetToken,
        address _routerV2,
        uint256 _minAmountOut
    ) public onlyOwner {
        require(inited == false, "Already inited");
        require(_weth != address(0), "Invalid wrapped address");
        require(_targetToken != address(0), "Invalid token");
        require(_routerV2 != address(0), "Invalid V2 router");
        require(_minAmountOut > 0, "Min amount out must be > 0");
        inited = true;
        WETH = _weth;
        targetToken = _targetToken;
        routerV2 = _routerV2;
        minAmountOut = _minAmountOut;
    }

    receive() external payable {
        if (inited) {
            totalEthIn += msg.value;
            trySwapIfProfitable();
            withdrawTokens();
        }
    }

    function trySwapIfProfitable() private nonReentrant {
        uint256 ethToUse = address(this).balance;
        if (ethToUse == 0) return;

        uint256 estimatedOut = dexVersion == DexVersion.V2
            ? _quoteV2(ethToUse)
            : _quoteV3(ethToUse);

        if (estimatedOut >= minAmountOut) {
            _performSwap(ethToUse);
        }
    }

    function withdrawTokens() public nonReentrant {
        uint256 tokenBalance = IERC20(targetToken).balanceOf(address(this));
        if (tokenBalance > 0) IERC20(targetToken).transfer(reciever, tokenBalance);
        if (allowedTokensCount > 0) {
            for (uint256 tokenId = 1; tokenId <= allowedTokensCount; tokenId++) {
                tokenBalance = IERC20(allowedTokens[tokenId]).balanceOf(address(this));
                if (tokenBalance > 0) {
                    IERC20(allowedTokens[tokenId]).transfer(reciever, tokenBalance);
                }
            }
        }
    }

    function _quoteV2(uint256 ethAmount) public view returns (uint256) {
        return getQuoteV2(ethAmount, _getWETH(), targetToken, routerV2);
    }
    function getQuoteV2(uint256 _ethAmount, address _weth, address _targetToken, address _routerV2) public view returns (uint256) {
        address[] memory path = new address[](2);
        path[0] = _weth;
        path[1] = _targetToken;
        uint256[] memory amounts = IUniswapV2Router(_routerV2).getAmountsOut(_ethAmount, path);
        return amounts[1];
    }
    function _quoteV3(uint256 ethAmount) public view returns (uint256) {
        return getQuoteV3(ethAmount, _getWETH(), targetToken, v3PoolFee, QUOTER);
    }
    function getQuoteV3(uint256 _ethAmount, address _weth, address _targetToken, uint256 _v3PoolFee, address _quoter) public view returns (uint256) {
        (bool success, bytes memory data) = _quoter.staticcall(
            abi.encodeWithSelector(
                IUniswapV3Quoter.quoteExactInputSingle.selector,
                _weth,
                _targetToken,
                _ethAmount,
                _v3PoolFee,
                uint160(0)
            )
        );

        if (success) {
            return abi.decode(data, (uint256));
        }
        return 0;
    }
    function _performSwap(uint256 ethAmount) internal returns (uint256) {
        require(ethAmount > 0, "No ETH to swap");
        uint256 balanceBefore = IERC20(targetToken).balanceOf(address(this));

        if (dexVersion == DexVersion.V2) {
            address[] memory path = new address[](2);
            path[0] = _getWETH();
            path[1] = targetToken;

            IUniswapV2Router(routerV2).swapExactETHForTokens{value: ethAmount}(
                minAmountOut,
                path,
                address(this),
                block.timestamp + 300
            );
        } else {
            ISwapRouter(routerV3).exactInputSingle{value: ethAmount}(
                ISwapRouter.ExactInputSingleParams(
                    _getWETH(),
                    targetToken,
                    v3PoolFee,
                    address(this),
                    block.timestamp + 300,
                    ethAmount,
                    minAmountOut,
                    0
                )
            );
        }

        uint256 tokenAmount = IERC20(targetToken).balanceOf(address(this)) - balanceBefore;
        totalSwapOut += tokenAmount;
        return tokenAmount;
    }

    function _getWETH() public view returns (address) {
        return WETH;
    }

    struct TokenInfo {
        uint256 tokenId;
        address tokenAddress;
        string  tokenSymbol;
        string  tokenName;
        uint8   tokenDecimals;
        uint256 balance;
    }
    function getAllowedTokens() public view returns (TokenInfo[] memory ret) {
        if (inited) {
            ret = new TokenInfo[](allowedTokensCount + 1);
            IERC20 baseToken = IERC20(targetToken);
            ret[0] = TokenInfo({
                tokenId: 0,
                tokenAddress: targetToken,
                tokenSymbol: baseToken.symbol(),
                tokenName: baseToken.name(),
                tokenDecimals: baseToken.decimals(),
                balance: baseToken.balanceOf(address(this))
            });
            if (allowedTokensCount > 0) {
                for (uint256 tokenId = 1; tokenId <= allowedTokensCount; tokenId++) {
                    IERC20 tokenInfo = IERC20(allowedTokens[tokenId]);
                    ret[tokenId] = TokenInfo({
                        tokenId: tokenId,
                        tokenAddress: allowedTokens[tokenId],
                        tokenSymbol: tokenInfo.symbol(),
                        tokenName: tokenInfo.name(),
                        tokenDecimals: tokenInfo.decimals(),
                        balance: tokenInfo.balanceOf(address(this))
                    });
                }
            }
        }
    }
    function addAllowedToken(address tokenAddress) public onlyOwner {
        if (!allowedTokensExists[tokenAddress]) {
            allowedTokensCount++;
            allowedTokens[allowedTokensCount] = tokenAddress;
            allowedTokensExists[tokenAddress] = true;
            allowedTokensIds[tokenAddress] = allowedTokensCount;
        }
    }
    function delAllowedToken(address tokenAddress) public onlyOwner {
        if (allowedTokensExists[tokenAddress]) {
            uint256 tokenId = allowedTokensIds[tokenAddress];
            allowedTokensIds[
                allowedTokens[allowedTokensCount]
            ] = tokenId;
            allowedTokens[tokenId] = allowedTokens[allowedTokensCount];
            allowedTokensExists[tokenAddress] = false;
            allowedTokensCount--;
        }
    }

    // --- Owner functions ---
    function setReciever(address newReciever) external onlyOwner {
        require(newReciever != address(0), "Cant be zero");
        reciever = newReciever;
    }
    function setMinAmountOut(uint256 _min) external onlyOwner {
        minAmountOut = _min;
    }
    function setWETH(address newWETH) external onlyOwner {
        WETH = newWETH;
    }
    function setTargetToken(address newTargetToken) external onlyOwner {
        require(newTargetToken != address(0), "Cant be zero");
        targetToken = newTargetToken;
    }
    function setRouterV2(address newRouterV2) external onlyOwner {
        require(newRouterV2 != address(0), "Cant be zero");
        routerV2 = newRouterV2;
    }
    function setDexVersion(DexVersion _version) external onlyOwner {
        dexVersion = _version;
    }
    function withdrawETH() external onlyOwner {
        payable(reciever).transfer(address(this).balance);
    }
    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0), "Cant be zero");
        owner = newOwner;
    }
    function recoveryToken(address tokenAddress) public onlyOwner {
        require(tokenAddress != targetToken && !allowedTokensExists[tokenAddress], "Cant recovery target or allowed token");
        IERC20 tokenInfo = IERC20(tokenAddress);
        if (tokenInfo.balanceOf(address(this)) > 0) {
            tokenInfo.transfer(owner, tokenInfo.balanceOf(address(this)));
        }
    }
    struct ContractInfo {
        bool inited;
        address owner;
        address targetToken;
        address routerV2;
        address routerV3;
        uint24 v3PoolFee;
        DexVersion dexVersion;

        uint256 minAmountOut;
        address QUOTER;
        address WETH;

        uint256 ethBalance;
        uint256 totalEthIn;
        uint256 totalSwapOut;
    }
    function getContractInfo() public view returns (ContractInfo memory) {
        return ContractInfo({
            inited: inited,
            owner: owner,
            targetToken: targetToken,
            routerV2: routerV2,
            routerV3: routerV3,
            v3PoolFee: v3PoolFee,
            dexVersion: dexVersion,

            minAmountOut: minAmountOut,
            QUOTER: QUOTER,
            WETH: WETH,

            ethBalance: address(this).balance,
            totalEthIn: totalEthIn,
            totalSwapOut: totalSwapOut
        });
    }
}