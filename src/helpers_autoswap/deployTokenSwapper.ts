import Create2Deployer from '@/web3/Create2Deployer'
import TokenSwapperData from '@/abi/TokenSwapper.json'
import deployContractViaCreate2 from '@/web3/deployContractViaCreate2'
import Web3 from 'web3'

const deployTokenSwapper = (options) => {
  const {
    activeWeb3,
    chainId,
    salt,
    owner
  } = options
  
  const web3 = new Web3()
  
  return deployContractViaCreate2({
    activeWeb3,
    bytecode: TokenSwapperData.data.bytecode.object,
    abi: TokenSwapperData.abi,
    constructorArgs: [owner],
    factoryAddress: Create2Deployer[chainId],
    salt: web3.utils.keccak256(salt)
  })
}


export default deployTokenSwapper