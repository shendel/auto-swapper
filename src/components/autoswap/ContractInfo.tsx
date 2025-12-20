import { useEffect, useState } from 'react'
import FaIcon from '@/components/FaIcon'
import Label from '@/components/appconfig/ui/Label'
import Input from '@/components/appconfig/ui/Input'
import Button from '@/components/appconfig/ui/Button'
import InfoField from '@/components/appconfig/ui/InfoField'
import ErrorField from '@/components/appconfig/ui/ErrorField'

import { useNotification } from "@/contexts/NotificationContext";
import { useConfirmationModal } from '@/components/ConfirmationModal'
import { useInjectedWeb3 } from '@/web3/InjectedWeb3Provider'
import LoadingSplash from '@/components/LoadingSplash'
import { fromWei } from '@/helpers/wei'
import { getAddressLink, getShortAddress } from '@/helpers/etherscan'
import { GET_CHAIN_BYID } from '@/web3/chains'
import BigNumber from "bignumber.js"
import ChangeRecieverForm from '@/components/autoswap/ChangeRecieverForm'
import ChangeOwnerForm from '@/components/autoswap/ChangeOwnerForm'
import ChangeMinAmountForm from '@/components/autoswap/ChangeMinAmountForm'
import WithdrawEthForm from '@/components/autoswap/WithdrawEthForm'

const ContractInfo = (props) => {
  const {
    chainId,
    contractAddress,
    updateInfo = () => {},
    contractInfo,
    isOwner,
    allowedTokens
  } = props
  
  const { openModal } = useConfirmationModal()
  const chainInfo = GET_CHAIN_BYID(chainId)
  const targetToken = allowedTokens.find(({ tokenId }) => { return tokenId == `0` })

  const handleChangeReciever = () => {
    openModal({
      title: `Change Reciever address`,
      hideBottomButtons: true,
      fullWidth: true,
      id: 'CHANGE_RECIEVER_FORM',
      content: (
        <ChangeRecieverForm
          chainId={chainId}
          contractAddress={contractAddress}
          recieverAddress={contractInfo.reciever}
          onChange={() => { updateInfo() }}
        />
      )
    })
  }
  const handleChangeOwner = () => {
    openModal({
      title: `Change Owner address`,
      hideBottomButtons: true,
      fullWidth: true,
      id: 'CHANGE_OWNER_FORM',
      content: (
        <ChangeOwnerForm
          chainId={chainId}
          contractAddress={contractAddress}
          ownerAddress={contractInfo.owner}
          onChange={() => { updateInfo() }}
        />
      )
    })
  }
  const handleChangeMinAmount = () => {
    openModal({
      title: `Change Min Amount for swap`,
      hideBottomButtons: true,
      fullWidth: true,
      id: 'CHANGE_MIN_AMOUNT_FORM',
      content: (
        <ChangeMinAmountForm
          chainId={chainId}
          contractAddress={contractAddress}
          minAmount={contractInfo.minAmountOut}
          tokenInfo={targetToken}
          onChange={() => { updateInfo() }}
        />
      )
    })
  }
  const handleWithdrawEth = () => {
    
    openModal({
      title: `Withdraw native currency`,
      hideBottomButtons: true,
      fullWidth: true,
      id: 'WITHDRAW_ETH_FORM',
      content: (
        <WithdrawEthForm
          chainId={chainId}
          contractAddress={contractAddress}
          ethBalance={contractInfo.ethBalance}
          onChange={() => { updateInfo() }}
        />
      )
    })
  }
  
  return (
    <div className="mt-6">
      <InfoField>{`Contract summary info`}</InfoField>
      {!isOwner && (
        <ErrorField>{`Connected wallet address is not ownership of contract. Read only mode`}</ErrorField>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>{`Contract owner:`}</Label>
          <Input
            value={contractInfo.owner}
            readOnly={true}
            hasLink={getAddressLink(chainId, contractInfo.owner)}
            buttons={(
              <Button onClick={handleChangeOwner} isDisabled={!isOwner}>
                <FaIcon icon="edit" />
              </Button>
            )}
          />
        </div>
        <div>
          <Label>{`Funds reciever:`}</Label>
          <Input
            value={contractInfo.reciever}
            readOnly={true}
            hasLink={getAddressLink(chainId, contractInfo.reciever)}
            buttons={(
              <Button onClick={handleChangeReciever} isDisabled={!isOwner}>
                <FaIcon icon="edit" />
              </Button>
            )}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>{`Min Amount for swap:`}</Label>
          <Input
            value={`${fromWei(contractInfo.minAmountOut, targetToken.tokenDecimals)} ${targetToken.tokenSymbol}`}
            readOnly={true}
            buttons={(
              <Button onClick={handleChangeMinAmount} isDisabled={!isOwner}>
                <FaIcon icon="edit" />
              </Button>
            )}
          />
        </div>
        <div>
          <Label>{`Native balance:`}</Label>
          <Input
            value={`${fromWei(contractInfo.ethBalance)} ${chainInfo.nativeCurrency.symbol}`}
            readOnly={true}
            buttons={(
              <Button
                onClick={handleWithdrawEth}
                isDisabled={(new BigNumber(contractInfo.ethBalance).isEqualTo(0)) || !isOwner}
              >
                {`Withdraw`}
              </Button>
            )}
          />
        </div>
      </div>
    </div>
  )
}


export default ContractInfo