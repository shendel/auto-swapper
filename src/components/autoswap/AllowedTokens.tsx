import React, { useState } from 'react';
import { fromWei } from '@/helpers/wei'
import { getAddressLink, getShortAddress } from '@/helpers/etherscan'
import InfoField from '@/components/appconfig/ui/InfoField'
import Label from '@/components/appconfig/ui/Label'
import Button from '@/components/appconfig/ui/Button'
import { useNotification } from "@/contexts/NotificationContext";
import { useConfirmationModal } from '@/components/ConfirmationModal'
import delToken from '@/helpers_autoswap/delToken'
import callTokenSwapperMethod from '@/helpers_autoswap/callTokenSwapperMethod'

import LoadingSplash from '@/components/LoadingSplash'
import AddTokenForm from '@/components/autoswap/AddTokenForm'
import ActionPanel from '@/components/appconfig/ui/ActionPanel'
import { useInjectedWeb3 } from '@/web3/InjectedWeb3Provider'
import BigNumber from "bignumber.js"

const AllowedTokens: React.FC<AdminPlayersTableProps> = (props) => {
  const {
    tokens,
    chainId,
    contractAddress,
    contractInfo,
    isOwner,
    updateInfo = () => {},
  } = props

  const handleChange = () => {
    openModal({
      title: `Edit target token`,
      hideBottomButtons: true,
      fullWidth: true,
      id: 'ADD_TOKEN_FORM',
      content: (
        <AddTokenForm
          chainId={chainId}
          contractAddress={contractAddress}
          changeTokenAddress={contractInfo.targetToken}
          isAddNew={false}
          onAdded={() => { updateInfo() }}
        />
      )
    })
  }
  
  const { openModal } = useConfirmationModal()
  const { addNotification } = useNotification()
  const { injectedWeb3 } = useInjectedWeb3()
  const [ isDelToken, setIsDelToken ] = useState(false)
  
  
  const handleAdd = () => {
    openModal({
      title: `Add new Allowed token`,
      hideBottomButtons: true,
      fullWidth: true,
      id: 'ADD_TOKEN_FORM',
      content: (
        <AddTokenForm
          chainId={chainId}
          contractAddress={contractAddress}
          isAddNew={true}
          onAdded={() => { updateInfo() }}
        />
      )
    })
  }
  
  const [ isWithdraw, setIsWithdraw ] = useState(false)
  
  const handleWithdrawTokens = () => {
    openModal({
      title: 'Confirm action',
      description: 'Withdraw all accomulated tokens?',
      onConfirm: () => {
        setIsWithdraw(true)
        addNotification('info', 'Withdraw tokens. Confirm transaction')
        callTokenSwapperMethod({
          activeWeb3: injectedWeb3,
          address: contractAddress,
          method: 'withdrawTokens'
        }).then(() => {
          updateInfo()
          setIsWithdraw(false)
          addNotification('success', 'Tokens withdrawed')
        }).catch((err) => {
          addNotification('error', 'Fail withdraw tokens')
          console.log(err)
          setIsWithdraw(false)
        })
      }
    })
  }
  const handleDel = (tokenId) => {
    const tokenInfo = tokens.find((token) => { return token.tokenId == tokenId })

    openModal({
      title: 'Delete allowed token',
      description: `Delete token ${tokenInfo.symbol} (${getShortAddress(tokenInfo.tokenAddress)})?`,
      onConfirm: () => {
        setIsDelToken(true)
        addNotification('info', 'Saving info. Confirm transaction')
        delToken({
          activeWeb3: injectedWeb3,
          address: contractAddress,
          tokenAddress: tokenInfo.tokenAddress,
        }).then((answer) => {
          updateInfo()
          setIsDelToken(false)
        }).catch((err) => {
          setIsDelToken(false)
          addNotification('error', 'Fail save changes to contract')
          console.log(err)
        })
      }
    })
  }

  const hasTokensForWithdraw = tokens.filter(({ balance }) => { return new BigNumber(balance).isGreaterThan(0) }).length != 0
  
  return (
    <>
      <Label>{`Allowed tokens:`}</Label>
      <div className="overflow-hidden rounded-lg shadow-md bg-gray-800 text-white">
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">
                  {`ID`}
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold">
                  {`Address`}
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold">
                  {`Symbol`}
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold">
                  {`Name`}
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold">
                  {`Decimals`}
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold">
                  {`Balance`}
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold">
                  {` `}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-600">
              {tokens.map((token, index) => {
                return (
                  <tr key={`${token.tokenAddress}-${token.tokenId}`}>
                    <td className="px-4 py-3 text-sm truncate max-w-xs">
                      {token.tokenId == '0' ? 'TARGET' : token.tokenId}
                    </td>
                    <td className="px-4 py-3 text-sm truncate max-w-xs">
                      <a href={getAddressLink(chainId, token.tokenAddress )}
                        target="_blank"
                        className="text-blue-300 cursor-pointer"
                      >
                        {getShortAddress(token.tokenAddress)}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-sm truncate max-w-xs">
                      {token.tokenSymbol}
                    </td>
                    <td className="px-4 py-3 text-sm truncate max-w-xs">
                      {token.tokenName}
                    </td>
                    <td className="px-4 py-3 text-sm truncate max-w-xs">
                      {token.tokenDecimals}
                    </td>
                    <td className="px-4 py-3 text-sm truncate max-w-xs">
                      {fromWei(token.balance, token.tokenDecimals)}
                    </td>
                    <td className="px-4 py-3 text-sm truncate max-w-xs">
                      {isOwner && (
                        <ActionPanel
                          canEdit={token.tokenId == `0`}
                          canDelete={token.tokenId != `0`}
                          onEdit={handleChange}
                          onDelete={() => { handleDel(token.tokenId) }}
                        />
                      )}
                    </td>
                  </tr>
                )
              })}

              {tokens.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-gray-400">
                    {`No Tokens`}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {isOwner && (
        <div className="grid grid-cols-2 gap-4 mt-2">
          <div>
            <Button fullWidth={true} onClick={handleWithdrawTokens} isDisabled={!hasTokensForWithdraw}>{`Withdraw tokens`}</Button>
          </div>
          <div>
            <Button fullWidth={true} onClick={handleAdd}>{`Add new allowed token`}</Button>
          </div>
        </div>
      )}
      {(isDelToken || isWithdraw) && (
        <LoadingSplash />
      )}
    </>
  );
};

export default AllowedTokens;