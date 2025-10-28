import React, { useState } from 'react';
import { submitRequest } from '../services/api';
import type { NewRepairRequest, ViewType } from '../types';
import { URGENCY_OPTIONS } from '../types';

interface RepairRequestFormProps {
  navigate: (view: ViewType) => void;
}

const initialFormData: NewRepairRequest = {
  '층': '',
  '교실명': '',
  '신청자 성명': '',
  '수리 긴급 여부': '보통',
  '요청사항': '',
  '비고': '',
};

const RepairRequestForm: React.FC<RepairRequestFormProps> = ({ navigate }) => {
  const [formData, setFormData] = useState<NewRepairRequest>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const today = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData['층'] || !formData['교실명'] || !formData['신청자 성명'] || !formData['요청사항']) {
      setError('필수 항목을 모두 입력해주세요. (위치, 교실명, 신청자 성명, 요청사항)');
      return;
    }

    setIsSubmitting(true);
    try {
      await submitRequest(formData);
      setIsSubmitted(true);
    } catch (err) {
      setError('요청 제출에 실패했습니다. 잠시 후 다시 시도해주세요.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleNewRequest = () => {
    setFormData(initialFormData);
    setIsSubmitted(false);
    setError('');
    // Navigate back to the main request form view, which is achieved by just resetting the state.
    // If you wanted to switch to a different top-level view, you'd use navigate('request');
  };

  if (isSubmitted) {
    return (
        <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-xl text-center">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">제출 완료</h2>
            <p className="text-lg text-gray-600 mb-8">제출이 완료되었습니다. 빠른 시간 내에 검토하겠습니다.</p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
                <button onClick={handleNewRequest} className="bg-gray-200 text-gray-800 py-3 px-6 rounded-lg font-semibold text-lg hover:bg-gray-300 transition-colors">
                    추가 보수 요청
                </button>
                <button onClick={() => navigate('check')} className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-3 px-6 rounded-lg font-semibold text-lg shadow-lg hover:scale-105 transform transition-transform">
                    보수요청 확인
                </button>
            </div>
        </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-xl shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
          <h2 className="text-3xl font-bold text-gray-800">시설 보수 요청서 작성</h2>
          <span className="text-md font-medium text-gray-600 text-right">접수일: {today}</span>
        </div>

        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg" role="alert">{error}</div>}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-gray-100 to-gray-200 p-5 rounded-xl border border-gray-200 shadow-sm">
            <label htmlFor="층" className="block text-lg font-bold text-gray-800 mb-1">위치 <span className="text-red-500">*</span></label>
            <select name="층" id="층" value={formData['층']} onChange={handleChange} className="mt-2 block w-full bg-white border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-base p-3" required>
              <option value="" disabled>-- 위치를 선택하세요 --</option>
              <option value="1층">1층</option>
              <option value="2층">2층</option>
              <option value="3층">3층</option>
              <option value="4층">4층</option>
              <option value="5층">5층</option>
              <option value="운동장">운동장</option>
              <option value="체육관">체육관</option>
              <option value="기타">기타</option>
            </select>
          </div>
          <div className="bg-gradient-to-br from-gray-100 to-gray-200 p-5 rounded-xl border border-gray-200 shadow-sm">
            <label htmlFor="교실명" className="block text-lg font-bold text-gray-800 mb-1">교실명 / 장소 <span className="text-red-500">*</span></label>
            <input type="text" name="교실명" id="교실명" value={formData['교실명']} onChange={handleChange} className="mt-2 block w-full bg-white border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-base p-3" placeholder="예: 6학년 5반, 과학실, 남자 화장실 등" required />
          </div>
          <div className="bg-gradient-to-br from-gray-100 to-gray-200 p-5 rounded-xl border border-gray-200 shadow-sm">
            <label htmlFor="신청자 성명" className="block text-lg font-bold text-gray-800 mb-1">신청자 성명 <span className="text-red-500">*</span></label>
            <input type="text" name="신청자 성명" id="신청자 성명" value={formData['신청자 성명']} onChange={handleChange} className="mt-2 block w-full bg-white border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-base p-3" placeholder="홍길동" required />
          </div>
          <div className="bg-gradient-to-br from-gray-100 to-gray-200 p-5 rounded-xl border border-gray-200 shadow-sm">
            <label htmlFor="수리 긴급 여부" className="block text-lg font-bold text-gray-800 mb-1">수리 긴급 여부</label>
            <select name="수리 긴급 여부" id="수리 긴급 여부" value={formData['수리 긴급 여부']} onChange={handleChange} className="mt-2 block w-full bg-white border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-base p-3">
              {URGENCY_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
            </select>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-gray-100 to-gray-200 p-5 rounded-xl border border-gray-200 shadow-sm">
            <label htmlFor="요청사항" className="block text-lg font-bold text-gray-800 mb-1">요청사항 <span className="text-sm font-normal text-gray-500">(구체적으로 작성)</span> <span className="text-red-500">*</span></label>
            <textarea name="요청사항" id="요청사항" value={formData['요청사항']} onChange={handleChange} rows={5} className="mt-2 block w-full bg-white border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-base p-3" placeholder="예: 2-1반 교실 뒷문 손잡이가 떨어졌습니다. 수리 부탁드립니다." required></textarea>
        </div>

        <div className="bg-gradient-to-br from-gray-100 to-gray-200 p-5 rounded-xl border border-gray-200 shadow-sm">
            <label htmlFor="비고" className="block text-lg font-bold text-gray-800 mb-1">비고 <span className="text-sm font-normal text-gray-500">(선택사항)</span></label>
            <textarea name="비고" id="비고" value={formData['비고']} onChange={handleChange} rows={3} className="mt-2 block w-full bg-white border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-base p-3" placeholder="추가 전달 사항이 있다면 작성해주세요."></textarea>
        </div>
        
        <div className="pt-4">
          <button type="submit" disabled={isSubmitting} className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-3 px-4 rounded-lg font-semibold text-lg shadow-lg hover:scale-105 transform transition-transform duration-200 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed">
            {isSubmitting ? '제출 중...' : '보수 요청서 제출하기'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RepairRequestForm;