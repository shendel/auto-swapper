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
  const artifactUrl = `/Contract.json`;

  // 1. Загружаем артефакт через fetch (Promise)
  return fetch(artifactUrl)
    .then(response => {
      if (!response.ok) {
        throw new Error(`Failed to load artifact: ${response.statusText}`);
      }
      return response.json();
    })
    .then(artifact => {
      console.log('>>> Fetched on deploye', artifact)

      const web3 = new Web3()

      return deployContractViaCreate2({
        activeWeb3,
        bytecode: artifact.data.bytecode.object,
        abi: artifact.abi,
        constructorArgs: [owner],
        factoryAddress: Create2Deployer[chainId],
        salt: web3.utils.keccak256(salt)
      })
    })
    .catch(err => {
      return Promise.reject(new Error(`Deploy failed: ${err.message}`));
    });
}


export default deployTokenSwapper