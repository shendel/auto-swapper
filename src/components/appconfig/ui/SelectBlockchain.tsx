import NETWORKS from '@/constants/NETWORKS'

const SelectBlockchain = (props) => {
  const {
    value,
    onChange,
    supportedChains = false
  } = props

  const chains = (supportedChains)
    ? Object.keys(NETWORKS).map((slug) => {
        return NETWORKS[slug]
      }).filter((info) => {
        return (supportedChains.indexOf(info.chainId) !== -1)
      })
    : Object.keys(NETWORKS).map((slug) => {
        return NETWORKS[slug]
      })
  const mainnetCount = chains.filter((chain) => { return !chain.testnet }).length;
  const testnetCount = chains.filter((chain) => { return chain.testnet }).length;
  
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
    >
      <option value="0">Select blockchain</option>
      {mainnetCount && (
        <optgroup label={`Mainnet`}>
          {chains.map((chain) => {
            if (!chain.testnet) {
              return (
                <option key={chain.chainId} value={chain.chainId}>{chain.name}</option>
              )
            }
          })}
        </optgroup>
      )}
      {testnetCount && (
        <optgroup label={`Testnet`}>
          {chains.map((chain) => {
            if (chain.testnet) {
              return (
                <option key={chain.chainId} value={chain.chainId}>{chain.name}</option>
              )
            }
          })}
        </optgroup>
      )}
    </select>
  )
}


export default SelectBlockchain