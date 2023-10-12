'use client'
import type { FC } from 'react'
import { useTranslation } from 'react-i18next'
import React, { useEffect, useRef, useState } from 'react'
import produce from 'immer'
import { useBoolean, useGetState } from 'ahooks'
import { useContext } from 'use-context-selector'
import dayjs from 'dayjs'
import { AppType } from '@/types/app'
import PromptValuePanel, { replaceStringWithValues } from '@/app/components/app/queue/prompt-value-panel'
import type { IChatItem } from '@/app/components/app/chat/type'
import ConfigContext from '@/context/debug-configuration'
import { ToastContext } from '@/app/components/base/toast'
import { fetchConvesationMessages, fetchSuggestedQuestions, sendChatMessage, sendCompletionMessage, stopChatMessageResponding } from '@/service/debug'
import Button from '@/app/components/base/button'
import type { ModelConfig as BackendModelConfig } from '@/types/app'
import { promptVariablesToUserInputsForm } from '@/utils/model-config'
import TextGeneration from '@/app/components/app/text-generate/item'
import { IS_CE_EDITION } from '@/config'
import { useProviderContext } from '@/context/provider-context'

type IInputPanel = {
  hasSetAPIKEY: boolean
  onSetting: () => void
  sendTextCompletion?: () => void
}

const InputPanel: FC<IInputPanel> = ({
  hasSetAPIKEY = true,
  onSetting,
  sendTextCompletion,
}) => {
  const { t } = useTranslation()
  const {
    appId,
    mode,
    introduction,
    suggestedQuestionsAfterAnswerConfig,
    speechToTextConfig,
    citationConfig,
    moreLikeThisConfig,
    inputs,
    // setInputs,
    formattingChanged,
    setFormattingChanged,
    conversationId,
    setConversationId,
    controlClearChatMessage,
    dataSets,
    modelConfig,
    completionParams,
  } = useContext(ConfigContext)
  const { speech2textDefaultModel } = useProviderContext()
  const [chatList, setChatList, getChatList] = useGetState<IChatItem[]>([])
  const chatListDomRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    // scroll to bottom
    if (chatListDomRef.current)
      chatListDomRef.current.scrollTop = chatListDomRef.current.scrollHeight
  }, [chatList])

  const getIntroduction = () => replaceStringWithValues(introduction, modelConfig.configs.prompt_variables, inputs)
  useEffect(() => {
    if (introduction && !chatList.some(item => !item.isAnswer)) {
      setChatList([{
        id: `${Date.now()}`,
        content: getIntroduction(),
        isAnswer: true,
        isOpeningStatement: true,
      }])
    }
  }, [introduction, modelConfig.configs.prompt_variables, inputs])

  const [isResponsing, { setTrue: setResponsingTrue, setFalse: setResponsingFalse }] = useBoolean(false)
  const [abortController, setAbortController] = useState<AbortController | null>(null)
  const [isShowFormattingChangeConfirm, setIsShowFormattingChangeConfirm] = useState(false)
  const [isShowSuggestion, setIsShowSuggestion] = useState(false)
  const [messageTaskId, setMessageTaskId] = useState('')
  const [hasStopResponded, setHasStopResponded, getHasStopResponded] = useGetState(false)

  useEffect(() => {
    if (formattingChanged && chatList.some(item => !item.isAnswer))
      setIsShowFormattingChangeConfirm(true)

    setFormattingChanged(false)
  }, [formattingChanged])

  const clearConversation = async () => {
    setConversationId(null)
    abortController?.abort()
    setResponsingFalse()
    setChatList(introduction
      ? [{
        id: `${Date.now()}`,
        content: getIntroduction(),
        isAnswer: true,
        isOpeningStatement: true,
      }]
      : [])
    setIsShowSuggestion(false)
  }

  const handleConfirm = () => {
    clearConversation()
    setIsShowFormattingChangeConfirm(false)
  }

  const handleCancel = () => {
    setIsShowFormattingChangeConfirm(false)
  }

  const { notify } = useContext(ToastContext)
  const logError = (message: string) => {
    notify({ type: 'error', message })
  }

  const checkCanSend = () => {
    let hasEmptyInput = ''
    const requiredVars = modelConfig.configs.prompt_variables.filter(({ key, name, required }) => {
      const res = (!key || !key.trim()) || (!name || !name.trim()) || (required || required === undefined || required === null)
      return res
    }) // compatible with old version
    // debugger
    requiredVars.forEach(({ key, name }) => {
      if (hasEmptyInput)
        return

      if (!inputs[key])
        hasEmptyInput = name
    })

    if (hasEmptyInput) {
      logError(t('appDebug.errorMessage.valueOfVarRequired', { key: hasEmptyInput }))
      return false
    }
    return !hasEmptyInput
  }

  const doShowSuggestion = isShowSuggestion && !isResponsing
  const [suggestQuestions, setSuggestQuestions] = useState<string[]>([])

  useEffect(() => {
    if (controlClearChatMessage)
      setChatList([])
  }, [controlClearChatMessage])

  const [completionRes, setCompletionRes] = useState('')

  sendTextCompletion
  return (
    <>
      <div className="shrink-0">
        <div className='flex items-center justify-between mb-2'>
          {mode === 'chat' && (
            <Button className='flex items-center gap-1 !h-8 !bg-white' onClick={clearConversation}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2.66663 2.66629V5.99963H3.05463M3.05463 5.99963C3.49719 4.90505 4.29041 3.98823 5.30998 3.39287C6.32954 2.7975 7.51783 2.55724 8.68861 2.70972C9.85938 2.8622 10.9465 3.39882 11.7795 4.23548C12.6126 5.07213 13.1445 6.16154 13.292 7.33296M3.05463 5.99963H5.99996M13.3333 13.333V9.99963H12.946M12.946 9.99963C12.5028 11.0936 11.7093 12.0097 10.6898 12.6045C9.67038 13.1993 8.48245 13.4393 7.31203 13.2869C6.1416 13.1344 5.05476 12.5982 4.22165 11.7621C3.38854 10.926 2.8562 9.83726 2.70796 8.66629M12.946 9.99963H9.99996" stroke="#1C64F2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className='text-primary-600 text-[13px] font-semibold'>{t('common.operation.refresh')}</span>
            </Button>
          )}
        </div>
        <PromptValuePanel
          appType={mode as AppType}
          onSend={sendTextCompletion}
        />
      </div>
    </>
  )
}
export default React.memo(InputPanel)
