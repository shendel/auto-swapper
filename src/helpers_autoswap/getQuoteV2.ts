import ContractJson from "@/abi/TokenSwapper.json"
import Web3 from 'web3'
import { Interface as AbiInterface } from '@ethersproject/abi'
import { GET_CHAIN_RPC } from '@/web3/chains'
import getMultiCall, { getMultiCallAddress, getMultiCallInterface }from '@/web3/getMultiCall'

import { callMulticall } from '@/helpers/callMulticall'
import Web3ObjectToArray from "@/helpers/Web3ObjectToArray"
import { fromWei } from '@/helpers/wei'

const getQuoteV2 = (options) => {
  const {
    address,
    chainId,
    ethAmount,
    weth,
    targetToken,
    routerV2
  } = {
    ...options
  }

  return new Promise((resolve, reject) => {
    const ContractAbi = ContractJson.abi

    const multicall = getMultiCall(chainId)
    const abiI = new AbiInterface(ContractAbi)

    callMulticall({
      multicall,
      target: address,
      encoder: abiI,
      calls: {
        outAmount: { func: 'getQuoteV2', args: [
          ethAmount,
          weth,
          targetToken,
          routerV2
        ]},
      }
    }).then((mcAnswer) => {
      
      resolve({
        chainId,
        address,
        ...mcAnswer,
      })
      console.log('>>> summary', mcAnswer)
    }).catch((err) => {
      console.log('>>> Fail fetch all info', err)
      reject(err)
    })
  })
}

export default getQuoteV2