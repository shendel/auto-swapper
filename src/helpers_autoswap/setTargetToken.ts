import ContractJson from "@/abi/TokenSwapper.json"
import callContractMethod from '@/helpers/callContractMethod'

const setTargetToken = (options) => {
  const {
    activeWeb3,
    address,
    tokenAddress,
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
    method: 'setTargetToken',
    args: [
      tokenAddress
    ],
    calcGas,
    onTrx,
    onSuccess,
    onError,
    onFinally
  })
}


export default setTargetToken