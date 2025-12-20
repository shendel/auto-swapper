import Web3 from 'web3';
import { GET_CHAIN_RPC } from '@/web3/chains';

const isContractDeployed = (options) => {
  const { chainId, contractAddress } = options;

  if (!chainId || !contractAddress) {
    return Promise.reject(new Error('chainId and contractAddress are required'));
  }

  const rpcUrl = GET_CHAIN_RPC(chainId);
  if (!rpcUrl) {
    return Promise.reject(new Error(`RPC URL not found for chainId: ${chainId}`));
  }

  const web3 = new Web3(new Web3.providers.HttpProvider(rpcUrl));

  return web3.eth.getCode(contractAddress)
    .then((code) => code !== '0x')
    .catch((error) => {
      return Promise.reject(new Error(`Failed to check contract code: ${error.message}`));
    });
};

export default isContractDeployed;