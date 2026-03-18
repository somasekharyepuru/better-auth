import { mockDeep, MockProxy } from 'jest-mock-extended';
import { EmailQueueService } from '@/email-queue/email-queue.service';

export type EmailQueueServiceMock = MockProxy<EmailQueueService>;

let emailQueueMock: EmailQueueServiceMock;

export const createEmailQueueMock = (): EmailQueueServiceMock => {
  return mockDeep<EmailQueueService>({
    addVerificationEmail: jest.fn().mockResolvedValue({ id: 'test-job-1' }),
    addSignupEmail: jest.fn().mockResolvedValue({ id: 'test-job-2' }),
    addForgotPasswordEmail: jest.fn().mockResolvedValue({ id: 'test-job-3' }),
    addOrganizationInviteEmail: jest.fn().mockResolvedValue({ id: 'test-job-4' }),
    addPasswordResetEmail: jest.fn().mockResolvedValue({ id: 'test-job-5' }),
    addTwoFactorEnabledEmail: jest.fn().mockResolvedValue({ id: 'test-job-6' }),
    getQueueStats: jest.fn().mockResolvedValue({
      waiting: 0,
      active: 0,
      completed: 10,
      failed: 0,
    }),
    onModuleDestroy: jest.fn(),
    onModuleInit: jest.fn(),
  });
};

export const getEmailQueueMock = (): EmailQueueServiceMock => {
  if (!emailQueueMock) {
    emailQueueMock = createEmailQueueMock();
  }
  return emailQueueMock;
};

export const resetEmailQueueMock = (): void => {
  emailQueueMock = createEmailQueueMock();
};

export const mockEmailQueueError = () => {
  const mock = getEmailQueueMock();
  mock.addVerificationEmail.mockRejectedValue(new Error('Email queue error'));
  return mock;
};
