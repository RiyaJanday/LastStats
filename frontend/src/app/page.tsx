import { redirect } from 'next/navigation'

// The homepage just sends users to the dashboard
export default function Home() {
  redirect('/dashboard')
}
