import { useState, useEffect } from 'react'
import DexInfo from '@/helpers_autoswap/DexInfo'
import Label from '@/components/appconfig/ui/Label'
import Select from '@/components/appconfig/ui/Select'
import Input from '@/components/appconfig/ui/Input'
import Button from '@/components/appconfig/ui/Button'
import InfoField from '@/components/appconfig/ui/InfoField'
import CollapsibleGroup from '@/components/appconfig/ui/CollapsibleGroup'

import { isValidEvmAddress, getAddressLink } from '@/helpers/etherscan'
import { useNotification } from "@/contexts/NotificationContext";
import { useConfirmationModal } from '@/components/ConfirmationModal'
import isContractDeployed from '@/web3/isContractDeployed'
import fetchTokenInfo from '@/helpers/fetchTokenInfo'
import getQuoteV2 from '@/helpers_autoswap/getQuoteV2'
import LoadingSplash from '@/components/LoadingSplash'
import { fromWei, toWei } from '@/helpers/wei'
import { GET_CHAIN_BYID } from '@/web3/chains'
import SwitchChainButton from '@/components/ui/SwitchChainButton'
import { useInjectedWeb3 } from '@/web3/InjectedWeb3Provider'
import BigNumber from "bignumber.js"

const InitContractForm = (props) => {
  const {
    chainId,
    contractAddress,
    onInit = () => {}
  } = props
  
  const {
    injectedChainId
  } = useInjectedWeb3()
  const { addNotification } = useNotification()
  
  const [ initDexSlug, setInitDexSlug ] = useState('')
  const [ dexWETH, setDexWETH ] = useState(``)
  const [ dexWETHError, setDexWETHError ] = useState(false)
  
  const [ dexRouterV2, setDexRouterV2 ] = useState(``)
  const [ dexRouterV2Error, setDexRouterV2Error ] = useState(false)
  

  const [ initMinAmount, setInitMinAmount ] = useState(1)
  const [ initMinAmountError, setInitMinAmountError ] = useState(false)
  
  useEffect(() => {
    setInitMinAmountError(false)
    if ((Number(initMinAmount) < 0) || (initMinAmount == ``)) {
      setInitMinAmountError(`Cant be less than zero`)
    }
  }, [ initMinAmount ])

  useEffect(() => {
    setDexRouterV2Error(false)
    if (dexRouterV2) {
      if (!isValidEvmAddress(dexRouterV2)) {
        return setDexRouterV2Error(`Enter valid EVM address of RouterV2`)
      }
      isContractDeployed({
        chainId,
        contractAddress: dexRouterV2
      }).then((isContract) => {
        if (!isContract) setDexRouterV2Error(`Address of RouterV2 not contract`)
      }).catch((err) => {
        setDexRouterV2Error(`Address of RouterV2 not contract`)
      })
    }
  }, [ dexRouterV2 ])
  
  useEffect(() => {
    setDexWETHError(false)
    if (dexWETH) {
      if (!isValidEvmAddress(dexWETH)) {
        return setDexWETHError(`Enter valid EVM address of WETH`)
      }
      isContractDeployed({
        chainId,
        contractAddress: dexWETH
      }).then((isContract) => {
        if (!isContract) setDexWETHError(`Address of WETH not contract`)
      }).catch((err) => {
        setDexWETHError(`Address of WETH not contract`)
      })
    }
  }, [ dexWETH ])
  // 0xe45Fe733bC8617FA6Dac8437Fc44B5ffFA949991
  const [ initTargetToken, setInitTargetToken ] = useState(`0xe45Fe733bC8617FA6Dac8437Fc44B5ffFA949991`)
  const [ initTargetTokenError, setInitTargetTokenError ] = useState(false)
  const [ initTargetTokenInfo, setInitTargetTokenInfo ] = useState(false)
  const [ initTargetTokenInfoFetching, setInitTargetTokenInfoFetching ] = useState(false)
  useEffect(() => {
    setInitTargetTokenError(false)
    setInitTargetTokenInfo(false)
    if (initTargetToken) {
      if (!isValidEvmAddress(initTargetToken)) {
        return setInitTargetTokenError(`Enter valid EVM address`)
      }
      isContractDeployed({
        chainId,
        contractAddress: initTargetToken
      }).then((isContract) => {
        if (!isContract) setInitTargetTokenError(`Address not contract`)
      }).catch((err) => {
        setInitTargetTokenError(`Address not contract`)
      })
    }
  }, [ initTargetToken ])
  
  useEffect(() => {
    if (initDexSlug != ``) {
      setDexWETH(DexInfo[initDexSlug].WETH)
      setDexRouterV2(DexInfo[initDexSlug].ROUTERV2)
    }
  }, [ initDexSlug ])
  
  const handleFetchTokenInfo = () => {
    setInitTargetTokenInfo(false)
    setInitTargetTokenInfoFetching(true)
    addNotification('info', 'Fetching token info')
    fetchTokenInfo(initTargetToken, chainId).then((answer) => {
      console.log(answer)
      setInitTargetTokenInfo(answer)
      setInitTargetTokenInfoFetching(false)

      addNotification('success', 'Info about token fetched')
    }).catch((err) => {
      console.log('>>> fail fetch token info')
      setInitTargetTokenError(`Not valid ERC20 token. Fail fetch info`)
      setInitTargetTokenInfoFetching(false)
    })
  }
  
  const handleSubmit = () => {
    onInit({
      WETH: dexWETH,
      ROUTERV2: dexRouterV2,
      targetToken: initTargetToken,
      minAmount: `0x` + new BigNumber(toWei(initMinAmount, initTargetTokenInfo.decimals)).toString(16),
    })
  }
  
  const [ simEthAmount, setSimEthAmount ] = useState(0)
  const [ simAmountOut, setSimAmountOut ] = useState(0)
  
  const [ isSimulate, setIsSimulate ] = useState(false)
  const handleSimulate = () => {
    setIsSimulate(true)
    addNotification('info', 'Simulate...')
    getQuoteV2({
      chainId,
      address: contractAddress,
      ethAmount: `0x` + new BigNumber(toWei(simEthAmount)).toString(16),
      weth: dexWETH,
      targetToken: initTargetToken,
      routerV2: dexRouterV2,
    }).then(({ outAmount }) => {
      addNotification('success', 'Simulated!')
      setSimAmountOut(fromWei(outAmount, initTargetTokenInfo.decimals))
      setIsSimulate(false)
    }).catch((err) => {
      addNotification('error', 'Fail simulate. Check - addresses is valid contracts?')
      setIsSimulate(false)
    })
  }
  
  const chainInfo = GET_CHAIN_BYID(chainId)
  
  const isAllowSubmit = (
    dexWETHError 
    || dexRouterV2Error 
    || initTargetTokenError 
    || initMinAmountError 
    || !initTargetTokenInfo
    || !isValidEvmAddress(dexRouterV2)
    || !isValidEvmAddress(dexWETH)
    || !isValidEvmAddress(initTargetToken)
  )
  
  return (
    <>
      <Label>{`Predefined Dex:`}</Label>
      <Select value={initDexSlug} setValue={setInitDexSlug}>
        <option value={``}>{`Custom`}</option>
        {Object.keys(DexInfo).map((slug) => {
          if (`${DexInfo[slug].chainId}` == `${chainId}`) {
            return (
              <option key={slug} value={slug}>{DexInfo[slug].name}</option>
            )
          }
          return null
        })}
      </Select>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>{`WETH address (0x...):`}</Label>
          <Input
            readOnly={(initDexSlug != ``)}
            value={(initDexSlug == ``) ? dexWETH : DexInfo[initDexSlug].WETH} setValue={setDexWETH}
            error={dexWETHError}
            errorMessage={dexWETHError}
            hasLink={getAddressLink(chainId, (initDexSlug == ``) ? dexWETH : DexInfo[initDexSlug].WETH)}
          />
        </div>
        <div>
          <Label>{`RouterV2 address (0x...):`}</Label>
          <Input
            readOnly={(initDexSlug != ``)}
            value={(initDexSlug == ``) ? dexRouterV2 : DexInfo[initDexSlug].ROUTERV2}
            setValue={setDexRouterV2}
            error={dexRouterV2Error}
            errorMessage={dexRouterV2Error}
            hasLink={getAddressLink(chainId, (initDexSlug == ``) ? dexRouterV2 : DexInfo[initDexSlug].ROUTERV2)}
          />
        </div>
      </div>
      <Label>{`Target token for swap (0x...):`}</Label>
      <Input
        value={initTargetToken}
        setValue={setInitTargetToken}
        error={initTargetTokenError}
        errorMessage={initTargetTokenError}
        hasLink={getAddressLink(chainId, initTargetToken)}
        buttons={(
          <Button onClick={handleFetchTokenInfo}>{`Fetch token info`}</Button>
        )}
      />
      {initTargetTokenInfo && (
        <>
          <Label>{`Token Symbol: ${initTargetTokenInfo.symbol}`}</Label>
          <Label>{`Token Name: ${initTargetTokenInfo.name}`}</Label>
          <Label>{`Token decimals: ${initTargetTokenInfo.decimals}`}</Label>
          <InfoField>
            <span>{`Minimum about of ${initTargetTokenInfo.symbol} needs recieve when contract got native ${chainInfo.nativeCurrency.symbol})`}</span>
            <br />
            <span>{`If calculated token amount is less than Min Amount - Native currency will be acumulated at contract`}</span>
            <br />
            <span>{`At next recieve of native token - will be re-calc`}</span>
            <br />
            <span>{`Also you can withdraw native coins, with will not converted to tokens, from contract every time`}</span>
          </InfoField>
          <Label>{`Minumum amount of token to Swap:`}</Label>
          <Input
            value={initMinAmount}
            setValue={setInitMinAmount}
            type="number"
            error={initMinAmountError}
            errorMessage={initMinAmountError}
            buttons={(
              <Label>{initTargetTokenInfo.symbol}</Label>
            )}
          />
        </>
      )}
      {isValidEvmAddress(dexWETH) && isValidEvmAddress(dexRouterV2) && initTargetTokenInfo && (
        <CollapsibleGroup title={`Simulate auto swap`}>
          <>
            <div className="grid-cols-1 md:grid-cols-2 grid gap-4">
              <div>
                <Label>{`Amount of ${chainInfo.nativeCurrency.symbol} sent to contract:`}</Label>
                <Input
                  type="number"
                  value={simEthAmount}
                  setValue={setSimEthAmount}
                  buttons={(
                    <Label>{chainInfo.nativeCurrency.symbol}</Label>
                  )}
                />
              </div>
              <div>
                <Label>{`Amount of ${initTargetTokenInfo.symbol} will be recieved`}</Label>
                <Input
                  type="number"
                  readOnly={true}
                  value={simAmountOut}
                  setValue={setSimAmountOut}
                  buttons={(
                    <Label>{initTargetTokenInfo.symbol}</Label>
                  )}
                />
              </div>
            </div>
            <div className="mt-2">
              <Button fullWidth={true} onClick={handleSimulate}>{`Calculate the target amount of tokens`}</Button>
            </div>
          </>
        </CollapsibleGroup>
      )}
      <div className="mt-2">
        {(`${chainId}` != `${injectedChainId}`) ? (
          <SwitchChainButton targetChainId={chainId} />
        ) : (
          <Button fullWidth={true} isDisabled={isAllowSubmit} onClick={handleSubmit}>{`Init Contract`}</Button>
        )}
      </div>
      {initTargetTokenInfoFetching || isSimulate && (
        <LoadingSplash />
      )}
    </>
  )
}

export default InitContractForm