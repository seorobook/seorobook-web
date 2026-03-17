export default async function App() {
    return (
        <div className="p-6 flex flex-col gap-4">
            <h1 className="text-2xl font-semibold">서로북</h1>
            <p className="text-secondary">
                왼쪽에서 기능을 선택하세요. (서재 / 아이템 / 집사 / 피드)
            </p>
            <div className="border border-secondary rounded-lg p-4 flex flex-col gap-2">
                <h2 className="text-lg font-semibold">방문</h2>
                <p className="text-secondary text-sm">
                    방문 세션(약속/초대/시간 제한)을 만들고 링크로 입장합니다.
                </p>
                <a
                    href="/app/visits"
                    className="text-sm hover:underline w-fit"
                >
                    방문 관리 열기 →
                </a>
            </div>
        </div>
    )
}