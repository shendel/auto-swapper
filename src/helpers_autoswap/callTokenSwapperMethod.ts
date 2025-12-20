import ContractJson from "@/abi/TokenSwapper.json"
import callContractMethod from '@/helpers/callContractMethod'

const callTokenSwapperMethod = (options) => {
  const {
    activeWeb3,
    address,
    method,
    args = [],
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
    method,
    args,
    calcGas,
    onTrx,
    onSuccess,
    onError,
    onFinally
  })
}


export default callTokenSwapperMethod