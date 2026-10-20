import Link from 'next/link';
import { TrackerApp } from '@/components/TrackerApp';

export default function TrackerPage() {
  return <><nav aria-label="Demo modes" className="bg-slate-900 px-6 py-3 text-sm text-stone-100"><Link href="/" className="inline-flex min-h-11 items-center underline">← Explore the quest deck</Link><Link href="/prepare" prefetch={false} className="inline-flex min-h-11 items-center underline ml-6">Application prep</Link></nav><TrackerApp /></>;
}
