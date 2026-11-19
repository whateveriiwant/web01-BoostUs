import { toSafeRedirectPath } from './oauth-redirect.util';

describe('toSafeRedirectPath', () => {
  const frontendUrl = 'https://boostus.example';

  it('프론트엔드 안의 경로는 쿼리·해시까지 유지한다', () => {
    expect(toSafeRedirectPath('/questions/12?sort=new#answer', frontendUrl)).toBe(
      '/questions/12?sort=new#answer',
    );
  });

  it.each([
    undefined,
    '',
    '@evil.com',
    '.evil.com',
    '//evil.com',
    '/\\evil.com',
    'https://evil.com',
  ])('다른 출처로 나갈 수 있는 값(%p)은 메인으로 보낸다', (redirect) => {
    expect(toSafeRedirectPath(redirect, frontendUrl)).toBe('/');
  });
});
