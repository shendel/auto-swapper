import { createContext, useContext, useState, useEffect } from "react";
import SelectBlockchain from '@/components/appconfig/ui/SelectBlockchain'
import Label from '@/components/appconfig/ui/Label'
import Input from '@/components/appconfig/ui/Input'
import calcTokenSwapperAddress from '@/helpers_autoswap/calcTokenSwapperAddress'
import fetchSummary from '@/helpers_autoswap/fetchSummary'

import isContractDeployed from '@/web3/isContractDeployed'
import deployTokenSwapper from '@/helpers_autoswap/deployTokenSwapper'
import waitForTransactionMined from '@/web3/waitForTransactionMined'
import initContract from '@/helpers_autoswap/initContract'

import SwitchChainButton from '@/components/ui/SwitchChainButton'
import LoadingSplash from '@/components/LoadingSplash'
import InfoField from '@/components/appconfig/ui/InfoField'
import ErrorField from '@/components/appconfig/ui/ErrorField'

import Button from '@/components/appconfig/ui/Button'
import { useNotification } from "@/contexts/NotificationContext";
import { useConfirmationModal } from '@/components/ConfirmationModal'
import { getTransactionLink, getShortTxHash, getShortAddress, getAddressLink } from '@/helpers/etherscan'
import { useInjectedWeb3 } from '@/web3/InjectedWeb3Provider'
import { isValidEvmAddress } from '@/helpers/etherscan'

import InitContractForm from '@/components/autoswap/InitContractForm'

import { SUPPORTED_CHAINS } from '@/config'

const SelectContractContext = createContext({
  contractChainId: false,
  contractSalt: ``,
  contractAddress: false,
  contractInfo: false,
  contractInfoFetching: false,
  allowedTokens: [],
  isOwner: false,
  updateInfo: () => {}
});

// Хук для доступа к контексту
export const useSelectContract = () => {
  return useContext(SelectContractContext);
};

