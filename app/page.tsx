import { redirect } from 'next/navigation';

// The web is now a backend-only surface for the mobile app, plus the guest
// meetup join entry. There is no public landing UI — anyone hitting `/` gets
// shipped to the join screen.
export default function RootPage() {
  redirect('/meet/join');
}
