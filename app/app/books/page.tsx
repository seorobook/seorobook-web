import { redirect } from 'next/navigation'
import { Navbar } from '@/components/Navbar/Navbar'
import { auth } from '@/lib/auth'
import { ensureProfile, getProfileById } from '@/data/profiles'
import { getOrCreateDefaultLibrary } from '@/data/libraries'
import { formatEmailToName } from '@/utils/formatEmailToName'
import BooksList from './BooksList'

export default async function BooksPage() {
    const { data: session } = await auth.getSession()
    if (!session?.user) {
        return redirect('/signin')
    }

    await ensureProfile(session.user.id)
    const profile = await getProfileById(session.user.id)
    const defaultLibrary = await getOrCreateDefaultLibrary(session.user.id)
    const displayName =
        profile?.nickname?.trim() ||
        (session.user.email ? formatEmailToName(session.user.email) : '게스트')

    return (
        <div>
            <Navbar defaultLibraryId={defaultLibrary.id} displayName={displayName} />
            <div className="pt-20 px-4 sm:px-8 max-w-2xl">
                <h1 className="text-2xl font-semibold mb-4">내 독서 기록</h1>
                <BooksList />
            </div>
        </div>
    )
}
