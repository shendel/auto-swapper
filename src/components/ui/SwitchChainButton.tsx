
import { GET_CHAIN_BYID } from '@/web3/chains'
import { useInjectedWeb3 } from '@/web3/InjectedWeb3Provider'
import {
  MAINNET_CHAIN_ID
} from '@/config'

const SwitchChainButton = (props) => {
  const {
    targetChainId = false
  } = props
  const {
    switchNetwork,
    isSwitchingNetwork
  } = useInjectedWeb3()
  const handleSwitch = () => {
    switchNetwork(targetChainId || MAINNET_CHAIN_ID)
  }
  
  const chainInfo = GET_CHAIN_BYID(targetChainId || MAINNET_CHAIN_ID)
  console.log('>>> chainInfo', targetChainId, chainInfo)
  console.log('>>> is switchin', isSwitchingNetwork)
  return (
    <button
      onClick={handleSwitch}
      className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg disabled:bg-gray-600 disabled:cursor-not-allowed transition duration-200 flex items-center justify-center space-x-2"
    >
      {/*
      {isSwitchingNetwork ? (
        <>
          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <span>{`Switching network...`}</span>
        </>
      ) : (
        <>{`Switch to "${chainInfo.name}"`}</>
      )}
      */}
      <>{`Switch to "${chainInfo.name}"`}</>
    </button>
  )
}


export default SwitchChainButton