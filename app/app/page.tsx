import { redirect } from 'next/navigation'
import { Navbar } from '@/components/Navbar/Navbar'
import RealmsMenu from './RealmsMenu/RealmsMenu'
import { auth } from '@/lib/auth'
import { listRealmsByOwner } from '@/data/realms'
import { listVisitedRealms } from '@/data/visitedRealms'

export default async function App() {

    const { data: session } = await auth.getSession()
    if (!session?.user) {
        return redirect('/signin')
    }

    const ownedRealms = await listRealmsByOwner(session.user.id)
    const visitedRealms = await listVisitedRealms(session.user.id)
    const realms = [
        ...ownedRealms,
        ...visitedRealms.map((realm) => ({ ...realm, shared: true })),
    ]
    const errorMessage = ''

    return (
        <div>
            <Navbar />
            <h1 className='text-3xl pl-4 sm:pl-8 pt-8'>Your Spaces</h1>
            <RealmsMenu realms={realms} errorMessage={errorMessage}/>
        </div>
    )
}