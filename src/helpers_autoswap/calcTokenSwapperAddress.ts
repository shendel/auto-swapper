import getCreate2Address from '@/web3/getCreate2Address'
import Create2Deployer from '@/web3/Create2Deployer'
import TokenSwapperData from '@/abi/TokenSwapper.json'
import Web3 from 'web3'

const calcTokenSwapperAddress = (options) => {
  const {
    chainId,
    salt,
    owner
  } = options
  
  const web3 = new Web3()

  const saltHash = web3.utils.keccak256(salt)
  console.log('calcTokenSwapperAddress', TokenSwapperData.data.bytecode)
  return getCreate2Address({
    deployerAddress: Create2Deployer[chainId],
    salt: saltHash,
    bytecode: TokenSwapperData.data.bytecode.object,
    abi: TokenSwapperData.abi,
    args: [owner]
  })
}

export default calcTokenSwapperAddress