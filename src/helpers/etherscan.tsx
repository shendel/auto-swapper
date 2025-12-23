import { GET_CHAIN_BYID } from '@/web3/chains'

export const getTransactionLink = (chainId, txHash) => {
  if (!txHash) return ``
  const chainInfo = GET_CHAIN_BYID(chainId)
  if (!chainInfo) return ``
  return `${chainInfo.explorer}${(chainInfo.explorer.slice(-1) == '/') ? '' : '/'}tx/${txHash}`
}

export const getAddressLink = (chainId, address) => {
  if (!address) return ``
  const chainInfo = GET_CHAIN_BYID(chainId)
  if (!chainInfo) return ``
  return `${chainInfo.explorer}${(chainInfo.explorer.slice(-1) == '/') ? '' : '/'}address/${address}`
}

export const getBlockLink = (chainId, blockNumber) => {
  if (!blockNumber) return ``
  const chainInfo = GET_CHAIN_BYID(chainId)
  if (!chainInfo) return ``
  return `${chainInfo.explorer}${(chainInfo.explorer.slice(-1) == '/') ? '' : '/'}block/${blockNumber}`
}
export const getShortAddress = (walletAddress, size = 4) => {
  if (!walletAddress) return ``
  return `${walletAddress.slice(0, size + 2)}...${walletAddress.slice(-size)}`
}

export const getShortTxHash = (txHash) => {
  if (!txHash) return ``
  return `${txHash.slice(0,8)}...${txHash.slice(-8)}`
}

export const isValidEvmAddress = (value) => {
  return typeof value === 'string' && /^0x[A-Fa-f0-9]{40}$/.test(value)
}