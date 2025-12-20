import { useEffect, useState } from 'react'
import { useInjectedWeb3 } from '@/web3/InjectedWeb3Provider'
import { useConfirmationModal } from '@/components/ConfirmationModal'
import { useNotification } from "@/contexts/NotificationContext";
import { getTransactionLink, getShortTxHash } from '@/helpers/etherscan'
import { isValidEvmAddress } from '@/helpers/etherscan'


import BigNumber from "bignumber.js"
import Input from '@/components/appconfig/ui/Input'
import Label from '@/components/appconfig/ui/Label'
import Button from '@/components/appconfig/ui/Button'
import LoadingSplash from '@/components/LoadingSplash'
import SwitchChainButton from '@/components/ui/SwitchChainButton'

import callTokenSwapperMethod from '@/helpers_autoswap/callTokenSwapperMethod'

import { fromWei, toWei } from '@/helpers/wei'



const ChangeMinAmountForm = (props) => {
  const {
    contractAddress,
    chainId,
    onChange = () => {},
    minAmount = 0,
    tokenInfo = false
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
    closeModal('CHANGE_MIN_AMOUNT_FORM')
  }

  const handleConfirm = () => {
    setIsConfirming(true)

    openModal({
      title: 'Confirm action',
      description: 'Change Min Amount for swap?',
      onConfirm: () => {
        addNotification('info', 'Saving info. Confirm transaction')
        callTokenSwapperMethod({
          activeWeb3: injectedWeb3,
          address: contractAddress,
          method: 'setMinAmountOut',
          args: [ `0x` + new BigNumber(toWei(newMinAmount, tokenInfo.tokenDecimals)).toString(16)  ]
        }).then((answer) => {
          onChange()
          closeModal('CHANGE_MIN_AMOUNT_FORM')
        }).catch((err) => {
          setIsConfirming(false)
          addNotification('error', 'Fail save changes to contract')
          console.log(err)
        })
      },
      onCancel: () => {
        setIsConfirming(false)
      }
    })
  }
 
  const [ newMinAmount, setNewMinAmount ] = useState(fromWei(minAmount, tokenInfo.tokenDecimals))
  const [ newMinAmountError, setNewMinAmountError ] = useState(false)

  useEffect(() => {
    setNewMinAmountError(false)
    if (!(new BigNumber(toWei(newMinAmount, tokenInfo.tokenDecimals)).isGreaterThan(0))) {
      setNewMinAmountError(`Amount must be greater than zero`)
    }
  }, [ newMinAmount ] )
  
  return (
    <div>
      <div className="mb-2">
        <Label>{`New Min Amount for swap:`}</Label>
        <Input
          value={newMinAmount}
          type="number"
          setValue={setNewMinAmount}
          error={newMinAmountError}
          errorMessage={newMinAmountError}
          buttons={(
            <Label>{tokenInfo.tokenSymbol}</Label>
          )}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        {injectedChainId != chainId ? (
          <SwitchChainButton targetChainId={chainId} />
        ) : (
          <Button
            onClick={handleConfirm}
            isDisabled={newMinAmountError || isConfirming}
            color={`green`}
          >
            {`Change`}
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

export default ChangeMinAmountForm