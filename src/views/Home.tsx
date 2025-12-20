
import { useEffect, useState, Component } from "react"

import { useInjectedWeb3 } from '@/web3/InjectedWeb3Provider'
import ConnectWalletButton from '@/components/ConnectWalletButton'
import LoadingPlaceholder from '@/components/LoadingPlaceholder'
import { useSelectContract } from '@/components/autoswap/SelectContract'
import AllowedTokens from '@/components/autoswap/AllowedTokens'
import ContractInfo from '@/components/autoswap/ContractInfo'

export default function Home(props) {
  const {
    gotoPage,
    params,
    on404
  } = props

  const {
    isConnected,
    injectedAccount
  } = useInjectedWeb3()

  const {
    contractChainId,
    contractSalt,
    contractAddress,
    contractInfo,
    contractInfoFetching,
    allowedTokens,
    isOwner,
    updateInfo,
  } = useSelectContract()
  /* --- */

  console.log('>>> Home contractInfo', contractInfo, allowedTokens)
  return (
    <>
      <ContractInfo
        chainId={contractChainId}
        contractAddress={contractAddress}
        updateInfo={updateInfo}
        contractInfo={contractInfo}
        allowedTokens={allowedTokens}
        isOwner={isOwner}
      />
      <AllowedTokens
        tokens={allowedTokens}
        chainId={contractChainId}
        contractAddress={contractAddress}
        updateInfo={updateInfo}
        contractInfo={contractInfo}
        isOwner={isOwner}
      />
    </>
  )
}
