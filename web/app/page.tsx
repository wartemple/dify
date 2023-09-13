'use client'

import Link from 'next/link'
import Loading from '@/app/components/base/loading'
import { useCallback, useEffect, useRef, useState } from 'react'


const Home = async () => {
  const [currUrl, setCurrUrl] = useState("")
  useEffect(() => {
    const currUrl = location.href
    setCurrUrl(currUrl)
    localStorage.setItem('currUrl', currUrl)
    if (typeof window !== 'undefined' && window.localStorage) {
      let loginToken = localStorage.getItem('loginToken');
      if (!loginToken) {
        location.href = "https://ai.bobfintech.com.cn/iam/login"
      }
    }
  }, []);
  return (
    <div className="flex flex-col justify-center min-h-screen py-12 sm:px-6 lg:px-8">

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Loading type='area' />
        <div className="mt-10 text-center">
          <Link href='/apps'>🚀</Link>
        </div>
      </div>
    </div>
  )
}

export default Home
 