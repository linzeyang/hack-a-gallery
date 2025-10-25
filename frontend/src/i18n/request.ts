import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async () => {
  // Always use zh-CN as the locale (Simplified Chinese)
  const locale = 'zh-CN';

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
