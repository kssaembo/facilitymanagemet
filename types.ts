
export type ViewType = 'request' | 'check' | 'inspection' | 'admin';

export type Urgency = '긴급' | '보통' | '여유';
export const URGENCY_OPTIONS: Urgency[] = ['긴급', '보통', '여유'];

export type Status = '접수 중' | '수리 중' | '수리 완료' | '보류';
export const STATUS_OPTIONS: Status[] = ['수리 중', '수리 완료', '보류'];


export interface RepairRequest {
  ID: number;
  날짜: string;
  층: string;
  교실명: string;
  '신청자 성명': string;
  '수리 긴급 여부': Urgency;
  요청사항: string;
  비고: string;
  상태: Status;
}

export type NewRepairRequest = Omit<RepairRequest, 'ID' | '날짜' | '상태'>;