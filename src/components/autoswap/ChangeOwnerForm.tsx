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




const ChangeOwnerForm = (props) => {
  const {
    contractAddress,
    chainId,
    onChange = () => {},
    ownerAddress = ``,
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
    closeModal('CHANGE_OWNER_FORM')
  }

  const handleConfirm = () => {
    setIsConfirming(true)
    openModal({
      title: 'Confirm action',
      description: 'Change Owner address?',
      onConfirm: () => {
        addNotification('info', 'Saving info. Confirm transaction')
        callTokenSwapperMethod({
          activeWeb3: injectedWeb3,
          address: contractAddress,
          method: 'transferOwnership',
          args: [ newOwnerAddress ]
        }).then((answer) => {
          onChange()
          closeModal('CHANGE_OWNER_FORM')
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
 
  const [ newOwnerAddress, setNewOwnerAddress ] = useState(ownerAddress)
  const [ newOwnerAddressError, setNewOwnerAddressError ] = useState(false)

  useEffect(() => {
    setNewOwnerAddressError(false)
    if (newOwnerAddress && !isValidEvmAddress(newOwnerAddress)) {
      setNewOwnerAddressError(`Set valid EVM address`)
    }
  }, [ newOwnerAddress ] )
  
  return (
    <div>
      <div className="mb-2">
        <Label>{`New Owner address`}</Label>
        <Input
          value={newOwnerAddress}
          setValue={setNewOwnerAddress}
          error={newOwnerAddressError}
          errorMessage={newOwnerAddressError}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        {injectedChainId != chainId ? (
          <SwitchChainButton targetChainId={chainId} />
        ) : (
          <Button
            onClick={handleConfirm}
            isDisabled={newOwnerAddressError || isConfirming}
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

export default ChangeOwnerForm