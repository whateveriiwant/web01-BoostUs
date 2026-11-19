'use server';

import { customFetch } from '@/shared/utils/fetcher';
import { revalidatePath, revalidateTag } from 'next/cache';

const ALLOWED_PATHS = new Set([
  '/project',
  '/stories',
  '/questions',
  '/mypage',
]);

const ALLOWED_TAGS = new Set(['projects', 'questions']);

/**
 * Server Action은 누구나 POST로 직접 호출할 수 있는 공개 엔드포인트이므로
 * 캐시를 비우기 전에 로그인한 사용자의 요청인지 백엔드에 확인합니다.
 * (customFetch가 서버에서 브라우저 쿠키를 함께 보내고, 401이면 로그인 페이지로 보냄)
 */
async function assertLoggedIn(): Promise<void> {
  await customFetch('/api/auth/me', { cache: 'no-store' });
}

function checkisAllowedPath(path: string): void {
  if (!ALLOWED_PATHS.has(path)) {
    throw new Error(`Unsupported path: ${path}`);
  }
}

/**
 * Server Action: 특정 경로의 ISR 캐시를 무효화합니다.
 * 로그인한 사용자만, 허용된 경로에 한해 호출할 수 있습니다.
 *
 * @param path - 무효화할 경로 (예: '/project', '/stories', '/questions')
 */
export async function revalidatePageCache(path: string): Promise<void> {
  await assertLoggedIn();
  try {
    checkisAllowedPath(path);
    revalidatePath(path);
  } catch (error) {
    console.error(`Failed to revalidate path "${path}":`, error);
    throw new Error(`Revalidation failed for path: ${path}`);
  }
}

export async function revalidateUserProfileUpdate(): Promise<void> {
  await assertLoggedIn();
  try {
    // 1. 스토리 목록 (작성자 닉네임, 새 RSS 글 반영)
    revalidatePath('/stories');

    // 2. 프로젝트 목록 (참여자 닉네임 반영)
    revalidatePath('/project');

    // 3. (선택) 프로젝트 상세 페이지들은 워낙 많으므로,
    // 특정 태그(예: 'project-detail')를 심어두고 revalidateTag를 쓰는 게 가장 좋지만,
    // 지금 당장은 가장 중요한 목록 페이지들만 갱신해도 충분합니다.

    // 4. 마이페이지 (당연히 갱신)
    revalidatePath('/mypage');
  } catch (error) {
    console.error('Failed to revalidate user profile paths:', error);
    throw new Error('Revalidation failed for user profile paths');
  }
}

export async function revalidateByTag(tag: string): Promise<void> {
  await assertLoggedIn();
  if (!ALLOWED_TAGS.has(tag)) {
    throw new Error(`Unsupported tag: ${tag}`);
  }
  try {
    revalidateTag(tag, { expire: 0 });
  } catch (error) {
    console.error(`Failed to revalidate tag "${tag}":`, error);
    // 태그 기반은 실패 확률이 낮으므로 굳이 에러를 던져서 중단시킬 필요는 없음 (선택 사항)
  }
}
