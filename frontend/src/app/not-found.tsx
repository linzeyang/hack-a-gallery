import { getTranslations } from "next-intl/server";
import Link from "next/link";

export default async function NotFound() {
  const t = await getTranslations("errors");
  const tCommon = await getTranslations("common");

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-6xl font-bold text-gray-900 dark:text-gray-100">
            404
          </h1>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {t("pageNotFound")}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {t("notFound")}
          </p>
        </div>

        <Link
          href="/"
          className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {tCommon("backToHome")}
        </Link>
      </div>
    </div>
  );
}
