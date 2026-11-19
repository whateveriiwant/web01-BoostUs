/**
 * 로그인 후 돌아갈 경로를 프론트엔드 안의 경로로만 제한합니다.
 * `@evil.com`, `.evil.com`, `//evil.com`, `https://evil.com` 처럼 다른 출처로 나가는 값은 버리고 '/'를 돌려줍니다.
 */
export function toSafeRedirectPath(redirect: string | undefined, frontendUrl: string): string {
  if (!redirect?.startsWith('/') || redirect.startsWith('//') || redirect.startsWith('/\\')) {
    return '/';
  }

  try {
    const base = new URL(frontendUrl);
    const target = new URL(redirect, base);
    if (target.origin !== base.origin) return '/';
    return `${target.pathname}${target.search}${target.hash}`;
  } catch {
    return '/';
  }
}
