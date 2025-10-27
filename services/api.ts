import { GAS_WEB_APP_URL } from '../constants';
import type { RepairRequest, NewRepairRequest } from '../types';

// Helper to handle API responses
async function handleResponse(response: Response) {
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
  }
  const result = await response.json();
  if (!result.success) {
    throw new Error(result.message || 'API request failed');
  }
  return result.data;
}

// Fetch all requests (for Admin)
export const getAllRequests = async (): Promise<RepairRequest[]> => {
  const response = await fetch(GAS_WEB_APP_URL);
  return handleResponse(response);
};

// Fetch requests by applicant name
export const getRequestsByName = async (name: string): Promise<RepairRequest[]> => {
  const url = new URL(GAS_WEB_APP_URL);
  url.searchParams.append('action', 'search');
  url.searchParams.append('name', name);
  const response = await fetch(url.toString());
  return handleResponse(response);
};

// Submit a new repair request
export const submitRequest = async (data: NewRepairRequest): Promise<any> => {
  const payload = {
    ...data,
    action: 'submit',
    날짜: new Date().toISOString().split('T')[0], // Add current date
    상태: '접수 중',
  };
  const response = await fetch(GAS_WEB_APP_URL, {
    method: 'POST',
    mode: 'cors',
    headers: {
      // Use text/plain to avoid CORS preflight issues with Google Apps Script redirects
      'Content-Type': 'text/plain;charset=utf-8',
    },
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
};

// Update an existing request (for Admin)
export const updateRequest = async (id: number, updates: Partial<RepairRequest>): Promise<any> => {
  const payload = {
    id,
    updates,
    action: 'update',
  };
  const response = await fetch(GAS_WEB_APP_URL, {
    method: 'POST',
    mode: 'cors',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
};

// Delete a request (for Admin)
export const deleteRequest = async (id: number): Promise<any> => {
  const payload = {
    id,
    action: 'delete',
  };
  const response = await fetch(GAS_WEB_APP_URL, {
    method: 'POST',
    mode: 'cors',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
};
