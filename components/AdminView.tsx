
import React, { useState, useEffect, useCallback } from 'react';
import { getAllRequests, updateRequest, deleteRequest, loginAdmin } from '../services/api';
import type { RepairRequest, Status } from '../types';
import { STATUS_OPTIONS } from '../types';

declare const XLSX: any;

type Message = {
  type: 'success' | 'error';
  text: string;
};

const getStatusColor = (status: string) => {
    switch (status) {
      case '접수 중': return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case '수리 중': return 'bg-blue-100 text-blue-800 border border-blue-200';
      case '수리 완료': return 'bg-green-100 text-green-800 border border-green-200';
      case '보류': return 'bg-orange-100 text-orange-800 border border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
};

const AdminView: React.FC = () => {
  const [sessionToken, setSessionToken] = useState<string | null>(sessionStorage.getItem('admin_session_token'));
  const [isLoggedIn, setIsLoggedIn] = useState(!!sessionToken);
  const [password, setPassword] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [requests, setRequests] = useState<RepairRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);
  const [editingRequest, setEditingRequest] = useState<RepairRequest | null>(null);
  const [viewingRequest, setViewingRequest] = useState<RepairRequest | null>(null);

  const handleLogout = useCallback((reason?: string) => {
    sessionStorage.removeItem('admin_session_token');
    setSessionToken(null);
    setIsLoggedIn(false);
    setRequests([]);
    if (reason) setLoginError(reason);
  }, []);

  const fetchRequests = useCallback(async () => {
    if (!sessionToken) return;
    setLoading(true);
    setMessage(null);
    try {
      const data = await getAllRequests(sessionToken);
      setRequests(data.sort((a, b) => Number(b.ID) - Number(a.ID)));
    } catch (err: any) {
      // 서버에서 인증 실패(토큰 만료 등) 메시지를 보내면 로그아웃 처리
      if (err.message.includes('인증') || err.message.includes('세션') || err.message.includes('Token')) {
        handleLogout('세션이 만례되었습니다. 다시 로그인해주세요.');
      } else {
        setMessage({ type: 'error', text: '데이터 로드 실패: ' + err.message });
      }
    } finally {
      setLoading(false);
    }
  }, [sessionToken, handleLogout]);

  useEffect(() => {
    if (isLoggedIn) fetchRequests();
  }, [isLoggedIn, fetchRequests]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setLoginError('비밀번호를 입력해주세요.');
      return;
    }
    setIsAuthenticating(true);
    setLoginError('');
    try {
      const result = await loginAdmin(password);
      if (result.success && result.token) {
        sessionStorage.setItem('admin_session_token', result.token);
        setSessionToken(result.token);
        setIsLoggedIn(true);
        setPassword('');
      }
    } catch (err: any) {
      setLoginError(err.message || '로그인에 실패했습니다.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const showTemporaryMessage = (msg: Message) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 3000);
  };

  const handleStatusChange = async (id: number, status: Status) => {
    if (!sessionToken) return;
    try {
      await updateRequest(id, { 상태: status }, sessionToken);
      setRequests(prev => prev.map(req => req.ID === id ? { ...req, 상태: status } : req));
      showTemporaryMessage({ type: 'success', text: `상태가 '${status}'(으)로 변경되었습니다.` });
    } catch (err: any) {
        if (err.message.includes('인증')) handleLogout('인증이 만료되었습니다.');
        else showTemporaryMessage({ type: 'error', text: '상태 업데이트 실패.' });
    }
  };

  const handleDelete = async (id: number) => {
    if (!sessionToken || !window.confirm(`ID #${id} 요청을 삭제하시겠습니까?`)) return;
    try {
      await deleteRequest(id, sessionToken);
      setRequests(prev => prev.filter(req => req.ID !== id));
      showTemporaryMessage({ type: 'success', text: '항목이 삭제되었습니다.' });
    } catch (err: any) {
        if (err.message.includes('인증')) handleLogout('인증이 만료되었습니다.');
        else showTemporaryMessage({ type: 'error', text: '삭제 실패.' });
    }
  };

  const handleEditSave = async () => {
    if (!editingRequest || !sessionToken) return;
    try {
      const { ID, ...updates} = editingRequest;
      await updateRequest(ID, updates, sessionToken);
      setRequests(prev => prev.map(req => req.ID === ID ? editingRequest : req));
      setEditingRequest(null);
      showTemporaryMessage({ type: 'success', text: '수정사항이 저장되었습니다.' });
    } catch (err: any) {
        if (err.message.includes('인증')) handleLogout('인증이 만료되었습니다.');
        else showTemporaryMessage({ type: 'error', text: '저장 실패.' });
    }
  };

  const handleExcelDownload = () => {
    if (requests.length === 0) return;
    const dataForExcel = requests.map(req => ({
      'ID': req.ID, '접수일': req.날짜, '층': req.층, '장소': req.교실명,
      '신청자': req['신청자 성명'], '긴급도': req['수리 긴급 여부'],
      '상태': req.상태, '요청사항': req.요청사항, '관리자비고': req.비고
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataForExcel);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '보수현황');
    XLSX.writeFile(workbook, `시설보수현황_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  if (!isLoggedIn) {
    return (
      <div className="max-w-md mx-auto mt-20">
        <form onSubmit={handleLogin} className="bg-white p-10 rounded-3xl shadow-2xl border border-gray-100 transform transition-all hover:scale-[1.01]">
          <div className="flex justify-center mb-8">
            <div className="bg-indigo-600 p-4 rounded-2xl shadow-xl shadow-indigo-100">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
          </div>
          <h2 className="text-3xl font-black text-center text-gray-800 mb-2">관리자 로그인</h2>
          <p className="text-center text-gray-500 mb-10 text-sm font-medium">인증 토큰이 발급되면 6시간 동안 유지됩니다.</p>
          <div className="mb-6">
            <input
              type="password"
              placeholder="보안 비밀번호 입력"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-center text-lg font-bold tracking-widest"
              autoFocus
            />
          </div>
          {loginError && <p className="text-red-500 text-sm mb-6 text-center font-bold bg-red-50 py-3 rounded-xl animate-pulse">{loginError}</p>}
          <button 
            type="submit" 
            disabled={isAuthenticating}
            className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-xl hover:bg-indigo-700 hover:shadow-indigo-200 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-wait"
          >
            {isAuthenticating ? '인증 세션 생성 중...' : '관리자 접속'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* 상세 보기 모달 */}
      {viewingRequest && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex justify-center items-center z-50 p-4" onClick={() => setViewingRequest(null)}>
            <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transform transition-all" onClick={e => e.stopPropagation()}>
                <div className="p-8 border-b sticky top-0 bg-white/95 backdrop-blur flex justify-between items-center">
                    <h3 className="text-2xl font-black text-gray-900">상세 리포트 <span className="text-indigo-600">#{viewingRequest.ID}</span></h3>
                    <button onClick={() => setViewingRequest(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <div className="p-10 space-y-8">
                    <div className="grid grid-cols-2 gap-8">
                        <div><p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">접수 일시</p><p className="text-lg font-bold text-gray-800">{viewingRequest.날짜}</p></div>
                        <div><p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">신청자 성명</p><p className="text-lg font-bold text-gray-800">{viewingRequest['신청자 성명']}</p></div>
                        <div><p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">위치/장소</p><p className="text-lg font-bold text-gray-800">{viewingRequest.층} {viewingRequest.교실명}</p></div>
                        <div><p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">긴급도</p><span className={`inline-block px-3 py-1 rounded-lg font-black text-sm ${viewingRequest['수리 긴급 여부'] === '긴급' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>{viewingRequest['수리 긴급 여부']}</span></div>
                    </div>
                    <div className="bg-indigo-50/50 p-8 rounded-3xl border border-indigo-100">
                      <p className="text-xs font-black text-indigo-400 uppercase mb-4">보수 요청 사항</p>
                      <p className="text-indigo-900 leading-relaxed whitespace-pre-wrap font-semibold text-lg">{viewingRequest.요청사항}</p>
                    </div>
                    {viewingRequest.비고 && (
                      <div className="bg-gray-50 p-8 rounded-3xl border border-gray-100 italic">
                        <p className="text-xs font-black text-gray-400 uppercase mb-2">관리자 비고</p>
                        <p className="text-gray-600 whitespace-pre-wrap font-medium">{viewingRequest.비고}</p>
                      </div>
                    )}
                </div>
            </div>
        </div>
      )}

      {/* 대시보드 메인 */}
      <div className="bg-white/95 backdrop-blur-xl p-10 rounded-[2.5rem] shadow-2xl border border-white/50">
        <div className="flex flex-col xl:flex-row justify-between items-center mb-12 gap-8">
          <div className="flex items-center gap-6">
            <div className="bg-indigo-600 h-16 w-16 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-100">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            </div>
            <div>
              <h2 className="text-4xl font-black text-gray-900 tracking-tight">관리자 대시보드</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                <p className="text-gray-500 font-bold text-sm">인증 세션 활성화됨 (보안 토큰 기반)</p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            <button onClick={fetchRequests} className="flex items-center gap-2 bg-white border-2 border-gray-100 text-gray-700 px-6 py-3 rounded-2xl font-black hover:bg-gray-50 hover:border-indigo-100 transition-all active:scale-95 shadow-sm">
               새로고침
            </button>
            <button onClick={handleExcelDownload} className="flex items-center gap-2 bg-emerald-600 text-white px-8 py-3 rounded-2xl font-black hover:bg-emerald-700 hover:shadow-xl hover:shadow-emerald-100 transition-all active:scale-95">
               엑셀 리포트
            </button>
            <button onClick={() => handleLogout()} className="bg-red-50 text-red-600 px-6 py-3 rounded-2xl font-black hover:bg-red-100 transition-all active:scale-95">
               로그아웃
            </button>
          </div>
        </div>

        {message && (
          <div className={`p-6 mb-10 rounded-2xl text-center font-black shadow-xl animate-bounce ${message.type === 'success' ? 'bg-indigo-600 text-white' : 'bg-red-600 text-white'}`}>
            {message.text}
          </div>
        )}

        <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-inner">
          <table className="min-w-full divide-y divide-gray-100">
            <thead>
              <tr className="bg-gray-50/50">
                {['ID', '접수일', '장소', '신청자', '현황', '관리'].map(h => (
                  <th key={h} className="px-6 py-6 text-left text-xs font-black text-gray-400 uppercase tracking-[0.2em]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-32 font-black text-gray-300 animate-pulse text-xl">데이터 동기화 중...</td></tr>
              ) : requests.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-32 text-gray-400 font-black text-lg">등록된 보수 요청이 없습니다.</td></tr>
              ) : requests.map(req => (
                <tr key={req.ID} className="group hover:bg-indigo-50/30 transition-all cursor-pointer" onClick={() => setViewingRequest(req)}>
                  <td className="px-6 py-6 whitespace-nowrap text-sm font-black text-indigo-600">#{req.ID}</td>
                  <td className="px-6 py-6 whitespace-nowrap text-sm text-gray-500 font-bold">{req.날짜}</td>
                  <td className="px-6 py-6 whitespace-nowrap text-sm font-black text-gray-800">{req.층} {req.교실명}</td>
                  <td className="px-6 py-6 whitespace-nowrap text-sm font-bold text-gray-700">{req['신청자 성명']}</td>
                  <td className="px-6 py-6 whitespace-nowrap" onClick={e => e.stopPropagation()}>
                    <select 
                      value={req.상태} 
                      onChange={(e) => handleStatusChange(req.ID, e.target.value as Status)}
                      className={`text-xs font-black rounded-xl px-4 py-2.5 border-none shadow-sm cursor-pointer transition-all appearance-none ${getStatusColor(req.상태)}`}
                    >
                      <option value="접수 중">접수 중</option>
                      {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </td>
                  <td className="px-6 py-6 whitespace-nowrap text-sm font-black flex gap-4" onClick={e => e.stopPropagation()}>
                    <button onClick={() => setEditingRequest(req)} className="text-indigo-600 hover:text-indigo-900 underline underline-offset-4">편집</button>
                    <button onClick={() => handleDelete(req.ID)} className="text-red-500 hover:text-red-800 underline underline-offset-4">삭제</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 편집 팝업 */}
      {editingRequest && (
        <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-xl z-[60] flex justify-center items-center p-6">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-3xl overflow-hidden animate-pop-in">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-700 p-10 text-white flex justify-between items-center">
              <div>
                <h3 className="text-3xl font-black">항목 수정</h3>
                <p className="text-indigo-100 font-bold mt-1">ID #{editingRequest.ID} 데이터를 업데이트합니다.</p>
              </div>
              <button onClick={() => setEditingRequest(null)} className="p-3 hover:bg-white/10 rounded-2xl transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-12 grid grid-cols-2 gap-8">
                <div className="col-span-1">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">위치 (층)</label>
                  <select value={editingRequest.층} onChange={e => setEditingRequest({...editingRequest, 층: e.target.value})} className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold focus:ring-4 focus:ring-indigo-100 transition-all">
                    {['1층', '2층', '3층', '4층', '5층', '운동장', '체육관', '기타'].map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div className="col-span-1">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">구체적 장소명</label>
                  <input type="text" value={editingRequest.교실명} onChange={e => setEditingRequest({...editingRequest, 교실명: e.target.value})} className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold focus:ring-4 focus:ring-indigo-100 transition-all" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">요청사항 원문</label>
                  <textarea rows={3} value={editingRequest.요청사항} onChange={e => setEditingRequest({...editingRequest, 요청사항: e.target.value})} className="w-full bg-gray-50 border-none rounded-2xl p-4 font-semibold focus:ring-4 focus:ring-indigo-100 transition-all leading-relaxed" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-2 block">관리자 내부 비고</label>
                  <textarea rows={2} value={editingRequest.비고} onChange={e => setEditingRequest({...editingRequest, 비고: e.target.value})} className="w-full bg-indigo-50 border-none rounded-2xl p-4 font-semibold focus:ring-4 focus:ring-indigo-100 transition-all placeholder:text-indigo-200" placeholder="수리 기록, 부품 현황 등 입력" />
                </div>
                <div className="col-span-2 flex gap-4 pt-6">
                  <button onClick={() => setEditingRequest(null)} className="flex-1 bg-gray-100 text-gray-500 py-5 rounded-2xl font-black hover:bg-gray-200 transition-all">취소</button>
                  <button onClick={handleEditSave} className="flex-1 bg-indigo-600 text-white py-5 rounded-2xl font-black shadow-xl shadow-indigo-100 hover:scale-[1.02] active:scale-[0.98] transition-all">데이터베이스 동기화</button>
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminView;
