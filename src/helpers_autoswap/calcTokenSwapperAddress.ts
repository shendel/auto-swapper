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
  
  return new Promise((resolve, reject) => {
    const artifactUrl = `./Contract.json`;
    console.log('... artifactUrl', artifactUrl)
    // 1. Загружаем артефакт через fetch (Promise)
    fetch(artifactUrl)
      .then(response => {
        console.log('>>> then', response)
        if (!response.ok) {
          reject(`Failed to load artifact: ${response.statusText}`);
        }
        return response.json();
      })
      .then(artifact => {
        console.log('>>> Fetched', artifact)
        console.log('calcTokenSwapperAddress', artifact.data.bytecode)
        const address = getCreate2Address({
          deployerAddress: Create2Deployer[chainId],
          salt: saltHash,
          bytecode: artifact.data.bytecode.object,
          abi: artifact.abi,
          args: [owner]
        })
        resolve(address)
      })
      .catch(err => {
        reject(new Error(`Deploy failed: ${err.message}`));
      });
  })
}

export default calcTokenSwapperAddress