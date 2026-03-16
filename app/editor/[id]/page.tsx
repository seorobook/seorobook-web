import NotFound from '@/app/not-found'
import { redirect } from 'next/navigation'
import Editor from '../Editor'
import { auth } from '@/lib/auth'
import { getRealmById } from '@/data/realms'

export default async function RealmEditor({ params }: { params: { id: string } }) {

    const { data: session } = await auth.getSession()
    if (!session?.user) {
        return redirect('/signin')
    }

    const realm = await getRealmById(params.id)
    if (!realm || realm.owner_id !== session.user.id) {
        return <NotFound />
    }
    const map_data = realm.map_data 

    return (
        <div>
            <Editor realmData={map_data}/>
        </div>
    )
}