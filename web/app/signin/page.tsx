"use client"

import React from 'react'
import cn from 'classnames'
import Forms from './forms'
import style from './page.module.css'
import { useCallback, useEffect, useRef, useState } from 'react'


const SignIn = () => {
  // const [currUrl, setCurrUrl] = useState("")
  // useEffect(() => {
  //   const currUrl = location.href
  //   setCurrUrl(currUrl)
  //   localStorage.setItem('currUrl', currUrl)
  //   if (typeof window !== 'undefined' && window.localStorage) {
  //     let loginToken = localStorage.getItem('loginToken');
  //     // if (!loginToken && process.env.UNIFIED_LOGIN_SWITCH !== 'false') {
  //     //   location.href = "https://ai.bobfintech.com.cn/iam/login"
  //     // }
  //   }
  // }, []);
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
          {/* <Header /> */}
          <Forms />
          {/* <div className='px-8 py-6 text-sm font-normal text-gray-500'>
            © {new Date().getFullYear()} Dify, Inc. All rights reserved.
          </div> */}
        </div>

      </div>

    </>
  )
}

export default SignIn
