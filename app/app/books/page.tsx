import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { ensureProfile } from '@/data/profiles'
import BooksList from './BooksList'

export default async function BooksPage() {
    const { data: session } = await auth.getSession()
    if (!session?.user) {
        return redirect('/signin')
    }

    await ensureProfile(session.user.id)

    return (
        <div className="px-4 sm:px-8 max-w-2xl py-6">
            <h1 className="text-2xl font-semibold mb-4">내 독서 기록</h1>
            <BooksList />
        </div>
    )
}
