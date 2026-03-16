import { redirect } from 'next/navigation'
import ManageChild from '../ManageChild'
import NotFound from '../../not-found'
import { auth } from '@/lib/auth'
import { getRealmById } from '@/data/realms'

export default async function Manage({ params }: { params: { id: string } }) {

    const { data: session } = await auth.getSession()
    if (!session?.user) {
        return redirect('/signin')
    }

    const realm = await getRealmById(params.id)
    // Show not found page if no data is returned or owner mismatch
    if (!realm || realm.owner_id !== session.user.id) {
        return <NotFound />
    }

    return (
        <div>
            <ManageChild 
                realmId={realm.id} 
                startingShareId={realm.share_id ?? ''} 
                startingOnlyOwner={!!realm.only_owner} 
                startingName={realm.name}
            />
        </div>
    )
}

