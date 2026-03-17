'use server'
import { RtcRole, RtcTokenBuilder } from 'agora-token'
import { auth } from '@/lib/auth'

export async function generateToken(channelName: string) {
    const { data: session } = await auth.getSession()
    if (!session?.user) return null

    const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID
    const appCertificate = process.env.APP_CERTIFICATE
    if (!appId || !appCertificate) {
        // Voice chat is optional; when env vars are missing, skip token generation.
        return null
    }
    const uid = 0
    const role = RtcRole.PUBLISHER
    const expireTime = 3600
    const currentTimestamp = Math.floor(Date.now() / 1000)
    const expiredTs = currentTimestamp + expireTime

    const token = RtcTokenBuilder.buildTokenWithUid(
        appId,
        appCertificate,
        channelName,
        uid,
        role,
        expiredTs,
        expiredTs,
    )

    return token
}