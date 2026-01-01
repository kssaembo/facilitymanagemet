
import { GAS_WEB_APP_URL, API_SECRET_KEY } from '../constants';
import type { RepairRequest, NewRepairRequest } from '../types';

/**
 * API 응답 처리 공통 로직
 * 서버에서 반환하는 { success: boolean, message?: string, data?: any } 형식을 처리합니다.
 */
async function handleResponse(response: Response) {
  if (!response.ok) {
    throw new Error(`네트워크 오류: ${response.status}`);
  }
  
  const result = await response.json();
  
  if (!result.success) {
    // 세션 만료나 인증 실패 시 구체적인 에러 메시지를 던집니다.
    throw new Error(result.message || '요청 처리에 실패했습니다.');
  }
  
  return result.data;
}

/**
 * 관리자 로그인: 서버에서 비밀번호를 검증하고 유효한 세션 토큰을 발급받습니다.
 */
export const loginAdmin = async (password: string): Promise<{ success: boolean; token: string }> => {
  const response = await fetch(GAS_WEB_APP_URL, {
    method: 'POST',
    mode: 'cors',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({
      action: 'login',
      password,
      secretKey: API_SECRET_KEY
    }),
  });
  return await handleResponse(response);
};

/**
 * 전체 요청 내역 조회: 유효한 세션 토큰이 있어야만 데이터 조회가 가능합니다.
 */
export const getAllRequests = async (token: string): Promise<RepairRequest[]> => {
  const url = new URL(GAS_WEB_APP_URL);
  url.searchParams.append('secretKey', API_SECRET_KEY);
  url.searchParams.append('token', token); // 세션 토큰 전달
  
  const response = await fetch(url.toString());
  return await handleResponse(response);
};

/**
 * 성명으로 요청 내역 검색: 일반 사용자용 기능으로 보안키만 사용합니다.
 */
export const getRequestsByName = async (name: string): Promise<RepairRequest[]> => {
  const url = new URL(GAS_WEB_APP_URL);
  url.searchParams.append('action', 'search');
  url.searchParams.append('name', name);
  url.searchParams.append('secretKey', API_SECRET_KEY);
  
  const response = await fetch(url.toString());
  return await handleResponse(response);
};

/**
 * 보수 요청서 제출: 누구나 작성 가능하지만 보안키를 통해 무분별한 접근을 차단합니다.
 */
export const submitRequest = async (data: NewRepairRequest): Promise<any> => {
  const payload = {
    ...data,
    action: 'submit',
    secretKey: API_SECRET_KEY,
    날짜: new Date().toISOString().split('T')[0],
    상태: '접수 중',
  };
  
  const response = await fetch(GAS_WEB_APP_URL, {
    method: 'POST',
    mode: 'cors',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
  });
  return await handleResponse(response);
};

/**
 * 요청 내역 수정: 특정 ID의 항목을 수정합니다. 세션 토큰이 필수입니다.
 */
export const updateRequest = async (id: number, updates: Partial<RepairRequest>, token: string): Promise<any> => {
  const payload = {
    id,
    updates,
    token, // 세션 토큰 포함
    action: 'update',
    secretKey: API_SECRET_KEY,
  };
  
  const response = await fetch(GAS_WEB_APP_URL, {
    method: 'POST',
    mode: 'cors',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
  });
  return await handleResponse(response);
};

/**
 * 요청 내역 삭제: 특정 ID의 항목을 삭제합니다. 세션 토큰이 필수입니다.
 */
export const deleteRequest = async (id: number, token: string): Promise<any> => {
  const payload = {
    id,
    token, // 세션 토큰 포함
    action: 'delete',
    secretKey: API_SECRET_KEY,
  };
  
  const response = await fetch(GAS_WEB_APP_URL, {
    method: 'POST',
    mode: 'cors',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
  });
  return await handleResponse(response);
};
