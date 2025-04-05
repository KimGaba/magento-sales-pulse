
export type TestResult = {
  name: string;
  status: 'success' | 'error' | 'pending';
  message: string;
  details?: string;
};
