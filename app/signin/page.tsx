'use client'
import { useState } from 'react'
import BasicInput from '@/components/BasicInput'
import BasicButton from '@/components/BasicButton'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'

export default function Login() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const signInWithPassword = async () => {
    setError(null)
    setLoading(true)
    try {
      const { error } = await authClient.signIn.email({
        email,
        password,
      })

      if (error) {
        setError('이메일 또는 비밀번호를 다시 확인해주세요.')
        return
      }

      router.push('/app')
    } finally {
      setLoading(false)
    }
  }

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
        setError('이미 가입된 이메일이거나, 입력을 다시 확인해주세요.')
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
        <h1 className='text-2xl font-semibold text-center'>로그인</h1>
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
        <BasicButton onClick={signInWithPassword} disabled={loading}>
          {loading ? '로그인 중...' : '이메일로 로그인'}
        </BasicButton>
        <BasicButton onClick={signUpWithPassword} disabled={loading} className='mt-1 bg-secondary hover:bg-light-secondary'>
          {loading ? '가입 중...' : '이메일로 회원가입'}
        </BasicButton>
      </div>
    </div>
  )
}
