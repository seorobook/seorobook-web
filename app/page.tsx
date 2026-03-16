'use client'
import AnimatedCharacter from './play/SkinMenu/AnimatedCharacter'
import Link from 'next/link'
import BasicButton from '@/components/BasicButton'

export default function Index() {
  return (
    <div className='w-full grid place-items-center h-screen gradient p-4 relative'>
      <div className='max-w-[600px] flex flex-col items-center gap-8'>
        <div className='text-center'>
          <h1 className='font-semibold text-3xl mb-4'>
            서로북에 오신 것을 환영합니다!
          </h1>
          <p className='w-full text-xl'>
            나만의 서재에서 책을 읽고 기록해 보세요
          </p>
        </div>
        <div className='flex flex-col items-center justify-center'>
          <Link href='/signin'>
            <BasicButton>
              시작하기
            </BasicButton>
          </Link>
        </div>
        <AnimatedCharacter src='/sprites/characters/Character_009.png' />
      </div>
    </div>
  )
}
