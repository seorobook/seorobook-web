import NotFound from '@/app/not-found'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getLibraryById } from '@/data/libraries'

export default async function LibraryEditorPage({
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

    // 레거시 맵 편집기는 사용하지 않음: 기본 홈(/app)로 이동
    return redirect('/app')
}