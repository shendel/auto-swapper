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




const ChangeRecieverForm = (props) => {
  const {
    contractAddress,
    chainId,
    onChange = () => {},
    recieverAddress = ``,
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
    closeModal('CHANGE_RECIEVER_FORM')
  }

  const handleConfirm = () => {
    setIsConfirming(true)
    openModal({
      title: 'Confirm action',
      description: 'Change Reciever address?',
      onConfirm: () => {
        addNotification('info', 'Saving info. Confirm transaction')
        callTokenSwapperMethod({
          activeWeb3: injectedWeb3,
          address: contractAddress,
          method: 'setReciever',
          args: [ newRecieverAddress ]
        }).then((answer) => {
          onChange()
          closeModal('CHANGE_RECIEVER_FORM')
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
 
  const [ newRecieverAddress, setNewRecieverAddress ] = useState(recieverAddress)
  const [ newRecieverAddressError, setNewRecieverAddressError ] = useState(false)

  useEffect(() => {
    setNewRecieverAddressError(false)
    if (newRecieverAddress && !isValidEvmAddress(newRecieverAddress)) {
      setNewRecieverAddressError(`Set valid EVM address`)
    }
  }, [ newRecieverAddress ] )
  
  return (
    <div>
      <div className="mb-2">
        <Label>{`New Reciever address`}</Label>
        <Input
          value={newRecieverAddress}
          setValue={setNewRecieverAddress}
          error={newRecieverAddressError}
          errorMessage={newRecieverAddressError}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        {injectedChainId != chainId ? (
          <SwitchChainButton targetChainId={chainId} />
        ) : (
          <Button
            onClick={handleConfirm}
            isDisabled={newRecieverAddressError || isConfirming}
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

export default ChangeRecieverForm