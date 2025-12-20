import ContractJson from "@/abi/TokenSwapper.json"
import callContractMethod from '@/helpers/callContractMethod'

const initContract = (options) => {
  const {
    activeWeb3,
    address,
    weth,
    targetToken,
    routerV2,
    minAmountOut,
    calcGas,
    onTrx = (txHash) => {},
    onSuccess = () => {},
    onError = () => {},
    onFinally = () => {}
  } = options
  
  const contract = new activeWeb3.eth.Contract(ContractJson.abi, address)
  
  return callContractMethod({
    activeWeb3,
    contract,
    method: 'init',
    args: [
      weth,
      targetToken,
      routerV2,
      minAmountOut,
    ],
    calcGas,
    onTrx,
    onSuccess,
    onError,
    onFinally
  })
}


export default initContract