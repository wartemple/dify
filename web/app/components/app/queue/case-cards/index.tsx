'use client'
import type { FC } from 'react'
import React from 'react'
import { useContext } from 'use-context-selector'
import produce from 'immer'
import { useBoolean } from 'ahooks'
import DatasetConfig from '../../configuration/dataset-config'
import ChatGroup from '../../configuration/features/chat-group'
import ExperienceEnchanceGroup from '../../configuration/features/experience-enchance-group'
import Toolbox from '../../configuration/toolbox'
import type { AutomaticRes } from '../../configuration/config/automatic/get-automatic-res'
import GetAutomaticResModal from '../../configuration/config/automatic/get-automatic-res'
import ChooseFeature from '../../configuration/config/feature/choose-feature'
import useFeature from '../../configuration/config/feature/use-feature'
import ConfigContext from '@/context/debug-configuration'
import ConfigPrompt from '@/app/components/app/queue/config-prompt'
import ConfigVar from '@/app/components/app/configuration/config-var'
import type { PromptVariable } from '@/models/debug'
import { AppType } from '@/types/app'
import { useProviderContext } from '@/context/provider-context'
import Output from '@/app/components/app/queue/output'
import Loading from '@/app/components/base/loading'
import {
  PlusIcon, ChevronDoubleRightIcon
} from '@heroicons/react/24/solid'
import { fetchConvesationMessages, fetchSuggestedQuestions, sendChatMessage, sendCompletionMessage, stopChatMessageResponding } from '@/service/debug'
import { likePromptCase, delPromptCase, PatchPromptCase} from '@/service/prompt'
import type { PromptCase as TypePromptCase } from '@/types/app'
import { ToastContext } from '@/app/components/base/toast'
import { useTranslation } from 'react-i18next'

const PromptCaseCards = () => {
  const {
    appId,
    mode,
    modelConfig,
    setModelConfig,
    setPrevPromptConfig,
    inputs,
    promptCases,
    setpromptCases
  } = useContext(ConfigContext)
  const { t } = useTranslation()
  const { notify } = useContext(ToastContext)
  const [isResponsing, { setTrue: setResponsingTrue, setFalse: setResponsingFalse }] = useBoolean(false)
  const promptTemplate = modelConfig.configs.prompt_template
  const promptVariables = modelConfig.configs.prompt_variables
  const handlePromptChange = (newTemplate: string, key: string, newVariables: PromptVariable[]) => {
    PatchPromptCase(appId, key, { content: newTemplate })
    const newPromptCases = promptCases.map((item) => {
      if (item.id === key) {
        item.content = newTemplate
        item.model_config.pre_prompt = newTemplate
        return item
      } else {
        return item
      }
    })
    setpromptCases(newPromptCases)
  }
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

  const runCompletion = async (clickCase) => {
    if (isResponsing) {
      notify({ type: 'info', message: t('appDebug.errorMessage.waitForResponse') })
      return false
    }
    if (!checkCanSend())
      return
    setResponsingTrue()
    const res: string[] = []
    const data = {
      inputs,
      model_config: clickCase.model_config,
    }
    sendCompletionMessage(appId, data, {
      onData: (data: string) => {
        res.push(data)
        clickCase.result = res.join('')
      },
      onCompleted() {
        const newPromptCases = promptCases.map((item) => {
          if (item.id === clickCase.id) {
            item.result = clickCase.result
            item.loading = false
            return item
          } else {
            return item
          }
        })
        setpromptCases(newPromptCases)
        setResponsingFalse()
      },
      onError() {},
    })
    const newPromptCases = promptCases.map((item) => {
      if (item.id === clickCase.id) {
        item.loading = true
        return item
      } else {
        return item
      }
    })
    setpromptCases(newPromptCases)
  }

  const publishButtonClassname = (isLike: boolean) => {
    return  'w-[120px] inline-flex justify-center items-center content-center h-9 leading-5 rounded-lg px-4 py-2 text-base border-solid border border-gray-200 cursor-pointer text-gray-500  w-20 !h-8 !text-[13px]'
  }
  

  return (
    <>
      {promptCases.map((item, index) => (
        <div key={item.id} className="pb-[10px] flex grow pb-3 border-gray-400 bg-white rounded-xl py-6 border">
          {/* Template */}
          <div className="w-[574px] pr-10 pl-10 pb-5">
            <ConfigPrompt
              id={item.id}
              mode={mode as AppType}
              promptTemplate={item.content}
              promptVariables={promptVariables}
              onChange={handlePromptChange}
            />
            <div className=' flex item-center h-14 px-4'>
              <div className=' flex items-center justify-between w-full'>
                <div onClick={() => {runCompletion(item)}} className={publishButtonClassname(item.is_like)}>
                  单独运行
                </div>
                <div onClick={() => {
                    likePromptCase(appId, item.id)
                  }} className={publishButtonClassname(item.is_like)}>
                  更新为样例
                </div>
                <div onClick={() => {
                    setpromptCases(promptCases.filter(a => a.id !== item.id));
                    delPromptCase(appId, item.id)
                  }} className='w-[120px] bg-red-500  inline-flex justify-center items-center content-center h-9 leading-5 rounded-lg px-4 py-2 text-white border-solid border border-gray-200 cursor-pointer text-gray-500  w-20 !h-8 !text-[13px]'>
                  删除提示词
                </div>
              </div>
            </div>
          </div>
          <div className='pr-5 grow'>
            <div className="overflow-y-auto  bg-gray-50 flex-1 flex-col border border-gray-400 rounded-xl ">
              <div className='flex items-center h-11 pl-3 gap-1'>
                <div className='h2'>结果</div>
              </div>
              <div className='block-input w-full overflow-y-auto border-none rounded-lg'>
                <div className='h-[240px]  overflow-y-auto'>
                  <div className='h-full px-4 py-1'>
                    {item.loading ? (
                        <div className='flex items-center h-10'><Loading type='area' /></div>
                      ):(
                      <textarea value={item.result? item.result : ''} readOnly className=' focus:outline-none bg-transparent text-sm block w-full h-full absolut3e resize-none'>
                      </textarea>)
                    }
                  </div>
                </div>
              </div>
            </div>  
          </div>
        </div>
      ))}
      
    </>
  )
}
export default React.memo(PromptCaseCards)
