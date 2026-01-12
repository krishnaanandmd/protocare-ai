"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { useTransition } from "react";

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const switchLocale = (newLocale: string) => {
    startTransition(() => {
      // Remove the current locale from the pathname
      const pathWithoutLocale = pathname.replace(`/${locale}`, '');
      // Navigate to the new locale with the same path
      router.push(`/${newLocale}${pathWithoutLocale}`);
    });
  };

  return (
    <div className="inline-flex items-center rounded-xl bg-white/10 backdrop-blur-sm p-1 border border-white/20">
      <button
        onClick={() => switchLocale('en')}
        disabled={isPending}
        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
          locale === 'en'
            ? "bg-white text-slate-900 shadow-lg"
            : "text-slate-300 hover:text-white"
        }`}
      >
        English
      </button>
      <button
        onClick={() => switchLocale('es')}
        disabled={isPending}
        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
          locale === 'es'
            ? "bg-white text-slate-900 shadow-lg"
            : "text-slate-300 hover:text-white"
        }`}
      >
        Español
      </button>
    </div>
  );
}
