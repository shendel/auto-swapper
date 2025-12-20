import getCreate2Address from './getCreate2Address';
import calcSendArgWithFee from '@/helpers/calcSendArgWithFee'
import callContractMethod from '@/helpers/callContractMethod'

const deployContractViaCreate2 = (options) => {

  const {
    activeWeb3,
    bytecode,
    abi,
    constructorArgs = [],
    factoryAddress,
    salt,
    calcGas
  } = options;
  const onTrx = options.onTrx || (() => {})
  const onSuccess = options.onSuccess || (() => {})
  const onError = options.onError || (() => {})
  const onFinally = options.onFinally || (() => {})


  // Предвычисляем адрес контракта
  const predictedAddress = getCreate2Address({
    salt,
    bytecode,
    abi,
    args: constructorArgs,
    deployerAddress: factoryAddress,
    value: 0,
  });
    
  // Подготавливаем ABI фабрики
  const factoryAbi = [{
    "inputs": [
      { "name": "value", "type": "uint256" },
      { "name": "salt", "type": "bytes32" },
      { "name": "code", "type": "bytes" }
    ],
    "name": "deploy",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }];

  // Найдём конструктор и закодируем аргументы (для initCode)
  const constructorAbi = abi.find(item => item.type === 'constructor') || { inputs: [] };
  let encodedArgs = '0x';
  if (constructorAbi.inputs.length > 0) {
    const types = constructorAbi.inputs.map(input => input.type);
    encodedArgs = activeWeb3.eth.abi.encodeParameters(types, constructorArgs);
  }

  const initCode = bytecode.startsWith('0x')
    ? bytecode + (encodedArgs === '0x' ? '' : encodedArgs.slice(2))
    : '0x' + bytecode + (encodedArgs === '0x' ? '' : encodedArgs.slice(2));

  // Код вызова фабрики
  
  
  console.log('>>> salt', salt, encodedArgs)
  //console.log('>>> initCode', initCode)
  

  const factoryContract = new activeWeb3.eth.Contract(factoryAbi, factoryAddress);
  return callContractMethod({
    activeWeb3,
    contract: factoryContract,
    method: 'deploy',
    args: [
      0,
      salt,
      initCode,
    ],
    calcGas,
    onTrx,
    onSuccess,
    onError,
    onFinally
  })
};

export default deployContractViaCreate2;