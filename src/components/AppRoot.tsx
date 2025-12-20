import { useState, useEffect } from 'react'

import Web3Connector from '@/web3/Web3Connector'
import InjectedWeb3Provider from '@/web3/InjectedWeb3Provider'

import ConfirmationModal from "./ConfirmationModal";
import NotificationProvider from "@/contexts/NotificationContext"
import MarkDownProvider from '@/contexts/MarkDownContext'

import NETWORKS from '@/constants/NETWORKS'
import {
  SUPPORTED_CHAINS,
} from '@/config'

const allChainIds = Object.keys(NETWORKS).map((slug) => {
  return NETWORKS[slug].chainId
})

export default function AppRoot(props) {
  const {
    children,
  } = props

  const chainId = SUPPORTED_CHAINS

  return (
    <>
      <MarkDownProvider>
        <NotificationProvider>
          <Web3Connector chainIds={chainId} autoConnect={true}>
            <InjectedWeb3Provider chainId={chainId[0]} chainIds={chainId}>
              <ConfirmationModal>
                {children}
              </ConfirmationModal>
            </InjectedWeb3Provider>
          </Web3Connector>
        </NotificationProvider>
      </MarkDownProvider>
    </>
  )
}