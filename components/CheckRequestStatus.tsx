import React, { useState, useCallback } from 'react';
import { getRequestsByName } from '../services/api';
import type { RepairRequest } from '../types';

// No props are needed as the name is entered manually by the user.
const CheckRequestStatus: React.FC = () => {
  const [applicantName, setApplicantName] = useState('');
  const [requests, setRequests] = useState<RepairRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const handleSearch = useCallback(async (name: string) => {
    if (!name) {
      setError('신청자 성명을 입력해주세요.');
      setRequests([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    setError('');
    setSearched(true);
    try {
      const data = await getRequestsByName(name);
      setRequests(data.sort((a, b) => b.ID - a.ID)); // Show newest first
    } catch (err) {
      setError('요청을 불러오는 데 실패했습니다. 잠시 후 다시 시도해주세요.');
      setRequests([]);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(applicantName);
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case '접수 중':
        return 'bg-yellow-100 text-yellow-800';
      case '수리 중':
        return 'bg-blue-100 text-blue-800';
      case '수리 완료':
        return 'bg-green-100 text-green-800';
      case '보류':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white/80 backdrop-blur-sm p-8 rounded-xl shadow-xl">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">보수 요청 확인</h2>
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 items-center justify-center max-w-lg mx-auto mb-8">
          <input
            type="text"
            value={applicantName}
            onChange={(e) => setApplicantName(e.target.value)}
            placeholder="신청자 성명을 입력하세요"
            className="flex-grow w-full bg-gray-50 border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-base p-3"
          />
          <button type="submit" disabled={loading} className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-3 px-12 rounded-lg font-semibold shadow-lg hover:scale-105 transform transition-transform duration-200 disabled:from-gray-400 whitespace-nowrap">
            {loading ? '조회 중...' : '조회'}
          </button>
        </form>

        {error && <p className="text-red-600 bg-red-100 p-3 rounded-lg text-center my-4">{error}</p>}

        <div className="mt-6 overflow-x-auto">
          {searched && !loading && requests.length === 0 && (
            <p className="text-center text-gray-500 py-8">해당 성명으로 접수된 보수 요청이 없습니다.</p>
          )}
          {requests.length > 0 && (
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-200">
                <tr>
                  <th scope="col" className="px-4 py-3.5 text-left text-sm font-semibold text-gray-700">접수일</th>
                  <th scope="col" className="px-4 py-3.5 text-left text-sm font-semibold text-gray-700">장소</th>
                  <th scope="col" className="px-4 py-3.5 text-left text-sm font-semibold text-gray-700">요청사항</th>
                  <th scope="col" className="px-4 py-3.5 text-center text-sm font-semibold text-gray-700">상태</th>
                  <th scope="col" className="px-4 py-3.5 text-left text-sm font-semibold text-gray-700">비고</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {requests.map((req) => (
                  <tr key={req.ID} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{new Date(req.날짜).toLocaleDateString()}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{req.층} {req.교실명}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-md truncate" title={req.요청사항}>{req.요청사항}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(req.상태)}`}>
                        {req.상태}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{req.비고}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckRequestStatus;