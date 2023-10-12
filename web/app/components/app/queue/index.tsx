'use client'
import type { FC } from 'react'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useContext } from 'use-context-selector'
import { usePathname } from 'next/navigation'
import { useBoolean } from 'ahooks'
import Button from '../../base/button'
import Loading from '../../base/loading'
import type { CompletionParams, Inputs, ModelConfig, MoreLikeThisConfig, PromptConfig, PromptVariable } from '@/models/debug'
import type { DataSet } from '@/models/datasets'
import type { ModelConfig as BackendModelConfig, PromptCase } from '@/types/app'
import ConfigContext from '@/context/debug-configuration'
import PromptCaseCards from '@/app/components/app/queue/case-cards'
import { fetchConvesationMessages, fetchSuggestedQuestions, sendChatMessage, sendCompletionMessage, stopChatMessageResponding } from '@/service/debug'
import { PlusIcon, ChevronDoubleRightIcon } from '@heroicons/react/24/solid'
import { ProviderEnum } from '@/app/components/header/account-setting/model-page/declarations'
import type { AppDetailResponse } from '@/models/app'
import { ToastContext } from '@/app/components/base/toast'
import { fetchAppDetail, updateAppModelConfig } from '@/service/apps'
import { addPromptCase, likePromptCase, delPromptCase} from '@/service/prompt'
import { promptVariablesToUserInputsForm, userInputsFormToPromptVariables } from '@/utils/model-config'
import { fetchDatasets } from '@/service/datasets'
import { useProviderContext } from '@/context/provider-context'
import InputPanel from '@/app/components/app/queue/input-panel'


const PromptLab: FC = () => {
  const { t } = useTranslation()
  const { notify } = useContext(ToastContext)

  const [hasFetchedDetail, setHasFetchedDetail] = useState(false)
  const isLoading = !hasFetchedDetail
  const pathname = usePathname()
  const matched = pathname.match(/\/app\/([^/]+)/)
  const appId = (matched?.length && matched[1]) ? matched[1] : ''
  const [mode, setMode] = useState('')
  const [publishedConfig, setPublishedConfig] = useState<{
    modelConfig: ModelConfig
    completionParams: CompletionParams
  } | null>(null)

  const [conversationId, setConversationId] = useState<string | null>('')
  const [introduction, setIntroduction] = useState<string>('')
  const [controlClearChatMessage, setControlClearChatMessage] = useState(0)
  const [prevPromptConfig, setPrevPromptConfig] = useState<PromptConfig>({
    prompt_template: '',
    prompt_variables: [],
  })
  const [moreLikeThisConfig, setMoreLikeThisConfig] = useState<MoreLikeThisConfig>({
    enabled: false,
  })
  const [suggestedQuestionsAfterAnswerConfig, setSuggestedQuestionsAfterAnswerConfig] = useState<MoreLikeThisConfig>({
    enabled: false,
  })
  const [speechToTextConfig, setSpeechToTextConfig] = useState<MoreLikeThisConfig>({
    enabled: false,
  })
  const [citationConfig, setCitationConfig] = useState<MoreLikeThisConfig>({
    enabled: false,
  })
  const [formattingChanged, setFormattingChanged] = useState(false)
  const [inputs, setInputs] = useState<Inputs>({})
  const [query, setQuery] = useState('')
  const [completionParams, setCompletionParams] = useState<CompletionParams>({
    max_tokens: 16,
    temperature: 1, // 0-2
    top_p: 1,
    presence_penalty: 1, // -2-2
    frequency_penalty: 1, // -2-2
  })
  const [modelConfig, doSetModelConfig] = useState<ModelConfig>({
    provider: ProviderEnum.openai,
    model_id: 'gpt-3.5-turbo',
    configs: {
      prompt_template: '',
      prompt_variables: [] as PromptVariable[],
    },
    opening_statement: '',
    more_like_this: null,
    suggested_questions_after_answer: null,
    speech_to_text: null,
    retriever_resource: null,
    dataSets: [],
  })
  
  const setModelConfig = (newModelConfig: ModelConfig) => {
    doSetModelConfig(newModelConfig)
  }
  
  const [dataSets, setDataSets] = useState<DataSet[]>([])
  
  const [promptCases, setpromptCases] = useState<PromptCase[]>([])
  const syncToPublishedConfig = (_publishedConfig: any) => {
    const modelConfig = _publishedConfig.modelConfig
    setModelConfig(_publishedConfig.modelConfig)
    setCompletionParams(_publishedConfig.completionParams)
    setDataSets(modelConfig.dataSets || [])
    // feature
    setIntroduction(modelConfig.opening_statement)
    setMoreLikeThisConfig(modelConfig.more_like_this || {
      enabled: false,
    })
    setSuggestedQuestionsAfterAnswerConfig(modelConfig.suggested_questions_after_answer || {
      enabled: false,
    })
    setSpeechToTextConfig(modelConfig.speech_to_text || {
      enabled: false,
    })
    setCitationConfig(modelConfig.retriever_resource || {
      enabled: false,
    })
  }

  const { textGenerationModelList } = useProviderContext()
  const hasSetCustomAPIKEY = !!textGenerationModelList?.find(({ model_provider: provider }) => {
    if (provider.provider_type === 'system' && provider.quota_type === 'paid')
      return true

    if (provider.provider_type === 'custom')
      return true

    return false
  })
  const isTrailFinished = !hasSetCustomAPIKEY && textGenerationModelList
    .filter(({ model_provider: provider }) => provider.quota_type === 'trial')
    .every(({ model_provider: provider }) => {
      const { quota_used, quota_limit } = provider
      return quota_used === quota_limit
    })

  const hasSetAPIKEY = hasSetCustomAPIKEY || !isTrailFinished

  const [isShowSetAPIKey, { setTrue: showSetAPIKey, setFalse: hideSetAPIkey }] = useBoolean()
  const [isResponsing, { setTrue: setResponsingTrue, setFalse: setResponsingFalse }] = useBoolean(false)
  const postDatasets = dataSets.map(({ id }) => ({
    dataset: {
      enabled: true,
      id,
    },
  }))
  // 初始化数据
  useEffect(() => {
    (fetchAppDetail({ url: '/apps', id: appId }) as any).then(async (res: AppDetailResponse) => {
      setMode(res.mode)
      const modelConfig = res.model_config
      const model = res.model_config.model

      let datasets: any = null
      if (modelConfig.agent_mode?.enabled)
        datasets = modelConfig.agent_mode?.tools.filter(({ dataset }: any) => dataset?.enabled)

      if (dataSets && datasets?.length && datasets?.length > 0) {
        const { data: dataSetsWithDetail } = await fetchDatasets({ url: '/datasets', params: { page: 1, ids: datasets.map(({ dataset }: any) => dataset.id) } })
        datasets = dataSetsWithDetail
        setDataSets(datasets)
      }

      setIntroduction(modelConfig.opening_statement)
      if (modelConfig.more_like_this)
        setMoreLikeThisConfig(modelConfig.more_like_this)

      if (modelConfig.suggested_questions_after_answer)
        setSuggestedQuestionsAfterAnswerConfig(modelConfig.suggested_questions_after_answer)

      if (modelConfig.speech_to_text)
        setSpeechToTextConfig(modelConfig.speech_to_text)

      if (modelConfig.retriever_resource)
        setCitationConfig(modelConfig.retriever_resource)

      const config = {
        modelConfig: {
          provider: model.provider,
          model_id: model.name,
          configs: {
            prompt_template: modelConfig.pre_prompt,
            prompt_variables: userInputsFormToPromptVariables(modelConfig.user_input_form),
          },
          opening_statement: modelConfig.opening_statement,
          more_like_this: modelConfig.more_like_this,
          suggested_questions_after_answer: modelConfig.suggested_questions_after_answer,
          speech_to_text: modelConfig.speech_to_text,
          retriever_resource: modelConfig.retriever_resource,
          dataSets: datasets || [],
        },
        completionParams: model.completion_params,
      }
      syncToPublishedConfig(config)
      setPublishedConfig(config)

      setHasFetchedDetail(true)
      if (Array.isArray(res.prompts)) {
        const initPromptCase: PromptCase[]  = res.prompts.map(item => {
          item.result = ''
          item.model_config = {
            pre_prompt: item.content,
            user_input_form: modelConfig.user_input_form,
            opening_statement: introduction,
            suggested_questions_after_answer: suggestedQuestionsAfterAnswerConfig,
            speech_to_text: speechToTextConfig,
            retriever_resource: citationConfig,
            more_like_this: moreLikeThisConfig,
            agent_mode: {
              enabled: true,
              tools: [...postDatasets],
            },
            model: model
          }
          return item
        })
        setpromptCases(initPromptCase)
      }
    })
  }, [appId])

  const addPrompt = () => {
    addPromptCase(appId, { content: '{{query}}' }).then((res: PromptCase) => {
      const newPromptCase: PromptCase = {
        id: res.id,
        content: res.content,
        is_like: res.is_like,
        result: '',
        model_config: {
          pre_prompt: res.content,
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
          }
        }
      }
      setpromptCases([newPromptCase, ...promptCases])
    })
  }
  const AddRunButton = () => {
    return (
      <Button
        type="primary"
        onClick={addPrompt}
        className="w-[120px] !h-8">
        <PlusIcon className="shrink-0 w-4 h-4 mr-1" aria-hidden="true" />
        <span className='uppercase text-[13px]'>提示词样例</span>
      </Button>
    )
  }

  if (isLoading) {
    return <div className='flex h-full items-center justify-center'>
      <Loading type='area' />
    </div>
  }
  // 发送消息

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
  const sendData = async () => {
    if (isResponsing) {
      notify({ type: 'info', message: t('appDebug.errorMessage.waitForResponse') })
      return false
    }
    if (!checkCanSend())
      return
    setResponsingTrue()
    
    promptCases.map((item) => {
      const res: string[] = []
      const data = {
        inputs,
        model_config: item.model_config,
      }
      const result = sendCompletionMessage(appId, data, {
        onData: (data: string) => {
          res.push(data)
          item.result = res.join('')
        },
        onCompleted() {
          const newPromptCases = promptCases.map((prompt) => {
            if (prompt.id === item.id) {
              prompt.result = item.result
              return prompt
            } else {
              return prompt
            }
          })
          setpromptCases(newPromptCases)
        },
        onError() {
          setResponsingFalse()
        },
      })
      console.log(result)
    })
    setResponsingFalse()
    setpromptCases(promptCases)
  }
  
  return (
    <ConfigContext.Provider value={{
      appId,
      hasSetAPIKEY,
      isTrailFinished,
      mode,
      conversationId,
      introduction,
      setIntroduction,
      setConversationId,
      controlClearChatMessage,
      setControlClearChatMessage,
      prevPromptConfig,
      setPrevPromptConfig,
      moreLikeThisConfig,
      setMoreLikeThisConfig,
      suggestedQuestionsAfterAnswerConfig,
      setSuggestedQuestionsAfterAnswerConfig,
      speechToTextConfig,
      setSpeechToTextConfig,
      citationConfig,
      setCitationConfig,
      formattingChanged,
      setFormattingChanged,
      inputs,
      setInputs,
      query,
      setQuery,
      completionParams,
      setCompletionParams,
      modelConfig,
      setModelConfig,
      dataSets,
      setDataSets,
      promptCases,
      setpromptCases
    }}
    >
      <>
        <div className="flex flex-col h-full auto-cols-max">
          <div className='flex items-center justify-between px-6 border-b shrink-0 h-14 boder-gray-100'>
            <div className='text-xl text-gray-900'>{'提示词实验室'}</div>
            <AddRunButton></AddRunButton>
          </div>
          <div className="flex flex-col overflow-y-auto py-4 px-6 bg-gray-50 ">
            <InputPanel hasSetAPIKEY={hasSetAPIKEY} onSetting={showSetAPIKey} sendTextCompletion={sendData} />
          </div>
          <div className='flex flex-col grow h-[200px] '>
              <div className="shrink-0 h-full overflow-y-auto border-r border-gray-100 py-4 px-6 ">
                <PromptCaseCards />
              </div>
          </div>
        </div>
      </>
    </ConfigContext.Provider>
  )
}
export default React.memo(PromptLab)
