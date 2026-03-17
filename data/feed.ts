import { query } from "./db"

export type FeedItemRow = {
  review_id: string
  book_id: string
  book_title: string
  book_author: string | null
  content: string
  visibility: "private" | "public" | "sero"
  created_at: string
}

function isMissingRelation(err: unknown): boolean {
  const code = (err as { code?: string })?.code
  return code === "42P01"
}

export async function listRecentReviewFeedItems(params: {
  ownerUserId: string
  viewerUserId: string
  limit?: number
}): Promise<FeedItemRow[]> {
  const limit = Math.max(1, Math.min(params.limit ?? 20, 50))
  const isOwner = params.ownerUserId === params.viewerUserId
  const visibilityCondition = isOwner ? "" : "and r.visibility in ('public')"

  try {
    const { rows } = await query<FeedItemRow>(
      `select
          r.id as review_id,
          r.book_id as book_id,
          b.title as book_title,
          b.author as book_author,
          r.content as content,
          r.visibility as visibility,
          r.created_at as created_at
       from reviews r
       join books b on b.id = r.book_id
       where b.user_id = $1
         ${visibilityCondition}
       order by r.created_at desc
       limit $2`,
      [params.ownerUserId, limit],
    )
    return rows
  } catch (err) {
    if (isMissingRelation(err)) return []
    throw err
  }
}

