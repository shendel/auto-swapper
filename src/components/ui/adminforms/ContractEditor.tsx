import React, { useState } from 'react';
import { useInjectedWeb3 } from '@/web3/InjectedWeb3Provider'
import { useConfirmationModal } from '@/components/ConfirmationModal'
import { useNotification } from "@/contexts/NotificationContext";
import { getTransactionLink, getShortTxHash } from '@/helpers/etherscan'
import editContractValue from '@/helpers_deposits/editContractValue'
import SwitchChainButton from '@/components/ui/SwitchChainButton'

import {
  MAINNET_CHAIN_ID,
  CONTRACT
} from '@/config'

const ContractEditor = (props) => {
  const {
    currentValue,
    label = 'Min bet',
    description = 'Установите минимальную ставку:',
    isAddress = false,
    contractFunction = '',
    beforeSave = (value) => { return value },
    checkError = (value) => { return false },
    afterSave = () => {}
  } = props
  console.log('>>> currentValue', currentValue)
  const [ value, setValue ] = useState<string>(currentValue.toString());
  const [ isSaving, setIsSaving ] = useState<boolean>(false);
  const { openModal, closeModal } = useConfirmationModal()
  const { addNotification } = useNotification()
  const {
    injectedWeb3,
    injectedChainId
  } = useInjectedWeb3()
  
  const isWrongChain = (MAINNET_CHAIN_ID !== injectedChainId) ? true : false
  
  const handleCancel = () => {
    closeModal('EDIT_CONTRACT_VALUE')
  }
  
  const handleSave = () => {
    const hasError = checkError(value)
    if (!hasError) {
      const formatedValue = beforeSave(value)
      setIsSaving(true);
      editContractValue({
        activeWeb3: injectedWeb3,
        address: CONTRACT,
        func: contractFunction,
        value: formatedValue,
        onTrx: (txHash) => {
          addNotification('info', 'Saving transaction', getTransactionLink(MAINNET_CHAIN_ID, txHash), getShortTxHash(txHash))
        },
        onSuccess: (txInfo) => {
          addNotification('success', `Successfull saved`)
          afterSave()
          closeModal('EDIT_CONTRACT_VALUE')
        },
        onError: () => {}
      }).catch((err) => {
        addNotification('error', 'Fail save')
        setIsSaving(false);
      })
    } else {
      openModal({
        title: 'Incorect value',
        description: hasError,
        isAlert: true,
        okTitle: 'Ok'
      })
    }
  };

  return (
    <div>
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          {description}
        </label>
        {isAddress ? (
          <input
            type="string"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-white placeholder-gray-500"
          />
        ) : (
          <input
            type="number"
            min="0"
            step="any"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-white placeholder-gray-500"
          />
        )}
      </div>

      {/* Кнопки */}
      <div className="flex justify-between">
        {isWrongChain ? (
          <SwitchChainButton />
        ) : (
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition duration-200 ${
              isSaving ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {isSaving ? (
              <>
                <svg className="animate-spin h-5 w-5 mr-2 inline-block" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                {`Saving...`}
              </>
            ) : 'Save'}
          </button>
        )}

        <button
          onClick={handleCancel}
          disabled={isSaving}
          className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-gray-200 font-medium rounded-lg transition duration-200"
        >
          {`Cancel`}
        </button>
      </div>
    </div>
  );
};

export default ContractEditor;