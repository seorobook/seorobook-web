import { redirect } from 'next/navigation'
import NotFound from '../../not-found'
import { auth } from '@/lib/auth'
import { getLibraryById } from '@/data/libraries'

export default async function Manage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { data: session } = await auth.getSession()
    if (!session?.user) {
        return redirect('/signin')
    }

    const { id } = await params
    const library = await getLibraryById(id)
    if (!library || library.owner_id !== session.user.id) {
        return <NotFound />
    }

    // 레거시 관리 화면은 /app 패널로 이동(추후 아이템/방문/설정으로 재구성)
    return redirect('/app')
}

