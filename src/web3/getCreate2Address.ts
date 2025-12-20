import Web3 from 'web3'

/**
 * Вычисляет CREATE2 адрес (аналог web3.utils.getCreate2Address)
 * @param {string} deployerAddress - адрес фабрики (20 байт, 0x...)
 * @param {string} salt - bytes32 (0x...)
 * @param {string} initCode - байткод + закодированные аргументы (0x...)
 * @returns {string} - адрес контракта (0x...)
 */
const _getCreate2Address = (deployerAddress, salt, initCode) => {
  const web3 = new Web3();

  // Убедимся, что всё без 0x
  const deployer = deployerAddress.toLowerCase().replace('0x', '');
  const saltHex = salt.toLowerCase().replace('0x', '');
  const initCodeClean = initCode.toLowerCase().replace('0x', '');

  // Хешируем ОЧИЩЕННЫЙ initCode
  const initCodeHash = web3.utils.keccak256('0x' + initCodeClean).replace('0x', '');

  const data = 'ff' + deployer + saltHex + initCodeHash;
  const fullHash = web3.utils.keccak256('0x' + data).replace('0x', '');
  const address = '0x' + fullHash.slice(-40);

  return web3.utils.toChecksumAddress(address);
}

/**
 * Вычисляет адрес контракта, который будет задеплоен через CREATE2
 * с использованием публичного deployer'а: 0x13b0D85CcB8bf860b6b79AF3029fCA081AE9beF2
 *
 * @param {string} salt - bytes32 в виде '0x...'
 * @param {string} bytecode - creation bytecode контракта, '0x...' (без аргументов)
 * @param {Array} abi - полный ABI контракта (или хотя бы часть с constructor)
 * @param {Array} args - аргументы для конструктора в порядке объявления
 * @returns {string} - предсказуемый адрес контракта (0x...)
 */
const getCreate2Address = (options) => {
  const {
    deployerAddress = '0x13b0D85CcB8bf860b6b79AF3029fCA081AE9beF2',
    salt,
    bytecode,
    abi,
    args,
    value = 0
  } = options
  
  const web3 = new Web3(); // не требует провайдера для offline-вычислений

  const constructorAbi = abi.find(item => item.type === 'constructor') || { inputs: [] };
  let encodedArgs = '0x';
  if (constructorAbi.inputs.length > 0) {
    const types = constructorAbi.inputs.map(input => input.type);
    encodedArgs = web3.eth.abi.encodeParameters(types, args);
  }

  const initCode = bytecode.startsWith('0x')
    ? bytecode + (encodedArgs === '0x' ? '' : encodedArgs.slice(2))
    : '0x' + bytecode + (encodedArgs === '0x' ? '' : encodedArgs.slice(2));

  
  // 4. Вычислить адрес через CREATE2
  console.log('>>>> CREATE2 _getCreate2Address', deployerAddress, salt, encodedArgs)
  const predictedAddress = _getCreate2Address(deployerAddress, salt, initCode);

  return web3.utils.toChecksumAddress(predictedAddress);
}

export default getCreate2Address