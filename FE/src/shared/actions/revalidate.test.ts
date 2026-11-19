import { beforeEach, describe, expect, it, vi } from 'vitest';
import { revalidatePath, revalidateTag } from 'next/cache';
import { customFetch } from '@/shared/utils/fetcher';
import { revalidateByTag, revalidatePageCache } from './revalidate';

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));
vi.mock('@/shared/utils/fetcher', () => ({ customFetch: vi.fn() }));

describe('revalidate Server Action', () => {
  beforeEach(() => vi.resetAllMocks());

  it('로그인 확인에 실패하면 캐시를 비우지 않는다', async () => {
    vi.mocked(customFetch).mockRejectedValue(new Error('Unauthorized'));

    await expect(revalidateByTag('projects')).rejects.toThrow();
    await expect(revalidatePageCache('/questions')).rejects.toThrow();
    expect(revalidateTag).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it('로그인했어도 허용 목록에 없는 태그는 거부한다', async () => {
    vi.mocked(customFetch).mockResolvedValue({});

    await expect(revalidateByTag('anything')).rejects.toThrow(
      'Unsupported tag'
    );
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it('로그인한 사용자의 허용된 태그는 무효화한다', async () => {
    vi.mocked(customFetch).mockResolvedValue({});

    await revalidateByTag('questions');
    expect(customFetch).toHaveBeenCalledWith('/api/auth/me', {
      cache: 'no-store',
    });
    expect(revalidateTag).toHaveBeenCalledWith('questions', { expire: 0 });
  });
});
