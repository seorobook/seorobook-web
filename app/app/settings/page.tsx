'use client'

import React from 'react'
import LogoutButton from '../LogoutButton'

export default function SettingsPage() {
  return (
    <div className="max-w-[720px] mx-auto w-full p-6">
      <h1 className="text-xl font-semibold mb-2">설정</h1>
      <p className="text-secondary mb-4">
        개인 정보 변경, 탈퇴, 이메일 업데이트, 결제수단/잔고/사용내역 등은 여기로 모읍니다.
      </p>

      <div className="border border-secondary rounded-lg p-4 flex items-center justify-between">
        <span className="text-sm">로그아웃</span>
        <LogoutButton />
      </div>
    </div>
  )
}

