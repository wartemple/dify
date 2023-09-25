'use client'
import type { FC } from 'react'
import { useTranslation } from 'react-i18next'
import React, { useEffect, useRef, useState } from 'react'
import cn from 'classnames'
import produce from 'immer'
import { useBoolean, useGetState } from 'ahooks'
import { useContext } from 'use-context-selector'
import dayjs from 'dayjs'
import FormattingChanged from '@/app/components/app/configuration//base/warning-mask/formatting-changed'
import GroupName from '@/app/components/app/configuration//base/group-name'
import { AppType } from '@/types/app'
import PromptValuePanel, { replaceStringWithValues } from '@/app/components/app/configuration/prompt-value-panel'
import type { IChatItem } from '@/app/components/app/chat/type'
import Chat from '@/app/components/app/chat'
import ConfigContext from '@/context/debug-configuration'
import { ToastContext } from '@/app/components/base/toast'
import { fetchConvesationMessages, fetchSuggestedQuestions, sendChatMessage, sendCompletionMessage, stopChatMessageResponding } from '@/service/debug'
import Button from '@/app/components/base/button'
import type { ModelConfig as BackendModelConfig } from '@/types/app'
import { promptVariablesToUserInputsForm } from '@/utils/model-config'
import TextGeneration from '@/app/components/app/text-generate/item'
import { IS_CE_EDITION } from '@/config'
import { useProviderContext } from '@/context/provider-context'

type IOutput = {

}

const Output: FC<IOutput> = ({}) => {
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
    // Outputger
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
  const onSend = async (message: string) => {
    if (isResponsing) {
      notify({ type: 'info', message: t('appDebug.errorMessage.waitForResponse') })
      return false
    }

    const postDatasets = dataSets.map(({ id }) => ({
      dataset: {
        enabled: true,
        id,
      },
    }))

    const postModelConfig: BackendModelConfig = {
      pre_prompt: modelConfig.configs.prompt_template,
      user_input_form: promptVariablesToUserInputsForm(modelConfig.configs.prompt_variables),
      opening_statement: introduction,
      more_like_this: {
        enabled: false,
      },
      suggested_questions_after_answer: suggestedQuestionsAfterAnswerConfig,
      speech_to_text: speechToTextConfig,
      retriever_resource: citationConfig,
      agent_mode: {
        enabled: true,
        tools: [...postDatasets],
      },
      model: {
        provider: modelConfig.provider,
        name: modelConfig.model_id,
        completion_params: completionParams as any,
      },
    }

    const data = {
      conversation_id: conversationId,
      inputs,
      query: message,
      model_config: postModelConfig,
    }

    // qustion
    const questionId = `question-${Date.now()}`
    const questionItem = {
      id: questionId,
      content: message,
      isAnswer: false,
    }

    const placeholderAnswerId = `answer-placeholder-${Date.now()}`
    const placeholderAnswerItem = {
      id: placeholderAnswerId,
      content: '',
      isAnswer: true,
    }

    const newList = [...getChatList(), questionItem, placeholderAnswerItem]
    setChatList(newList)

    // answer
    const responseItem: IChatItem = {
      id: `${Date.now()}`,
      content: '',
      isAnswer: true,
    }

    let _newConversationId: null | string = null

    setHasStopResponded(false)
    setResponsingTrue()
    setIsShowSuggestion(false)
    sendChatMessage(appId, data, {
      getAbortController: (abortController) => {
        setAbortController(abortController)
      },
      onData: (message: string, isFirstMessage: boolean, { conversationId: newConversationId, messageId, taskId }: any) => {
        responseItem.content = responseItem.content + message
        if (isFirstMessage && newConversationId) {
          setConversationId(newConversationId)
          _newConversationId = newConversationId
        }
        setMessageTaskId(taskId)
        if (messageId)
          responseItem.id = messageId

        // closesure new list is outdated.
        const newListWithAnswer = produce(
          getChatList().filter(item => item.id !== responseItem.id && item.id !== placeholderAnswerId),
          (draft) => {
            if (!draft.find(item => item.id === questionId))
              draft.push({ ...questionItem })

            draft.push({ ...responseItem })
          })
        setChatList(newListWithAnswer)
      },
      async onCompleted(hasError?: boolean) {
        setResponsingFalse()
        if (hasError)
          return

        if (_newConversationId) {
          const { data }: any = await fetchConvesationMessages(appId, _newConversationId as string)
          const newResponseItem = data.find((item: any) => item.id === responseItem.id)
          if (!newResponseItem)
            return

          setChatList(produce(getChatList(), (draft) => {
            const index = draft.findIndex(item => item.id === responseItem.id)
            if (index !== -1) {
              draft[index] = {
                ...draft[index],
                more: {
                  time: dayjs.unix(newResponseItem.created_at).format('hh:mm A'),
                  tokens: newResponseItem.answer_tokens + newResponseItem.message_tokens,
                  latency: newResponseItem.provider_response_latency.toFixed(2),
                },
              }
            }
          }))
        }
        if (suggestedQuestionsAfterAnswerConfig.enabled && !getHasStopResponded()) {
          const { data }: any = await fetchSuggestedQuestions(appId, responseItem.id)
          setSuggestQuestions(data)
          setIsShowSuggestion(true)
        }
      },
      onMessageEnd: (messageEnd) => {
        responseItem.citation = messageEnd.retriever_resources

        const newListWithAnswer = produce(
          getChatList().filter(item => item.id !== responseItem.id && item.id !== placeholderAnswerId),
          (draft) => {
            if (!draft.find(item => item.id === questionId))
              draft.push({ ...questionItem })

            draft.push({ ...responseItem })
          })
        setChatList(newListWithAnswer)
      },
      onError() {
        setResponsingFalse()
        // role back placeholder answer
        setChatList(produce(getChatList(), (draft) => {
          draft.splice(draft.findIndex(item => item.id === placeholderAnswerId), 1)
        }))
      },
    })
    return true
  }

  useEffect(() => {
    if (controlClearChatMessage)
      setChatList([])
  }, [controlClearChatMessage])

  const [completionRes, setCompletionRes] = useState('')

  const sendTextCompletion = async () => {
    if (isResponsing) {
      notify({ type: 'info', message: t('appDebug.errorMessage.waitForResponse') })
      return false
    }

    if (!checkCanSend())
      return

    const postDatasets = dataSets.map(({ id }) => ({
      dataset: {
        enabled: true,
        id,
      },
    }))

    const postModelConfig: BackendModelConfig = {
      pre_prompt: modelConfig.configs.prompt_template,
      user_input_form: promptVariablesToUserInputsForm(modelConfig.configs.prompt_variables),
      opening_statement: introduction,
      suggested_questions_after_answer: suggestedQuestionsAfterAnswerConfig,
      speech_to_text: speechToTextConfig,
      retriever_resource: citationConfig,
      more_like_this: moreLikeThisConfig,
      agent_mode: {
        enabled: true,
        tools: [...postDatasets],
      },
      model: {
        provider: modelConfig.provider,
        name: modelConfig.model_id,
        completion_params: completionParams as any,
      },
    }

    const data = {
      inputs,
      model_config: postModelConfig,
    }

    setCompletionRes('')
    const res: string[] = []

    setResponsingTrue()
    sendCompletionMessage(appId, data, {
      onData: (data: string) => {
        res.push(data)
        setCompletionRes(res.join(''))
      },
      onCompleted() {
        setResponsingFalse()
      },
      onError() {
        setResponsingFalse()
      },
    })
  }

  return (
    <>
      <div className="flex flex-col grow">
        {/* Text  Generation */}
        {mode === AppType.completion && (
          <div className="mt-6">
            <GroupName name={t('appDebug.result')} />
            {/* {提示词编排结果：生成多个} */}
            
          </div>
        )}
        {isShowFormattingChangeConfirm && (
          <FormattingChanged
            onConfirm={handleConfirm}
            onCancel={handleCancel}
          />
        )}
      </div>
    </>
  )
}
export default React.memo(Output)