const SelectContract = (props) => {
  const { children } = props
  
  const { addNotification } = useNotification()
  
  const {
    injectedChainId,
    injectedAccount,
    injectedWeb3,
  } = useInjectedWeb3()
  
  const {
    openModal
  } = useConfirmationModal()

  const [ contractChainId, setContractChainId ] = useState(false)
  const [ contractAddress, setContractAddress ] = useState(``)
  
  const [ contractSalt, setContractSalt ] = useState('eneeseene-test')
  const [ contractOwner, setContractOwner ] = useState(``)

  const [ isDeployed, setIsDeployed ] = useState(false)
  const [ isDeployedFetch, setIsDeployedFetch ] = useState(false)
  const [ isDeployedUpdate, setIsDeployedUpdate ] = useState(false)

  useEffect(() => {
    if (injectedAccount) {
      setContractOwner(injectedAccount)
      if (contractInfo && (contractInfo.owner.toLowerCase() == injectedAccount.toLowerCase())) {
        setIsOwner(true)
      } else {
        setIsOwner(false)
      }
    }
  }, [ injectedAccount ])
  
  const [ contractOwnerError, setContractOwnerError ] = useState(false)
  useEffect(() => {
    setContractOwnerError(false)
    if (!isValidEvmAddress(contractOwner)) {
      setContractOwnerError(`Enter valid EVM address`)
      setContractInfo(false)
      setContractAddress(``)
    }
  }, [ contractOwner ])
  useEffect(() => {
    if (contractChainId && contractSalt && contractOwner && isValidEvmAddress(contractOwner) ) {
      try {
        const calcedContractAddress = calcTokenSwapperAddress({
          chainId: contractChainId,
          salt: contractSalt,
          owner: contractOwner
        })
        setIsDeployed(false)
        setContractAddress(calcedContractAddress)
        
        console.log('>> Address:', calcedContractAddress)
      } catch (err) {
        console.log('Fail calc address', err)
      }
    }
  }, [ contractChainId, contractSalt, contractOwner ])
  
  useEffect(() => {
    setIsDeployed(false)
    if ((contractChainId && contractAddress) || (isDeployedUpdate && contractChainId && contractSalt)) {
      setIsDeployedFetch(true)
      setIsDeployedUpdate(false)
      setAllowedTokens([])
      setContractInfo(false)
      console.log('>>> isDeployed update trigger')
      isContractDeployed({
        chainId: contractChainId,
        contractAddress
      }).then((isDeployed) => {
        console.log('>>> isDeployed', isDeployed)
        setIsDeployed(isDeployed)
        setIsDeployedFetch(false)
        if (isDeployed) setContractInfoUpdate(true)
      }).catch((err) => {
        console.log('fail fetch is deployed', err)
        setIsDeployedFetch(false)
      })
    }
  }, [ contractAddress, contractChainId, isDeployedUpdate ])

  const [ isDeploying, setIsDeploying ] = useState(false)

  const handleDeploy = () => {
    if (contractOwner.toLowerCase() != injectedAccount.toLowerCase()) {
      openModal({
        title: 'Warning!',
        fullWidth: true,
        isAlert: true,
        description: (
          <div className="text-red-500 text-bold">
            <div>{`The connected wallet differs from the one specified in the deployment parameters (Owner, used for initialization)!`}</div>
            <div>{`The contract address will be different from the generated one.`}</div>
          </div>
        )
      })
    } else {
      _deploy()
    }
    const _deploy = () => {
      setIsDeploying(true)
      addNotification('info', 'Confirm deploy transaction')
      deployTokenSwapper({
        activeWeb3: injectedWeb3,
        chainId: injectedChainId,
        salt: contractSalt,
        owner: injectedAccount,
      }).then((answer) => {
        const { transactionHash } = answer
        addNotification('success', `Deploy tx ${getShortTxHash(transactionHash)}`, getTransactionLink(injectedChainId, transactionHash))
        console.log('deploy answer', answer)
        waitForTransactionMined({
          chainId: injectedChainId,
          txHash: transactionHash
        }).then(() => {
          addNotification('success', 'Successfull mined!')
          setIsDeploying(false)
          setIsDeployedUpdate(true)
        }).catch(() => {
          addNotification('error', 'Deploy tx not mined. Update page for re-check')
          setIsDeploying(false)
          setIsDeployedUpdate(true)
        })
        
      }).catch((err) => {
        console.log('deploy error', err)
        addNotification('error', 'Fail deploy contract')
        setIsDeploying(false)
      })
    }
  }

  const [ contractInfo, setContractInfo ] = useState(false)
  const [ allowedTokens, setAllowedTokens ] = useState([])
  const [ contractInfoFetching, setContractInfoFetching ] = useState(false)
  const [ contractInfoUpdate, setContractInfoUpdate ] = useState(false)
  const [ isOwner, setIsOwner ] = useState(false)

  useEffect(() => {
    if ((contractAddress && contractChainId && isDeployed) || (contractInfoUpdate && contractAddress && contractChainId && isDeployed)) {
      setContractInfoUpdate(false)
      if (contractInfoFetching) return
      setContractInfoFetching(true)
      setAllowedTokens([])
      setContractInfo(false)
      addNotification('info', 'Fetching contract info')
      fetchSummary({
        address: contractAddress,
        chainId: contractChainId,
      }).then((answer) => {
        const {
          info,
          allowedTokens
        } = answer
        setContractInfo(info)
        setIsOwner(info.owner.toLowerCase() == injectedAccount.toLowerCase())
        setAllowedTokens(allowedTokens)
        setContractInfoFetching(false)
        console.log('>>> Contract Info', answer)
      }).catch((err) => {
        setContractInfoFetching(false)
        setContractInfo(false)
        setAllowedTokens([])
        addNotification('error', 'Fail fetch contract info')
        console.log('>> Fail fetch contract info', err)
      })
    }
  }, [ contractAddress, contractChainId, contractInfoUpdate, isDeployed ])

  const [ isIniting, setIsIniting ] = useState(false)
  const handleInitContract = (options) => {
    const {
      WETH,
      ROUTERV2,
      targetToken,
      minAmount,
    } = options
    setIsIniting(true)
    addNotification('info', 'Initialize contract. Confirm tx')
    console.log('handleInitContract', options)
    initContract({
      activeWeb3: injectedWeb3,
      address: contractAddress,
      weth: WETH,
      targetToken: targetToken,
      routerV2: ROUTERV2,
      minAmountOut: minAmount,
    }).then(({ transactionHash }) => {

      addNotification('success', `Initialize tx ${getShortTxHash(transactionHash)}`, getTransactionLink(contractChainId, transactionHash))
      waitForTransactionMined({
        chainId: contractChainId,
        txHash: transactionHash
      }).then(() => {
        addNotification('success', 'Contract succesfull initialized')
        setIsIniting(false)
        setContractInfoUpdate(true)
      }).catch((err) => {
        addNotification('error', 'Transaction may be not will be mined. Update page')
        setIsIniting(false)
      })

    }).catch((err) => {
      console.log('>>> Fail init', err)
      addNotification('error', 'Contract initialization failed')
      setIsIniting(false)
    })
  }
  return (
    <div>
      <InfoField>{`For generate the address of AutoSwap contract, a Unique key and the wallet address of the person who deployed and initialized the contract are used.`}</InfoField>
      <div className="grid md:grid-cols-2 gap-4 grid-cols-1">
        <div>
          <Label>{`Uniq contract key (salt used for generate address)`}</Label>
          <Input value={contractSalt} setValue={setContractSalt} />
        </div>
        <div>
          <Label>{`Owner, used for initialization`}</Label>
          <Input
            value={contractOwner}
            setValue={setContractOwner}
            error={contractOwnerError}
            errorMessage={contractOwnerError}
            hasLink={contractChainId && getAddressLink(contractChainId, contractOwner)}
            buttons={(
              <Button onClick={() => { setContractOwner(injectedAccount) }}>{`Use Connected Wallet`}</Button>
            )}
          />
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-4 grid-cols-1">
        <div>
          <Label>{`Select target blockchain`}</Label>
          <SelectBlockchain value={contractChainId} onChange={setContractChainId} supportedChains={SUPPORTED_CHAINS} />
        </div>
        <div>
          <Label>{`Calculated AutoSwap contract address`}</Label>
          <Input
            value={contractAddress}
            readOnly={true}
            setValue={setContractAddress}
            hasLink={getAddressLink(contractChainId, contractAddress)}
          />
        </div>
      </div>
      
      {(contractChainId && contractAddress) && (
        <div className="mt-2">
          {!isDeployed && (
            <>
              <InfoField>
                <span>AutoSwap contract for this blockchain not deployed</span>
              </InfoField>
              {(`${contractChainId}` == `${injectedChainId}`) ? (
                <>
                  {contractOwner.toLowerCase() != injectedAccount.toLowerCase() ? (
                    <ErrorField>
                      <div>{`The connected wallet differs from the one specified in the deployment parameters (Owner, used for initialization)!`}</div>
                      <div>{`The contract address will be different from the generated one.`}</div>
                      <div>{`For deploy set connected wallet as initialization owner`}</div>
                    </ErrorField>
                  ) : (
                    <Button
                      onClick={handleDeploy}
                      isDisabled={isDeploying}
                      isLoading={isDeploying}
                      fullWidth={true}
                    >
                      {`Deploy contract at this chain`}
                    </Button>
                  )}
                </>
              ) : (
                <SwitchChainButton targetChainId={contractChainId} />
              )}
            </>
          )}
        </div>
      )}
      {(contractInfo && !contractInfo.inited) && (
        <div>
          <InfoField>{`Contract not inited. Initialize it`}</InfoField>
          <InitContractForm chainId={contractChainId} contractAddress={contractAddress} onInit={handleInitContract} />
        </div>
      )}
      <SelectContractContext.Provider value={{
        contractChainId,
        contractSalt,
        contractAddress,
        contractInfo,
        allowedTokens,
        isOwner,
        updateInfo: () => { console.log('>>> updateInfo'); setContractInfoUpdate(true) },
      }}>
        <div>
          {(contractInfo && contractInfo.inited) && (
            <>
              {children}
            </>
          )}
        </div>
      </SelectContractContext.Provider>
      {(isDeployedFetch || isDeploying || isIniting) && (
        <LoadingSplash />
      )}
    </div>
  )
}

export default SelectContract

