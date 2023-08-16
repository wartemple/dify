'use client'
import React, { useEffect, useReducer, useState } from 'react'
import { useTranslation } from 'react-i18next'
import useSWR from 'swr'
import { useRouter } from 'next/navigation'
import Button from '@/app/components/base/button'

import { register } from '@/service/common'
import Toast from '@/app/components/base/toast'

type IState = {
  formState: 'processing' | 'error' | 'success' | 'initial'
  email: string
  name: string
  password: string
}

const reducer = (state: IState, action: any) => {
  switch (action.type) {
    case 'email':
      return { ...state, email: action.value }
    case 'name':
      return { ...state, name: action.value }
    case 'password':
      return { ...state, password: action.value }
    case 'formState':
      return { ...state, formState: action.value }
    case 'failed':
      return {
        formState: 'initial',
        email: '',
        name: '',
        password: '',
      }
    default:
      throw new Error('Unknown action.')
  }
}

const OneMoreStep = () => {
  const { t } = useTranslation()
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)

  const [state, dispatch] = useReducer(reducer, {
    formState: 'initial',
    email: '',
    name: '',
    password: '',
  })
  const { data, error } = useSWR(state.formState === 'processing'
    ? {
      url: '/register',
      body: {
        email: state.email,
        name: state.name,
        password: state.password,
      },
    }
    : null, register)

  useEffect(() => {
    if (error && error.status === 400) {
      Toast.notify({ type: 'error', message: t('login.invalidInvitationCode') })
      dispatch({ type: 'failed', payload: null })
    }
    if (data)
      router.push('/apps')
  }, [data, error])

  return (
    <>
      <div className="w-full mx-auto">
        <h2 className="text-[32px] font-bold text-gray-900">注册账号</h2>
      </div>

      <div className="w-full mx-auto mt-6">
        <div className="bg-white">
          <div className="mb-5">
            <label className="my-2 flex items-center justify-between text-sm font-medium text-gray-900">
              邮箱
            </label>
            <div className="mt-1">
              <input
                id="email"
                value={state.email}
                type="text"
                placeholder={'输入邮箱'}
                className={'appearance-none block w-full rounded-lg pl-[14px] px-3 py-2 border border-gray-200 hover:border-gray-300 hover:shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 placeholder-gray-400 caret-primary-600 sm:text-sm'}
                onChange={(e) => {
                  dispatch({ type: 'email', value: e.target.value.trim() })
                }}
              />
            </div>
          </div>
          <div className='mb-5'>
            <label htmlFor="name" className="my-2 flex items-center justify-between text-sm font-medium text-gray-900">
              账号名称
            </label>
            <div className="relative mt-1 rounded-md shadow-sm">
              <input
                id="name"
                value={state.name}
                type="text"
                placeholder={'输入账号名称'}
                className={'appearance-none block w-full rounded-lg pl-[14px] px-3 py-2 border border-gray-200 hover:border-gray-300 hover:shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 placeholder-gray-400 caret-primary-600 sm:text-sm'}
                onChange={(e) => {
                  dispatch({ type: 'name', value: e.target.value.trim() })
                }}
              />
            </div>
          </div>
          <div className='mb-4'>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              密码
            </label>
            <div className="relative mt-1 rounded-md shadow-sm">
              <input
                id="password"
                value={state.password}
                type={showPassword ? 'text' : 'password'}
                placeholder={'输入密码'}
                autoComplete="current-password"
                className={'appearance-none block w-full rounded-lg pl-[14px] px-3 py-2 border border-gray-200 hover:border-gray-300 hover:shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 placeholder-gray-400 caret-primary-600 sm:text-sm'}
                onChange={(e) => {
                  dispatch({ type: 'password', value: e.target.value.trim() })
                }}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-400 hover:text-gray-500 focus:outline-none focus:text-gray-500"
                >
                  {showPassword ? '👀' : '😝'}
                </button>
              </div>
            </div>
          </div>
          <div>
            <Button
              type='primary'
              className='w-full !fone-medium !text-sm'
              disabled={state.formState === 'processing'}
              onClick={() => {
                dispatch({ type: 'formState', value: 'processing' })
              }}
            >
              注册账号
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}

export default OneMoreStep
