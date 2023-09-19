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
import ConfigPrompt from '@/app/components/app/configuration/config-prompt'
import ConfigVar from '@/app/components/app/configuration/config-var'
import type { PromptVariable } from '@/models/debug'
import { AppType } from '@/types/app'
import { useProviderContext } from '@/context/provider-context'
import Output from '@/app/components/app/queue/results'

const Config: FC = () => {
  const {
    mode,
    introduction,
    setIntroduction,
    modelConfig,
    setModelConfig,
    setPrevPromptConfig,
    setFormattingChanged,
    moreLikeThisConfig,
    setMoreLikeThisConfig,
    suggestedQuestionsAfterAnswerConfig,
    setSuggestedQuestionsAfterAnswerConfig,
    speechToTextConfig,
    setSpeechToTextConfig,
    citationConfig,
    setCitationConfig,
  } = useContext(ConfigContext)
  const isChatApp = mode === AppType.chat
  const { speech2textDefaultModel } = useProviderContext()

  const promptTemplate = modelConfig.configs.prompt_template
  const promptVariables = modelConfig.configs.prompt_variables
  const handlePromptChange = (newTemplate: string, newVariables: PromptVariable[]) => {
    const newModelConfig = produce(modelConfig, (draft) => {
      draft.configs.prompt_template = newTemplate
      draft.configs.prompt_variables = [...draft.configs.prompt_variables, ...newVariables]
    })

    if (modelConfig.configs.prompt_template !== newTemplate)
      setFormattingChanged(true)

    setPrevPromptConfig(modelConfig.configs)
    setModelConfig(newModelConfig)
  }

  const handlePromptVariablesNameChange = (newVariables: PromptVariable[]) => {
    setPrevPromptConfig(modelConfig.configs)
    const newModelConfig = produce(modelConfig, (draft) => {
      draft.configs.prompt_variables = newVariables
    })
    setModelConfig(newModelConfig)
  }
  const promptCases = [
    {content: '你好'},
    {content: 'HEIHEI'},
    {content: 'hahah'},
  ]
  console.log(promptTemplate)

  return (
    <>
      {promptCases.map((item, index) => (
        <div className="pb-[10px] flex grow pb-3 border-gray-200 bg-white rounded-xl py-6">
          {/* Template */}
          <div className="w-[574px]">
            <ConfigPrompt
              mode={mode as AppType}
              promptTemplate={item.content}
              promptVariables={promptVariables}
              onChange={handlePromptChange}
            />
          </div>
          <div className="relative grow h-full overflow-y-auto  py-4 px-6 bg-gray-50 flex-1 flex-col">
            <Output />
          </div>  
        </div>
      ))}
      
    </>
  )
}
export default React.memo(Config)
