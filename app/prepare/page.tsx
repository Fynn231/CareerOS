import Link from 'next/link';
import { PrepareWorkbench } from './PrepareWorkbench';
export default function PreparePage() {
  return <><nav aria-label="CareerOS navigation" className="bg-slate-900 px-6 py-3 text-sm text-stone-100"><Link href="/" prefetch={false} className="inline-flex min-h-11 items-center underline mr-6">Quest</Link><Link href="/tracker" prefetch={false} className="inline-flex min-h-11 items-center underline">Classic tracker</Link></nav><PrepareWorkbench/></>;
}
