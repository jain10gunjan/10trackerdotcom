import { redirect } from 'next/navigation';

/** Legacy UPSC prelims hub → unified exam hub. */
export default function UpscPrelimsHubRedirect() {
  redirect('/upsc-prelims');
}
