import React from 'react'
import cn from 'classnames'
import Forms from './forms'
import style from './page.module.css'

const Register_ = () => {
  return (
    <>
      <div className={cn(
        style.background,
        'flex w-full min-h-screen',
        'sm:p-4 lg:p-8',
        'gap-x-20',
        'justify-center lg:justify-start',
      )}>
        <div className={
          cn(
            'flex w-full flex-col bg-white shadow rounded-2xl shrink-0',
            'space-between',
          )
        }>
          <Forms />
        </div>

      </div>

    </>
  )
}

export default Register_
