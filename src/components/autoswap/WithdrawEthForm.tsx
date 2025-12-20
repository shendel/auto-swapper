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
import { GET_CHAIN_BYID } from '@/web3/chains'
import { fromWei } from '@/helpers/wei'



const WithdrawEthForm = (props) => {
  const {
    contractAddress,
    chainId,
    onChange = () => {},
    ethBalance,
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
  const chainInfo = GET_CHAIN_BYID(chainId)
  const [ isConfirming, setIsConfirming ] = useState(false)
  
  const handleClose = () => {
    closeModal('WITHDRAW_ETH_FORM')
  }

  const handleConfirm = () => {
    setIsConfirming(true)
    addNotification('info', 'Withdrawing. Confirm transaction')
    callTokenSwapperMethod({
      activeWeb3: injectedWeb3,
      address: contractAddress,
      method: 'withdrawETH',
      args: []
    }).then((answer) => {
      onChange()
      closeModal('WITHDRAW_ETH_FORM')
    }).catch((err) => {
      setIsConfirming(false)
      addNotification('error', 'Fail')
      console.log(err)
    })
  }

  
  return (
    <div>
      <div className="mb-2">
        <div className="text-center text-white">
          {`Withdraw `}
          <span className="font-bold">
            {fromWei(ethBalance)}{` `}{chainInfo.nativeCurrency.symbol}
          </span>
          {` from contract?`}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {injectedChainId != chainId ? (
          <SwitchChainButton targetChainId={chainId} />
        ) : (
          <Button
            onClick={handleConfirm}
            isDisabled={isConfirming}
            color={`green`}
          >
            {`Withdraw`}
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

export default WithdrawEthForm