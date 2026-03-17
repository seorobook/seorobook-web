'use client'

import React from 'react'
import VisitsPage from '../visits/page'

export default function SeroPage() {
  return (
    <div className="max-w-[720px] mx-auto w-full">
      <div className="p-6">
        <h1 className="text-xl font-semibold mb-1">서로</h1>
        <p className="text-secondary text-sm mb-4">
          방문 세션, 친구/관계, DM 등 “서로” 기능의 허브입니다.
        </p>
      </div>

      {/* 방문 관리는 우선 그대로 재사용 */}
      <VisitsPage />
    </div>
  )
}

