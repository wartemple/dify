import Datasets from './Datasets'
import { getLocaleOnServer } from '@/i18n/server'
import { useTranslation } from '@/i18n/i18next-serverside-config'
import DatasetFooter from './DatasetFooter'

const AppList = async () => {
  return (
    <div className='flex flex-col overflow-auto bg-gray-100 shrink-0 grow'>
      <Datasets />
      {/* <DatasetFooter /> */}
    </div >
  )
}

export const metadata = {
  title: 'Datasets - 大模型应用平台',
}

export default AppList
