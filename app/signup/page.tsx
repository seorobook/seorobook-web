'use client'
import { useState } from 'react'
import BasicInput from '@/components/BasicInput'
import BasicButton from '@/components/BasicButton'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'

export default function Signup() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const signUpWithPassword = async () => {
    setError(null)
    setLoading(true)
    try {
      const { error } = await authClient.signUp.email({
        email,
        password,
        name: name.trim() || email.split('@')[0] || '사용자',
      })

      if (error) {
        setError(error.message ?? '이미 가입된 이메일이거나, 입력을 다시 확인해주세요.')
        return
      }

      router.push('/app')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='flex flex-col items-center w-full pt-32 gap-8'>
      <div className='w-full max-w-xs flex flex-col gap-4'>
        <h1 className='text-2xl font-semibold text-center'>회원가입</h1>
        <BasicInput
          placeholder='이름(선택)'
          value={name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
        />
        <BasicInput
          placeholder='이메일'
          value={email}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
        />
        <BasicInput
          type='password'
          placeholder='비밀번호'
          value={password}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
        />
        {error && <p className='text-sm text-red-500'>{error}</p>}
        <BasicButton onClick={signUpWithPassword} disabled={loading}>
          {loading ? '가입 중...' : '이메일로 회원가입'}
        </BasicButton>
        <p className='text-sm text-center text-gray-300 mt-2'>
          이미 계정이 있으신가요?{' '}
          <Link href='/signin' className='underline'>
            로그인
          </Link>
        </p>
      </div>
    </div>
  )
}

