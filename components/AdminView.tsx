import React, { useState, useEffect, useCallback } from 'react';
import { getAllRequests, updateRequest, deleteRequest } from '../services/api';
import { ADMIN_PASSWORD } from '../constants';
import type { RepairRequest, Status } from '../types';
import { STATUS_OPTIONS, URGENCY_OPTIONS } from '../types';

type Message = {
  type: 'success' | 'error';
  text: string;
};

const AdminView: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(sessionStorage.getItem('isAdminLoggedIn') === 'true');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [requests, setRequests] = useState<RepairRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);
  
  const [editingRequest, setEditingRequest] = useState<RepairRequest | null>(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const data = await getAllRequests();
      setRequests(data.sort((a, b) => b.ID - a.ID)); // Show newest first
    } catch (err) {
      if (err instanceof Error) {
        setMessage({ type: 'error', text: '데이터를 불러오는 데 실패했습니다: ' + err.message });
      } else {
        setMessage({ type: 'error', text: '알 수 없는 오류로 데이터를 불러오는 데 실패했습니다.' });
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      fetchRequests();
    }
  }, [isLoggedIn, fetchRequests]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem('isAdminLoggedIn', 'true');
      setIsLoggedIn(true);
      setError('');
    } else {
      setError('비밀번호가 올바르지 않습니다.');
    }
  };

  const showTemporaryMessage = (msg: Message) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 5000);
  };

  const handleStatusChange = async (id: number, status: Status) => {
    try {
      await updateRequest(id, { 상태: status });
      setRequests(prev => prev.map(req => req.ID === id ? { ...req, 상태: status } : req));
      showTemporaryMessage({ type: 'success', text: `ID ${id}의 상태가 '${status}'(으)로 업데이트되었습니다.` });
    } catch (err) {
      showTemporaryMessage({ type: 'error', text: '상태 업데이트에 실패했습니다.' });
    }
  };

  const handleRemarksChange = async (id: number, remarks: string) => {
    try {
      await updateRequest(id, { 비고: remarks });
      showTemporaryMessage({ type: 'success', text: `ID ${id}의 비고가 업데이트되었습니다.` });
    } catch (err) {
      showTemporaryMessage({ type: 'error', text: '비고 업데이트에 실패했습니다.' });
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('정말로 이 요청을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      try {
        await deleteRequest(id);
        setRequests(prev => prev.filter(req => req.ID !== id));
        showTemporaryMessage({ type: 'success', text: `ID ${id} 요청이 삭제되었습니다.` });
      } catch (err) {
        showTemporaryMessage({ type: 'error', text: '삭제에 실패했습니다.' });
      }
    }
  };

  const handleEditSave = async () => {
    if (!editingRequest) return;
    try {
      const { ID, ...updates} = editingRequest;
      await updateRequest(ID, updates);
      setRequests(prev => prev.map(req => req.ID === ID ? editingRequest : req));
      setEditingRequest(null);
      showTemporaryMessage({ type: 'success', text: `ID ${ID} 요청이 성공적으로 수정되었습니다.` });
    } catch (err) {
       showTemporaryMessage({ type: 'error', text: '수정에 실패했습니다.' });
    }
  };
  
  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if(!editingRequest) return;
    setEditingRequest({...editingRequest, [e.target.name]: e.target.value});
  }

  if (!isLoggedIn) {
    return (
      <div className="max-w-md mx-auto mt-10">
        <form onSubmit={handleLogin} className="bg-white/80 backdrop-blur-sm p-8 rounded-xl shadow-xl">
          <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">관리자 로그인</h2>
          <div className="mb-6">
            <label htmlFor="password" className="block text-md font-semibold text-gray-700 mb-2">비밀번호</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full bg-gray-50 border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-base p-3"
            />
          </div>
          {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
          <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-3 px-4 rounded-lg font-semibold shadow-lg hover:scale-105 transform transition-transform duration-200">
            로그인
          </button>
        </form>
      </div>
    );
  }
  
  const inputStyle = "mt-1 block w-full bg-white border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-base p-3";
  const labelStyle = "block text-lg font-bold text-gray-800 mb-1";

  if (editingRequest) {
    return (
      <div className="bg-white/80 backdrop-blur-sm p-8 rounded-xl shadow-xl max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold mb-8">요청 수정 (ID: {editingRequest.ID})</h2>
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div><label className={labelStyle}>층</label><input name="층" value={editingRequest.층} onChange={handleEditChange} className={inputStyle}/></div>
                <div><label className={labelStyle}>교실명</label><input name="교실명" value={editingRequest.교실명} onChange={handleEditChange} className={inputStyle}/></div>
                <div><label className={labelStyle}>신청자 성명</label><input name="신청자 성명" value={editingRequest['신청자 성명']} onChange={handleEditChange} className={inputStyle}/></div>
                <div><label className={labelStyle}>수리 긴급 여부</label>
                    <select name="수리 긴급 여부" value={editingRequest['수리 긴급 여부']} onChange={handleEditChange} className={inputStyle}>
                        {URGENCY_OPTIONS.map(opt => <option key={opt}>{opt}</option>)}
                    </select>
                </div>
            </div>
            <div><label className={labelStyle}>요청사항</label><textarea name="요청사항" value={editingRequest.요청사항} onChange={handleEditChange} className={inputStyle} rows={4}></textarea></div>
            <div><label className={labelStyle}>비고</label><textarea name="비고" value={editingRequest.비고} onChange={handleEditChange} className={inputStyle} rows={3}></textarea></div>
        </div>
        <div className="mt-8 flex justify-end space-x-4">
            <button onClick={() => setEditingRequest(null)} className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg font-semibold hover:bg-gray-300 transition-colors">취소</button>
            <button onClick={handleEditSave} className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-6 py-2 rounded-lg font-semibold shadow-md hover:scale-105 transform transition-transform">저장</button>
        </div>
      </div>
    )
  }

  const tableHeaders = ['ID', '접수일', '층', '교실명', '신청자 성명', '수리 긴급 여부', '요청사항', '비고', '수리여부', '관리'];

  return (
    <div className="bg-white/80 backdrop-blur-sm p-6 sm:p-8 rounded-xl shadow-xl">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-3xl font-bold text-gray-800">관리자 패널</h2>
        <button onClick={fetchRequests} disabled={loading} className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-5 py-2.5 rounded-lg font-semibold shadow-lg hover:scale-105 transform transition-transform duration-200 disabled:from-gray-400 disabled:to-gray-500 flex items-center">
          <svg className={`w-5 h-5 mr-2 ${loading ? 'animate-spin' : ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" /></svg>
          새로고침
        </button>
      </div>

      {message && (
        <div className={`p-4 mb-4 rounded-lg ${message.type === 'success' ? 'bg-green-100 border border-green-400 text-green-700' : 'bg-red-100 border border-red-400 text-red-700'}`} role="alert">
          {message.text}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-200">
            <tr>
              {tableHeaders.map(h => <th key={h} scope="col" className="px-4 py-3.5 text-left text-sm font-semibold text-gray-700">{h}</th>)}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={tableHeaders.length} className="text-center py-8 text-gray-500">요청 목록을 불러오는 중...</td></tr>
            ) : requests.map(req => (
              <tr key={req.ID} className="hover:bg-gray-50">
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-800">{req.ID}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{new Date(req.날짜).toLocaleDateString()}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{req.층}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{req.교실명}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{req['신청자 성명']}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{req['수리 긴급 여부']}</td>
                <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate" title={req.요청사항}>{req.요청사항}</td>
                <td className="px-4 py-3 text-sm">
                    <input type="text" defaultValue={req.비고} onBlur={(e) => handleRemarksChange(req.ID, e.target.value)} className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-1.5" placeholder="비고 입력..."/>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm">
                  <select value={req.상태} onChange={(e) => handleStatusChange(req.ID, e.target.value as Status)} className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-1.5 bg-white">
                    <option>접수 중</option>
                    {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium space-x-3">
                  <button onClick={() => setEditingRequest(req)} className="text-indigo-600 hover:text-indigo-900 transition-colors">수정</button>
                  <button onClick={() => handleDelete(req.ID)} className="text-red-600 hover:text-red-900 transition-colors">삭제</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminView;
