import Web3 from 'web3';
import { GET_CHAIN_RPC } from '@/web3/chains';

const waitForTransactionMined = async (options) => {
  const { activeWeb3, chainId, txHash, maxTimeoutMs = 120000, waitBlocks = 5 } = options;

  if (!txHash) {
    throw new Error('txHash is required');
  }

  let web3;
  if (activeWeb3) {
    web3 = activeWeb3;
  } else if (chainId) {
    const rpcUrl = GET_CHAIN_RPC(chainId);
    if (!rpcUrl) {
      throw new Error(`RPC URL not found for chainId: ${chainId}`);
    }
    web3 = new Web3(new Web3.providers.HttpProvider(rpcUrl));
  } else {
    throw new Error('Either activeWeb3 or chainId must be provided');
  }

  const startTime = Date.now();
  let receipt = null;

  // Шаг 1: Ждём майнинга транзакции
  while (Date.now() - startTime < maxTimeoutMs) {
    receipt = await web3.eth.getTransactionReceipt(txHash);
    if (receipt && receipt.blockNumber !== null) {
      console.log(`✅ Tx ${txHash} is mined in block ${receipt.blockNumber}`);
      break;
    }
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  if (!receipt || receipt.blockNumber === null) {
    throw new Error(`Transaction ${txHash} not mined in ${maxTimeoutMs / 1000} sec`);
  }

  // Шаг 2: Если нужно — ждём N дополнительных блоков
  if (waitBlocks > 0) {
    const targetBlock = receipt.blockNumber + waitBlocks;
    console.log(`⏳ Waiting for ${waitBlocks} more blocks (until block ${targetBlock})...`);

    while (Date.now() - startTime < maxTimeoutMs) {
      const currentBlock = await web3.eth.getBlockNumber();
      if (currentBlock >= targetBlock) {
        console.log(`✅ Reached block ${currentBlock}, continuing...`);
        break;
      }
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    if (await web3.eth.getBlockNumber() < targetBlock) {
      throw new Error(`Did not reach block ${targetBlock} within timeout`);
    }
  }

  return receipt;
};

export default waitForTransactionMined;