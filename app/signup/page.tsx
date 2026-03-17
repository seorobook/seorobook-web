'use client'
import { useState } from 'react'
import BasicInput from '@/components/BasicInput'
import BasicButton from '@/components/BasicButton'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'

const getCallbackURL = () =>
  typeof window !== 'undefined' ? `${window.location.origin}/app` : '/app'

function isAlreadyRegisteredError(message: string): boolean {
  const lower = message.toLowerCase()
  return (
    lower.includes('already') ||
    lower.includes('exist') ||
    lower.includes('registered') ||
    lower.includes('가입') ||
    lower.includes('등록')
  )
}

export default function Signup() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [emailSent, setEmailSent] = useState(false)
  const [verified, setVerified] = useState(false)
  const [alreadyRegistered, setAlreadyRegistered] = useState(false)
  const [verifyCode, setVerifyCode] = useState('')
  const [verifyLoading, setVerifyLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)

  const sendVerificationForEmail = async (): Promise<boolean> => {
    const send = (authClient as any).sendVerificationEmail
    if (!send) return false
    const { error } = await send({ email, callbackURL: getCallbackURL() })
    return !error
  }

  const signUpWithPassword = async () => {
    setError(null)
    setAlreadyRegistered(false)
    setResendSuccess(false)
    setLoading(true)
    try {
      const { error } = await authClient.signUp.email({
        email,
        password,
        name: name.trim() || email.split('@')[0] || '사용자',
        callbackURL: getCallbackURL(),
      })

      if (error) {
        if (isAlreadyRegisteredError(error.message ?? '')) {
          const sent = await sendVerificationForEmail()
          if (sent) {
            setEmailSent(true)
            setAlreadyRegistered(false)
          } else {
            setAlreadyRegistered(true)
            setError(null)
          }
        } else {
          setError(error.message ?? '입력을 다시 확인해주세요.')
        }
        return
      }

      setEmailSent(true)
    } finally {
      setLoading(false)
    }
  }

  const resendVerificationEmail = async () => {
    setError(null)
    setResendSuccess(false)
    setResendLoading(true)
    try {
      const sent = await sendVerificationForEmail()
      if (sent) {
        setEmailSent(true)
        setAlreadyRegistered(false)
        setResendSuccess(true)
        setVerifyCode('')
      } else {
        setError('인증 메일 재발송에 실패했습니다. 이미 인증된 계정이면 로그인해 주세요.')
      }
    } catch {
      setError('인증 메일 재발송에 실패했습니다.')
    } finally {
      setResendLoading(false)
    }
  }

  const submitVerifyCode = async () => {
    const code = verifyCode.trim().replace(/\D/g, '').slice(0, 6)
    if (!code || code.length < 6) {
      setError('6자리 인증 코드를 입력해 주세요.')
      return
    }
    setError(null)
    setVerifyLoading(true)
    try {
      const client = authClient as any
      if (client.emailOtp?.verifyEmail) {
        const { error } = await client.emailOtp.verifyEmail({ email, otp: code })
        if (!error) {
          setVerified(true)
          setEmailSent(false)
          setVerifyCode('')
          return
        }
      }
      if (client.verifyEmail) {
        const { error } = await client.verifyEmail({ query: { token: code } })
        if (!error) {
          setVerified(true)
          setEmailSent(false)
          setVerifyCode('')
          return
        }
      }
      setError('인증 코드가 올바르지 않거나 만료되었습니다. (10분 내 유효)')
    } catch {
      setError('인증 처리에 실패했습니다.')
    } finally {
      setVerifyLoading(false)
    }
  }

  const onVerifyCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/\D/g, '').slice(0, 6)
    setVerifyCode(v)
    setError(null)
  }

  if (verified) {
    return (
      <div className='flex flex-col items-center w-full pt-32 gap-8'>
        <div className='w-full max-w-xs flex flex-col gap-4 text-center'>
          <h1 className='text-2xl font-semibold'>이메일 인증이 완료되었습니다</h1>
          <p className='text-gray-300'>
            이제 나만의 서재(스페이스)를 만들고 둘러볼 수 있어요.
          </p>
          <BasicButton className='w-full' onClick={() => router.push('/app')}>
            서재로 이동하기
          </BasicButton>
        </div>
      </div>
    )
  }

  if (alreadyRegistered) {
    return (
      <div className='flex flex-col items-center w-full pt-32 gap-8'>
        <div className='w-full max-w-xs flex flex-col gap-4 text-center'>
          <h1 className='text-2xl font-semibold'>이미 가입된 이메일입니다</h1>
          <p className='text-gray-300'>
            <strong>{email}</strong> 로 이미 계정이 있습니다. 이메일 인증만 안 된 경우
            인증 메일을 다시 보낼 수 있습니다.
          </p>
          <div className='flex flex-col gap-2'>
            <BasicButton
              onClick={resendVerificationEmail}
              disabled={resendLoading}
              className='w-full'
            >
              {resendLoading ? '발송 중...' : '인증 메일 다시 보내기'}
            </BasicButton>
            <Link href='/signin'>
              <BasicButton className='w-full'>로그인</BasicButton>
            </Link>
          </div>
          {error && <p className='text-sm text-red-500'>{error}</p>}
        </div>
      </div>
    )
  }

  if (emailSent) {
    return (
      <div className='flex flex-col items-center w-full pt-32 gap-8'>
        <div className='w-full max-w-xs flex flex-col gap-4'>
          <h1 className='text-2xl font-semibold text-center'>이메일 인증</h1>
          <p className='text-gray-300 text-center'>
            <strong>{email}</strong> 로 6자리 인증 코드를 보냈습니다. 메일에 적힌 코드를
            입력하세요. (10분 내 유효)
          </p>
          {resendSuccess && (
            <p className='text-sm text-green-500 text-center'>
              인증 메일을 다시 보냈습니다. 새 코드를 입력하세요.
            </p>
          )}
          <div className='flex flex-col gap-2'>
            <BasicInput
              placeholder='6자리 인증 코드'
              value={verifyCode}
              onChange={onVerifyCodeChange}
              maxLength={6}
            />
            <BasicButton
              onClick={submitVerifyCode}
              disabled={verifyLoading || verifyCode.length !== 6}
            >
              {verifyLoading ? '확인 중...' : '인증하기'}
            </BasicButton>
          </div>
          <div className='flex flex-col gap-2'>
            <BasicButton
              onClick={resendVerificationEmail}
              disabled={resendLoading}
              className='w-full'
            >
              {resendLoading ? '발송 중...' : '인증 메일 다시 보내기'}
            </BasicButton>
            <Link href='/signin' className='underline text-sm text-center'>
              로그인 페이지로
            </Link>
          </div>
          {error && <p className='text-sm text-red-500 text-center'>{error}</p>}
        </div>
      </div>
    )
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

