import { useEffect, useState } from 'react'
import { useInjectedWeb3 } from '@/web3/InjectedWeb3Provider'
import { useConfirmationModal } from '@/components/ConfirmationModal'
import { useNotification } from "@/contexts/NotificationContext";
import { getTransactionLink, getShortTxHash } from '@/helpers/etherscan'
import { fromWei, toWei } from '@/helpers/wei'
import { isValidEvmAddress } from '@/helpers/etherscan'
import isContractDeployed from '@/web3/isContractDeployed'
import fetchTokenInfo from '@/helpers/fetchTokenInfo'

import BigNumber from "bignumber.js"
import Input from '@/components/appconfig/ui/Input'
import Label from '@/components/appconfig/ui/Label'
import Button from '@/components/appconfig/ui/Button'
import LoadingSplash from '@/components/LoadingSplash'
import SwitchChainButton from '@/components/ui/SwitchChainButton'

import addToken from '@/helpers_autoswap/addToken'
import setTargetToken from '@/helpers_autoswap/setTargetToken'



const AddTokenForm = (props) => {
  const {
    contractAddress,
    chainId,
    onAdded = () => {},
    changeTokenAddress = ``,
    isAddNew = false
  } = props

  const { addNotification } = useNotification()
  const { openModal, closeModal } = useConfirmationModal()
  const {
    isConnected,
    injectedWeb3,
    injectedAccount,
    injectedChainId,
    switchNetwork,
    isSwitchingNetwork,
  } = useInjectedWeb3()
  
  const [ isConfirming, setIsConfirming ] = useState(false)
  
  const handleClose = () => {
    closeModal('ADD_TOKEN_FORM')
  }

  const handleConfirm = () => {
    setIsConfirming(true)
    openModal({
      title: 'Confirm action',
      description: (isAddNew) ? 'Add new allowed token?' : 'Change target token?',
      onConfirm: () => {
        addNotification('info', 'Saving info. Confirm transaction')
        if (isAddNew) {
          addToken({
            activeWeb3: injectedWeb3,
            address: contractAddress,
            tokenAddress: tokenAddress,
          }).then((answer) => {
            onAdded()
            closeModal('ADD_TOKEN_FORM')
          }).catch((err) => {
            setIsConfirming(false)
            addNotification('error', 'Fail save changes to contract')
            console.log(err)
          })
        } else {
          setTargetToken({
            activeWeb3: injectedWeb3,
            address: contractAddress,
            tokenAddress: tokenAddress,
          }).then((answer) => {
            onAdded()
            closeModal('ADD_TOKEN_FORM')
          }).catch((err) => {
            setIsConfirming(false)
            addNotification('error', 'Fail save changes to contract')
            console.log(err)
          })
        }
      },
      onCancel: () => {
        setIsConfirming(false)
      }
    })
  }
 
  const [ tokenAddress, setTokenAddress ] = useState(changeTokenAddress)
  const [ tokenInfo, setTokenInfo ] = useState(false)
  const [ tokenInfoFetching, setTokenInfoFetching ] = useState(false)
  const [ tokenInfoError, setTokenInfoError ] = useState(false)
  
  useEffect(() => {
    handleFetchTokenInfo()
  }, [ tokenAddress ])
  
  const handleFetchTokenInfo = () => {
    if (tokenAddress != `` && isValidEvmAddress(tokenAddress)) {
      setTokenInfo(false)
      setTokenInfoFetching(true)
      fetchTokenInfo(tokenAddress, chainId).then((answer) => {
        console.log(answer)
        setTokenInfo(answer)
        setTokenInfoFetching(false)
      }).catch((err) => {
        console.log('>>> fail fetch token info')
        setTokenInfoFetching(false)
        setTokenInfoError(`Not valid ERC20 token. Fail fetch info`)
      })
    }
  }
  
  return (
    <div>
      <div className="mb-2">
        <Label>{`Token address`}</Label>
        <Input
          value={tokenAddress}
          setValue={setTokenAddress}
          error={tokenInfoError}
          errorMessage={tokenInfoError}
          buttons={(
            <Button onClick={handleFetchTokenInfo}>{`Fetch Info`}</Button>
          )}
        />
      </div>
      {tokenInfo && (
        <>
          <Label>{`Symbol: ${tokenInfo.symbol}`}</Label>
          <Label>{`Name: ${tokenInfo.name}`}</Label>
          <Label>{`Decimals: ${tokenInfo.decimals}`}</Label>
        </>
      )}
      <div className="grid grid-cols-2 gap-2">
        {injectedChainId != chainId ? (
          <SwitchChainButton targetChainId={chainId} />
        ) : (
          <Button
            onClick={handleConfirm}
            isDisabled={tokenInfoFetching || tokenInfoError || !tokenInfo || isConfirming}
            color={`green`}
          >
            {isAddNew ? `Add token` : `Change token`}
          </Button>
        )}
        <Button
          onClick={handleClose}
          color={`red`}
        >
          {`Close`}
        </Button>
      </div>
      {isConfirming && (
        <LoadingSplash />
      )}
    </div>
  );
}

export default AddTokenForm