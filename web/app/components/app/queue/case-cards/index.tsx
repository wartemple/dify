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
import {
  PlusIcon, ChevronDoubleRightIcon
} from '@heroicons/react/24/solid'

import { likePromptCase, delPromptCase, PatchPromptCase} from '@/service/prompt'
import type { PromptCase as TypePromptCase } from '@/types/app'


type IPromptCaseCards = {
  promptCases: TypePromptCase[],
  setPromptCases: (promptCases: TypePromptCase[]) => void
}

const PromptCaseCards: FC<IPromptCaseCards> = ({
  promptCases,
  setPromptCases
}) => {
  const {
    appId,
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
  const response = '大家好，我叫XXX，今年XX岁，是一名小学生。我性格开朗、乐观向上，善良文静，热爱尝试新鲜事物。我在学习上成绩优秀，善于发现问题并善于寻找解决方案。擅长语文与数学，习惯独立思考，并善于发现事物异常现象，并能及时提出完善的解决方案。大家好，我叫XXX，今年XX岁，是一名小学生。我性格开朗、乐观向上，善良文静，热爱尝试新鲜事物。我在学习上成绩优秀，善于发现问题并善于寻找解决方案。擅长语文与数学，习惯独立思考，并善于发现事物异常现象，并能及时提出完善的解决方案。兴趣广泛，在精力充沛的日子里，我常常给自己闯荡不同环境的机会，一来健身，二来也能增加见识。除了学习之外，我也经常参加许多活动，包括参加学校跳舞队，帮助社区老人及低收入家庭等。积极参与、无私奉献，一方面帮助他人，另一方面也锻炼了自己的领导力及大家好，我叫XXX，今年XX岁，是一名小学生。我性格开朗、乐观向上，善良文静，热爱尝试新鲜事物。我在学习上成绩优秀，善于发现问题并善于寻找解决方案。擅长语文与数学，习惯独立思考，并善于发现事物异常现象，并能及时提出完善的解决方案。兴趣广泛，在精力充沛的日子里，我常常给自己闯荡不同环境的机会，一来健身，二来也能增加见识。除了学习之外，我也经常参加许多活动，包括参加学校跳舞队，帮助社区老人及低收入家庭等。积极参与、无私奉献，一方面帮助他人，另一方面也锻炼了自己的领导力及大家好，我叫XXX，今年XX岁，是一名小学生。我性格开朗、乐观向上，善良文静，热爱尝试新鲜事物。我在学习上成绩优秀，善于发现问题并善于寻找解决方案。擅长语文与数学，习惯独立思考，并善于发现事物异常现象，并能及时提出完善的解决方案。兴趣广泛，在精力充沛的日子里，我常常给自己闯荡不同环境的机会，一来健身，二来也能增加见识。除了学习之外，我也经常参加许多活动，包括参加学校跳舞队，帮助社区老人及低收入家庭等。积极参与、无私奉献，一方面帮助他人，另一方面也锻炼了自己的领导力及大家好，我叫XXX，今年XX岁，是一名小学生。我性格开朗、乐观向上，善良文静，热爱尝试新鲜事物。我在学习上成绩优秀，善于发现问题并善于寻找解决方案。擅长语文与数学，习惯独立思考，并善于发现事物异常现象，并能及时提出完善的解决方案。兴趣广泛，在精力充沛的日子里，我常常给自己闯荡不同环境的机会，一来健身，二来也能增加见识。除了学习之外，我也经常参加许多活动，包括参加学校跳舞队，帮助社区老人及低收入家庭等。积极参与、无私奉献，一方面帮助他人，另一方面也锻炼了自己的领导力及兴趣广泛，在精力充沛的日子里，我常常给自己闯荡不同环境的机会，一来健身，二来也能增加见识。除了学习之外，我也经常参加许多活动，包括参加学校跳舞队，帮助社区老人及低收入家庭等。积极参与、无私奉献，一方面帮助他人，另一方面也锻炼了自己的领导力及'

  const promptTemplate = modelConfig.configs.prompt_template
  const promptVariables = modelConfig.configs.prompt_variables
  const handlePromptChange = (newTemplate: string, key: string, newVariables: PromptVariable[]) => {
    PatchPromptCase(appId, key, { content: newTemplate })
  }

  const handlePromptVariablesNameChange = (newVariables: PromptVariable[]) => {
    setPrevPromptConfig(modelConfig.configs)
    const newModelConfig = produce(modelConfig, (draft) => {
      draft.configs.prompt_variables = newVariables
    })
    setModelConfig(newModelConfig)
  }
  const publishButtonClassname = (isLike: boolean) => {
    if (isLike) {
      return 'bg-orange-500 inline-flex text-white justify-center items-center content-center h-9 leading-5 rounded-lg px-4 py-2 text-base border-solid border border-gray-200 cursor-pointer text-gray-500  w-20 !h-8 !text-[13px]'
    } else {
      return  'inline-flex justify-center items-center content-center h-9 leading-5 rounded-lg px-4 py-2 text-base border-solid border border-gray-200 cursor-pointer text-gray-500  w-20 !h-8 !text-[13px]'
    }
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
          </div>
          <div className='pr-5 grow'>
            <div className="overflow-y-auto  bg-gray-50 flex-1 flex-col border border-gray-400 rounded-xl ">
              <div className='flex items-center h-11 pl-3 gap-1'>
                <div className='h2'>结果</div>
              </div>
              <div className='block-input w-full overflow-y-auto border-none rounded-lg'>
                <div className='h-[180px]  overflow-y-auto'>
                  <div className='h-full px-4 py-1'>
                    <textarea value={response} className=' focus:outline-none bg-transparent text-sm block w-full h-full absolut3e resize-none'>
                      
                    </textarea>
                  </div>
                </div>
                <div className=' flex item-center h-14 px-4'>
                  <div className=' flex items-center justify-between w-full'>
                    <div onClick={() => {
                        likePromptCase(appId, item.id)
                      }} className={publishButtonClassname(item.is_like)}>
                      发布
                    </div>
                    <div onClick={() => {
                        setPromptCases(promptCases.filter(a => a.id !== item.id));
                        delPromptCase(appId, item.id)
                      }} className='w-[120px] bg-red-500  inline-flex justify-center items-center content-center h-9 leading-5 rounded-lg px-4 py-2 text-white border-solid border border-gray-200 cursor-pointer text-gray-500  w-20 !h-8 !text-[13px]'>
                      删除提示词
                    </div>
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
