import React from "react"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { listRecentReviewFeedItems } from "@/data/feed"

export const dynamic = "force-dynamic"

function Icon({
  d,
  className,
}: {
  d: string
  className?: string
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  )
}

export default async function FeedPage() {
  const { data: session } = await auth.getSession()
  if (!session?.user) return redirect("/signin")

  const items = await listRecentReviewFeedItems({
    ownerUserId: session.user.id,
    viewerUserId: session.user.id,
    limit: 30,
  })

  return (
    <div className="max-w-[720px] mx-auto w-full">
      <div className="w-full">
        {items.length === 0 ? (
          <div className="p-6 text-secondary">
            아직 보여줄 피드가 없습니다. `/app/books`에서 감상을 남겨보세요.
          </div>
        ) : (
          <ul className="divide-y divide-primary/30">
            {items.map((it) => {
              const visibilityLabel =
                it.visibility === "public" ? "공개" : it.visibility === "sero" ? "서로" : "비공개"
              const created = new Date(it.created_at).toLocaleString()
              return (
                <li key={it.review_id} className="px-4 py-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 shrink-0">
                      <div className="h-10 w-10 rounded-full bg-secondary grid place-items-center">
                        <Icon
                          d="M20 21a8 8 0 0 0-16 0"
                          className="h-7 w-7 text-secondary"
                        />
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-semibold truncate">나</span>
                        <span className="text-xs text-secondary truncate">
                          {visibilityLabel} · {created}
                        </span>
                      </div>

                      <div className="mt-2">
                        <p className="font-medium">{it.book_title}</p>
                        {it.book_author && (
                          <p className="text-sm text-secondary">{it.book_author}</p>
                        )}
                      </div>

                      <p className="mt-2 text-sm whitespace-pre-wrap leading-relaxed">
                        {it.content}
                      </p>

                      <div className="mt-3 flex items-center gap-6 text-secondary">
                        <button type="button" className="flex items-center gap-2 hover:text-white">
                          <Icon
                            d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z"
                            className="h-5 w-5"
                          />
                          <span className="text-xs">좋아요</span>
                        </button>
                        <button type="button" className="flex items-center gap-2 hover:text-white">
                          <Icon
                            d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z"
                            className="h-5 w-5"
                          />
                          <span className="text-xs">보기</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <a
        href="/app/books"
        className="fixed right-5 bottom-20 z-20 h-12 w-12 rounded-full bg-emerald-400 text-black grid place-items-center shadow-lg"
        aria-label="감상 작성"
        title="감상 작성"
      >
        <Icon d="M12 5v14M5 12h14" className="h-7 w-7" />
      </a>
    </div>
  )
}

