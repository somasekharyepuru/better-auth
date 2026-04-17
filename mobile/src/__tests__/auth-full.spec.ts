jest.mock('../lib/auth-client', () => ({
  authClient: {
    signUp: { email: jest.fn() },
    signIn: {
      email: jest.fn(),
      social: jest.fn(),
    },
    signOut: jest.fn(),
    getSession: jest.fn(),
    forgotPassword: jest.fn(),
    resetPassword: jest.fn(),
    changePassword: jest.fn(),
    sendVerificationOtp: jest.fn(),
    verifyEmail: jest.fn(),
    updateUser: jest.fn(),
    twoFactor: {
      enable: jest.fn(),
      verifySetup: jest.fn(),
      verifyTotp: jest.fn(),
      disable: jest.fn(),
      generateBackupCodes: jest.fn(),
    },
    signInWithTwoFactor: jest.fn(),
    organization: {
      list: jest.fn(),
      getFullOrganization: jest.fn(),
      setActive: jest.fn(),
      create: jest.fn(),
      listMembers: jest.fn(),
      removeMember: jest.fn(),
      updateMemberRole: jest.fn(),
      listInvitations: jest.fn(),
      getInvitation: jest.fn(),
      acceptInvitation: jest.fn(),
      rejectInvitation: jest.fn(),
      inviteMember: jest.fn(),
      cancelInvitation: jest.fn(),
      listTeams: jest.fn(),
      createTeam: jest.fn(),
      updateTeam: jest.fn(),
      addTeamMember: jest.fn(),
      removeTeamMember: jest.fn(),
    },
  },
  httpAuthClient: {
    leaveOrganization: jest.fn(),
  },
}));

import {
  signUp,
  signIn,
  signInWithTwoFactor,
  signInSocial,
  signOut,
  getSession,
  getActiveOrganization,
  updateUser,
  changePassword,
  forgotPassword,
  resetPassword,
  sendVerificationOtp,
  verifyEmail,
  enableTwoFactor,
  verifyTwoFactorSetup,
  disableTwoFactor,
  generateBackupCodes,
  listOrganizations,
  createOrganization,
  setActiveOrganization,
  getFullOrganization,
  listMembers,
  removeMember,
  leaveOrganization,
  updateMemberRole,
  listInvitations,
  getInvitation,
  acceptInvitation,
  rejectInvitation,
  inviteMember,
  cancelInvitation,
  listTeams,
  createTeam,
  updateTeam,
  deleteTeam,
  addTeamMember,
  removeTeamMember,
  listSessions,
  revokeSession,
  revokeOtherSessions,
  getAuditLogs,
  getRoleLevel,
  hasRoleOver,
  isAdmin,
  isOwner,
  getTransferStatus,
  initiateOwnershipTransfer,
  cancelOwnershipTransfer,
  getTransferDetails,
  confirmTransfer,
  getOrgBanStatus,
} from '../lib/auth';
import { authClient, httpAuthClient } from '../lib/auth-client';

const mockFetch = jest.fn();

describe('auth.ts - Core Authentication', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.EXPO_PUBLIC_API_URL = 'http://localhost:3002';
    (authClient as any).twoFactor.verifySetup = jest.fn();
    (authClient as any).twoFactor.verifyTotp = jest.fn();
  });

  describe('signUp', () => {
    it('returns error when API returns error', async () => {
      (authClient.signUp.email as jest.Mock).mockResolvedValue({
        data: null,
        error: { message: 'Email taken', code: 'CONFLICT', status: 409 },
      });
      const result = await signUp({ name: 'A', email: 'a@b.com', password: 'p' });
      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error.status).toBe(409);
      }
    });

    it('returns error when no user returned', async () => {
      (authClient.signUp.email as jest.Mock).mockResolvedValue({ data: {}, error: null });
      const result = await signUp({ name: 'A', email: 'a@b.com', password: 'p' });
      expect('error' in result).toBe(true);
    });

    it('returns error on exception', async () => {
      (authClient.signUp.email as jest.Mock).mockRejectedValue(new Error('Network'));
      const result = await signUp({ name: 'A', email: 'a@b.com', password: 'p' });
      expect('error' in result).toBe(true);
    });
  });

  describe('signIn', () => {
    it('returns error on 2FA redirect', async () => {
      (authClient.signIn.email as jest.Mock).mockResolvedValue({
        data: { redirect: true, url: '/2fa' },
        error: null,
      });
      const result = await signIn({ email: 'a@b.com', password: 'p' });
      expect('requiresTwoFactor' in result && result.requiresTwoFactor).toBe(true);
    });

    it('returns error when no user in data', async () => {
      (authClient.signIn.email as jest.Mock).mockResolvedValue({
        data: { something: 'else' },
        error: null,
      });
      const result = await signIn({ email: 'a@b.com', password: 'p' });
      expect('error' in result).toBe(true);
    });

    it('returns error when data is null', async () => {
      (authClient.signIn.email as jest.Mock).mockResolvedValue({ data: null, error: null });
      const result = await signIn({ email: 'a@b.com', password: 'p' });
      expect('error' in result).toBe(true);
    });

    it('returns error on exception', async () => {
      (authClient.signIn.email as jest.Mock).mockRejectedValue(new Error('fail'));
      const result = await signIn({ email: 'a@b.com', password: 'p' });
      expect('error' in result).toBe(true);
    });
  });

  describe('signInWithTwoFactor', () => {
    it('returns error when twoFactor not available', async () => {
      const original = authClient.twoFactor;
      (authClient as any).twoFactor = undefined;
      const result = await signInWithTwoFactor({ email: 'a@b.com', password: 'p', code: '123' });
      expect('error' in result).toBe(true);
      (authClient as any).twoFactor = original;
    });

    it('returns error when verify returns error', async () => {
      (authClient.signInWithTwoFactor as jest.Mock).mockResolvedValue({
        data: null,
        error: { message: 'Bad code' },
      });
      const result = await signInWithTwoFactor({ email: 'a@b.com', password: 'p', code: 'bad' });
      expect('error' in result).toBe(true);
    });

    it('returns error when session fetch fails after verify', async () => {
      (authClient.signInWithTwoFactor as jest.Mock).mockResolvedValue({
        data: null,
        error: null,
      });
      const result = await signInWithTwoFactor({ email: 'a@b.com', password: 'p', code: '123' });
      expect('error' in result).toBe(true);
    });

    it('returns user on success', async () => {
      (authClient.signInWithTwoFactor as jest.Mock).mockResolvedValue({
        data: { user: { id: 'u1', email: 'a@b.com' }, session: { id: 's1' } },
        error: null,
      });
      const result = await signInWithTwoFactor({ email: 'a@b.com', password: 'p', code: '123' });
      expect('user' in result).toBe(true);
    });

    it('falls back to verifyTotp when verifySetup missing', async () => {
      (authClient.signInWithTwoFactor as jest.Mock).mockResolvedValue({
        data: { user: { id: 'u1' }, session: { id: 's1' } },
        error: null,
      });
      const result = await signInWithTwoFactor({ email: 'a@b.com', password: 'p', code: '123' });
      expect('user' in result).toBe(true);
    });

    it('returns error when both verify methods missing', async () => {
      (authClient.signInWithTwoFactor as jest.Mock).mockResolvedValue({
        data: null,
        error: { message: 'Verification failed' },
      });
      const result = await signInWithTwoFactor({ email: 'a@b.com', password: 'p', code: '123' });
      expect('error' in result).toBe(true);
    });

    it('returns error on exception', async () => {
      (authClient.signInWithTwoFactor as jest.Mock).mockRejectedValue(new Error('fail'));
      const result = await signInWithTwoFactor({ email: 'a@b.com', password: 'p', code: '123' });
      expect('error' in result).toBe(true);
    });
  });

  describe('signInSocial', () => {
    const googleCallback = jest.fn();
    const microsoftCallback = jest.fn();

    beforeEach(() => {
      (authClient.signIn as any).social = {
        google: { callback: googleCallback },
        microsoft: { callback: microsoftCallback },
      };
    });

    it('returns error when provider returns error', async () => {
      googleCallback.mockResolvedValue({
        data: null,
        error: { message: 'OAuth failed' },
      });
      const result = await signInSocial('google');
      expect('error' in result).toBe(true);
    });

    it('returns error when no data', async () => {
      googleCallback.mockResolvedValue({
        data: null,
        error: null,
      });
      const result = await signInSocial('google');
      expect('error' in result).toBe(true);
    });

    it('returns error on redirect result', async () => {
      googleCallback.mockResolvedValue({
        data: { redirect: true, url: 'https://google.com' },
        error: null,
      });
      const result = await signInSocial('google');
      expect('error' in result).toBe(true);
    });

    it('returns user on success', async () => {
      googleCallback.mockResolvedValue({
        data: { user: { id: 'u1', email: 'a@b.com' } },
        error: null,
      });
      const result = await signInSocial('google');
      expect('user' in result).toBe(true);
    });

    it('returns user on success for microsoft', async () => {
      microsoftCallback.mockResolvedValue({
        data: { user: { id: 'u1', email: 'a@b.com' } },
        error: null,
      });
      const result = await signInSocial('microsoft');
      expect('user' in result).toBe(true);
    });

    it('returns error when no user in data', async () => {
      googleCallback.mockResolvedValue({
        data: { something: 'else' },
        error: null,
      });
      const result = await signInSocial('google');
      expect('error' in result).toBe(true);
    });

    it('returns error on exception', async () => {
      googleCallback.mockRejectedValue(new Error('fail'));
      const result = await signInSocial('google');
      expect('error' in result).toBe(true);
    });
  });

  describe('signOut', () => {
    it('returns success', async () => {
      (authClient.signOut as jest.Mock).mockResolvedValue(undefined);
      const result = await signOut();
      expect('success' in result && result.success).toBe(true);
    });

    it('returns error on exception', async () => {
      (authClient.signOut as jest.Mock).mockRejectedValue(new Error('fail'));
      const result = await signOut();
      expect('error' in result).toBe(true);
    });
  });

  describe('getSession', () => {
    it('returns null when no user', async () => {
      (authClient.getSession as jest.Mock).mockResolvedValue({ data: {} });
      const result = await getSession();
      expect(result).toBeNull();
    });

    it('returns null on exception', async () => {
      (authClient.getSession as jest.Mock).mockRejectedValue(new Error('fail'));
      const result = await getSession();
      expect(result).toBeNull();
    });

    it('normalizes activeOrganizationId to null when undefined', async () => {
      (authClient.getSession as jest.Mock).mockResolvedValue({
        data: {
          user: { id: 'u1' },
          session: { id: 's1', activeOrganizationId: undefined },
        },
      });
      const result = await getSession();
      expect(result?.session?.activeOrganizationId).toBeNull();
    });
  });

  describe('getActiveOrganization', () => {
    it('returns null when no active org in session', async () => {
      (authClient.getSession as jest.Mock).mockResolvedValue({
        data: { user: { id: 'u1' }, session: { activeOrganizationId: null } },
      });
      const result = await getActiveOrganization();
      expect(result.organization).toBeNull();
    });

    it('returns null on exception', async () => {
      (authClient.getSession as jest.Mock).mockRejectedValue(new Error('fail'));
      const result = await getActiveOrganization();
      expect(result.organization).toBeNull();
    });

    it('returns org when active org set', async () => {
      (authClient.getSession as jest.Mock).mockResolvedValue({
        data: { user: { id: 'u1' }, session: { activeOrganizationId: 'org-1' } },
      });
      (authClient.organization.getFullOrganization as jest.Mock).mockResolvedValue({
        data: { id: 'org-1', name: 'My Org' },
      });
      const result = await getActiveOrganization();
      expect(result.organization).toEqual({ id: 'org-1', name: 'My Org' });
    });
  });

  describe('updateUser', () => {
    it('returns success', async () => {
      (authClient.updateUser as jest.Mock).mockResolvedValue({ error: null });
      const result = await updateUser({ name: 'New Name' });
      expect('success' in result && result.success).toBe(true);
    });

    it('returns error on API error', async () => {
      (authClient.updateUser as jest.Mock).mockResolvedValue({ error: { message: 'Fail' } });
      const result = await updateUser({ name: 'New Name' });
      expect('error' in result).toBe(true);
    });

    it('returns error on exception', async () => {
      (authClient.updateUser as jest.Mock).mockRejectedValue(new Error('fail'));
      const result = await updateUser({ name: 'New' });
      expect('error' in result).toBe(true);
    });
  });
});

describe('auth.ts - Password Management', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('changePassword', () => {
    it('returns success', async () => {
      (authClient.changePassword as jest.Mock).mockResolvedValue({ error: null });
      const result = await changePassword({ currentPassword: 'old', newPassword: 'new' });
      expect('success' in result && result.success).toBe(true);
    });

    it('returns error on API error', async () => {
      (authClient.changePassword as jest.Mock).mockResolvedValue({ error: { message: 'Weak password' } });
      const result = await changePassword({ currentPassword: 'old', newPassword: 'new' });
      expect('error' in result).toBe(true);
    });

    it('returns error on exception', async () => {
      (authClient.changePassword as jest.Mock).mockRejectedValue(new Error('fail'));
      const result = await changePassword({ currentPassword: 'old', newPassword: 'new' });
      expect('error' in result).toBe(true);
    });
  });

  describe('forgotPassword', () => {
    it('returns success', async () => {
      (authClient.forgotPassword as jest.Mock).mockResolvedValue({ error: null });
      const result = await forgotPassword('a@b.com');
      expect('success' in result && result.success).toBe(true);
    });

    it('returns error on API error', async () => {
      (authClient.forgotPassword as jest.Mock).mockResolvedValue({ error: { message: 'Fail' } });
      const result = await forgotPassword('a@b.com');
      expect('error' in result).toBe(true);
    });

    it('returns error on exception', async () => {
      (authClient.forgotPassword as jest.Mock).mockRejectedValue(new Error('fail'));
      const result = await forgotPassword('a@b.com');
      expect('error' in result).toBe(true);
    });
  });

  describe('resetPassword', () => {
    it('returns success', async () => {
      (authClient.resetPassword as jest.Mock).mockResolvedValue({ error: null });
      const result = await resetPassword({ password: 'new', token: 'tok' });
      expect('success' in result && result.success).toBe(true);
    });

    it('returns error on API error', async () => {
      (authClient.resetPassword as jest.Mock).mockResolvedValue({ error: { message: 'Token expired' } });
      const result = await resetPassword({ password: 'new', token: 'tok' });
      expect('error' in result).toBe(true);
    });
  });
});

describe('auth.ts - Email Verification', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('sendVerificationOtp', () => {
    it('returns success', async () => {
      (authClient.sendVerificationOtp as jest.Mock).mockResolvedValue({ error: null });
      const result = await sendVerificationOtp('a@b.com');
      expect('success' in result && result.success).toBe(true);
    });

    it('returns error on API error', async () => {
      (authClient.sendVerificationOtp as jest.Mock).mockResolvedValue({ error: { message: 'Fail' } });
      const result = await sendVerificationOtp('a@b.com');
      expect('error' in result).toBe(true);
    });

    it('returns error on exception', async () => {
      (authClient.sendVerificationOtp as jest.Mock).mockRejectedValue(new Error('fail'));
      const result = await sendVerificationOtp('a@b.com');
      expect('error' in result).toBe(true);
    });
  });

  describe('verifyEmail', () => {
    it('returns success', async () => {
      (authClient.verifyEmail as jest.Mock).mockResolvedValue({ error: null });
      const result = await verifyEmail({ code: '123456' });
      expect('success' in result && result.success).toBe(true);
    });

    it('returns error on API error', async () => {
      (authClient.verifyEmail as jest.Mock).mockResolvedValue({ error: { message: 'Invalid code' } });
      const result = await verifyEmail({ code: 'bad' });
      expect('error' in result).toBe(true);
    });
  });
});

describe('auth.ts - Two-Factor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (authClient as any).twoFactor.verifySetup = jest.fn();
  });

  describe('enableTwoFactor', () => {
    it('returns totpURI and backupCodes', async () => {
      (authClient.twoFactor.enable as jest.Mock).mockResolvedValue({
        totpURI: 'otpauth://totp',
        backupCodes: ['abc', 'def'],
      });
      const result = await enableTwoFactor('pass');
      if ('totpURI' in result) {
        expect(result.totpURI).toBe('otpauth://totp');
        expect(result.backupCodes).toEqual(['abc', 'def']);
      }
    });

    it('returns error when not an object', async () => {
      (authClient.twoFactor.enable as jest.Mock).mockResolvedValue(null);
      const result = await enableTwoFactor('pass');
      expect('error' in result).toBe(true);
    });

    it('returns error when result has error', async () => {
      (authClient.twoFactor.enable as jest.Mock).mockResolvedValue({ error: { message: 'Bad password' } });
      const result = await enableTwoFactor('wrong');
      expect('error' in result).toBe(true);
    });

    it('returns error on exception', async () => {
      (authClient.twoFactor.enable as jest.Mock).mockRejectedValue(new Error('fail'));
      const result = await enableTwoFactor('pass');
      expect('error' in result).toBe(true);
    });
  });

  describe('verifyTwoFactorSetup', () => {
    it('returns success', async () => {
      (authClient.twoFactor.verifySetup as jest.Mock).mockResolvedValue({ success: true });
      const result = await verifyTwoFactorSetup('123456');
      expect('success' in result && result.success).toBe(true);
    });

    it('returns error when not object', async () => {
      (authClient.twoFactor.verifySetup as jest.Mock).mockResolvedValue(null);
      const result = await verifyTwoFactorSetup('123');
      expect('error' in result).toBe(true);
    });

    it('returns error when result has error', async () => {
      (authClient.twoFactor.verifySetup as jest.Mock).mockResolvedValue({ error: { message: 'Bad code' } });
      const result = await verifyTwoFactorSetup('bad');
      expect('error' in result).toBe(true);
    });
  });

  describe('disableTwoFactor', () => {
    it('returns success', async () => {
      (authClient.twoFactor.disable as jest.Mock).mockResolvedValue({ success: true });
      const result = await disableTwoFactor('pass');
      expect('success' in result && result.success).toBe(true);
    });

    it('returns error when not object', async () => {
      (authClient.twoFactor.disable as jest.Mock).mockResolvedValue(null);
      const result = await disableTwoFactor('pass');
      expect('error' in result).toBe(true);
    });

    it('returns error on API error', async () => {
      (authClient.twoFactor.disable as jest.Mock).mockResolvedValue({ error: { message: 'Bad password' } });
      const result = await disableTwoFactor('wrong');
      expect('error' in result).toBe(true);
    });
  });

  describe('generateBackupCodes', () => {
    it('returns backup codes', async () => {
      (authClient.twoFactor.generateBackupCodes as jest.Mock).mockResolvedValue({ backupCodes: ['a', 'b'] });
      const result = await generateBackupCodes('pass');
      if ('backupCodes' in result) {
        expect(result.backupCodes).toEqual(['a', 'b']);
      }
    });

    it('returns error when not object', async () => {
      (authClient.twoFactor.generateBackupCodes as jest.Mock).mockResolvedValue(null);
      const result = await generateBackupCodes('pass');
      expect('error' in result).toBe(true);
    });

    it('returns error on API error', async () => {
      (authClient.twoFactor.generateBackupCodes as jest.Mock).mockResolvedValue({ error: { message: 'Fail' } });
      const result = await generateBackupCodes('pass');
      expect('error' in result).toBe(true);
    });

    it('returns error on exception', async () => {
      (authClient.twoFactor.generateBackupCodes as jest.Mock).mockRejectedValue(new Error('fail'));
      const result = await generateBackupCodes('pass');
      expect('error' in result).toBe(true);
    });
  });
});

describe('auth.ts - Organizations', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('listOrganizations', () => {
    it('returns organizations', async () => {
      (authClient.organization.list as jest.Mock).mockResolvedValue({
        data: { organizations: [{ id: 'o1' }] },
        error: null,
      });
      const result = await listOrganizations();
      if ('organizations' in result) {
        expect(result.organizations).toEqual([{ id: 'o1' }]);
      }
    });

    it('returns empty array when no data', async () => {
      (authClient.organization.list as jest.Mock).mockResolvedValue({ data: null, error: null });
      const result = await listOrganizations();
      if ('organizations' in result) {
        expect(result.organizations).toEqual([]);
      }
    });

    it('returns error on API error', async () => {
      (authClient.organization.list as jest.Mock).mockResolvedValue({ data: null, error: { message: 'Fail' } });
      const result = await listOrganizations();
      expect('error' in result).toBe(true);
    });

    it('returns error on exception', async () => {
      (authClient.organization.list as jest.Mock).mockRejectedValue(new Error('fail'));
      const result = await listOrganizations();
      expect('error' in result).toBe(true);
    });
  });

  describe('createOrganization', () => {
    it('creates org with auto-generated slug', async () => {
      (authClient.organization.create as jest.Mock).mockResolvedValue({
        data: { id: 'o1', name: 'My Org' },
        error: null,
      });
      const result = await createOrganization({ name: 'My Org' });
      expect(authClient.organization.create).toHaveBeenCalledWith({ name: 'My Org', slug: 'my-org' });
      if ('organization' in result) {
        expect(result.organization.id).toBe('o1');
      }
    });

    it('uses provided slug', async () => {
      (authClient.organization.create as jest.Mock).mockResolvedValue({
        data: { id: 'o1' },
        error: null,
      });
      await createOrganization({ name: 'My Org', slug: 'custom-slug' });
      expect(authClient.organization.create).toHaveBeenCalledWith({ name: 'My Org', slug: 'custom-slug' });
    });

    it('returns error when no data', async () => {
      (authClient.organization.create as jest.Mock).mockResolvedValue({ data: null, error: null });
      const result = await createOrganization({ name: 'Org' });
      expect('error' in result).toBe(true);
    });
  });

  describe('setActiveOrganization', () => {
    it('returns success', async () => {
      (authClient.organization.setActive as jest.Mock).mockResolvedValue({ error: null });
      const result = await setActiveOrganization('org-1');
      expect('success' in result && result.success).toBe(true);
    });

    it('returns error on API error', async () => {
      (authClient.organization.setActive as jest.Mock).mockResolvedValue({ error: { message: 'Fail' } });
      const result = await setActiveOrganization('org-1');
      expect('error' in result).toBe(true);
    });
  });

  describe('getFullOrganization', () => {
    it('returns org data', async () => {
      (authClient.organization.getFullOrganization as jest.Mock).mockResolvedValue({
        data: { id: 'o1', name: 'Org' },
        error: null,
      });
      const result = await getFullOrganization();
      if ('organization' in result) {
        expect(result.organization).toEqual({ id: 'o1', name: 'Org' });
      }
    });

    it('returns error on API error', async () => {
      (authClient.organization.getFullOrganization as jest.Mock).mockResolvedValue({ data: null, error: { message: 'Fail' } });
      const result = await getFullOrganization();
      expect('error' in result).toBe(true);
    });
  });

  describe('listMembers', () => {
    it('returns members from object', async () => {
      (authClient.organization.listMembers as jest.Mock).mockResolvedValue({
        data: { members: [{ id: 'm1' }] },
        error: null,
      });
      const result = await listMembers('org-1');
      if ('members' in result) expect(result.members).toEqual([{ id: 'm1' }]);
    });

    it('returns members from array', async () => {
      (authClient.organization.listMembers as jest.Mock).mockResolvedValue({
        data: [{ id: 'm1' }],
        error: null,
      });
      const result = await listMembers('org-1');
      if ('members' in result) expect(result.members).toEqual([{ id: 'm1' }]);
    });

    it('returns empty when no data', async () => {
      (authClient.organization.listMembers as jest.Mock).mockResolvedValue({ data: null, error: null });
      const result = await listMembers('org-1');
      if ('members' in result) expect(result.members).toEqual([]);
    });
  });

  describe('removeMember', () => {
    it('returns success', async () => {
      (authClient.organization.removeMember as jest.Mock).mockResolvedValue({ error: null });
      const result = await removeMember({ memberIdOrEmail: 'm1', organizationId: 'o1' });
      expect('success' in result && result.success).toBe(true);
    });

    it('returns error on API error', async () => {
      (authClient.organization.removeMember as jest.Mock).mockResolvedValue({ error: { message: 'Fail' } });
      const result = await removeMember({ memberIdOrEmail: 'm1', organizationId: 'o1' });
      expect('error' in result).toBe(true);
    });
  });

  describe('leaveOrganization', () => {
    it('returns success', async () => {
      (httpAuthClient.leaveOrganization as jest.Mock).mockResolvedValue({ error: null });
      const result = await leaveOrganization('org-1');
      expect('success' in result && result.success).toBe(true);
    });

    it('returns error on API error', async () => {
      (httpAuthClient.leaveOrganization as jest.Mock).mockResolvedValue({ error: { message: 'Fail' } });
      const result = await leaveOrganization('org-1');
      expect('error' in result).toBe(true);
    });

    it('returns error on exception', async () => {
      (httpAuthClient.leaveOrganization as jest.Mock).mockRejectedValue(new Error('fail'));
      const result = await leaveOrganization('org-1');
      expect('error' in result).toBe(true);
    });
  });

  describe('updateMemberRole', () => {
    it('returns success', async () => {
      (authClient.organization.updateMemberRole as jest.Mock).mockResolvedValue({ error: null });
      const result = await updateMemberRole({ memberId: 'm1', role: 'admin', organizationId: 'o1' });
      expect('success' in result && result.success).toBe(true);
    });

    it('returns error on API error', async () => {
      (authClient.organization.updateMemberRole as jest.Mock).mockResolvedValue({ error: { message: 'Fail' } });
      const result = await updateMemberRole({ memberId: 'm1', role: 'admin', organizationId: 'o1' });
      expect('error' in result).toBe(true);
    });
  });

  describe('Invitations', () => {
    it('listInvitations returns data', async () => {
      (authClient.organization.listInvitations as jest.Mock).mockResolvedValue({
        data: [{ id: 'inv1' }],
        error: null,
      });
      const result = await listInvitations('org-1');
      if ('invitations' in result) expect(result.invitations).toEqual([{ id: 'inv1' }]);
    });

    it('listInvitations returns empty', async () => {
      (authClient.organization.listInvitations as jest.Mock).mockResolvedValue({ data: null, error: null });
      const result = await listInvitations('org-1');
      if ('invitations' in result) expect(result.invitations).toEqual([]);
    });

    it('getInvitation returns data', async () => {
      (authClient.organization.getInvitation as jest.Mock).mockResolvedValue({
        data: { id: 'inv1', email: 'a@b.com' },
        error: null,
      });
      const result = await getInvitation('inv1');
      if ('invitation' in result) expect(result.invitation.id).toBe('inv1');
    });

    it('getInvitation returns error when no data', async () => {
      (authClient.organization.getInvitation as jest.Mock).mockResolvedValue({ data: null, error: null });
      const result = await getInvitation('inv1');
      expect('error' in result).toBe(true);
    });

    it('acceptInvitation returns success', async () => {
      (authClient.organization.acceptInvitation as jest.Mock).mockResolvedValue({ error: null });
      const result = await acceptInvitation('inv1');
      expect('success' in result && result.success).toBe(true);
    });

    it('rejectInvitation returns success', async () => {
      (authClient.organization.rejectInvitation as jest.Mock).mockResolvedValue({ error: null });
      const result = await rejectInvitation('inv1');
      expect('success' in result && result.success).toBe(true);
    });

    it('inviteMember returns invitation', async () => {
      (authClient.organization.inviteMember as jest.Mock).mockResolvedValue({
        data: { id: 'inv1', email: 'a@b.com' },
        error: null,
      });
      const result = await inviteMember({ organizationId: 'o1', email: 'a@b.com', role: 'member' });
      if ('invitation' in result) expect(result.invitation.id).toBe('inv1');
    });

    it('inviteMember unwraps nested invitation', async () => {
      (authClient.organization.inviteMember as jest.Mock).mockResolvedValue({
        data: { invitation: { id: 'inv1', email: 'a@b.com' } },
        error: null,
      });
      const result = await inviteMember({ organizationId: 'o1', email: 'a@b.com', role: 'member' });
      if ('invitation' in result) expect(result.invitation.id).toBe('inv1');
    });

    it('inviteMember returns error when no data', async () => {
      (authClient.organization.inviteMember as jest.Mock).mockResolvedValue({ data: null, error: null });
      const result = await inviteMember({ organizationId: 'o1', email: 'a@b.com', role: 'member' });
      expect('error' in result).toBe(true);
    });

    it('cancelInvitation returns success', async () => {
      (authClient.organization.cancelInvitation as jest.Mock).mockResolvedValue({ error: null });
      const result = await cancelInvitation('inv1');
      expect('success' in result && result.success).toBe(true);
    });
  });
});

describe('auth.ts - Teams', () => {
  beforeEach(() => { jest.clearAllMocks(); global.fetch = mockFetch; });

  describe('listTeams', () => {
    it('returns teams from object', async () => {
      (authClient.organization.listTeams as jest.Mock).mockResolvedValue({
        data: { teams: [{ id: 't1' }] },
        error: null,
      });
      const result = await listTeams('org-1');
      if ('teams' in result) expect(result.teams).toEqual([{ id: 't1' }]);
    });

    it('returns teams from array', async () => {
      (authClient.organization.listTeams as jest.Mock).mockResolvedValue({
        data: [{ id: 't1' }],
        error: null,
      });
      const result = await listTeams('org-1');
      if ('teams' in result) expect(result.teams).toEqual([{ id: 't1' }]);
    });

    it('returns empty when no data', async () => {
      (authClient.organization.listTeams as jest.Mock).mockResolvedValue({ data: null, error: null });
      const result = await listTeams('org-1');
      if ('teams' in result) expect(result.teams).toEqual([]);
    });
  });

  describe('createTeam', () => {
    it('returns created team', async () => {
      (authClient.organization.createTeam as jest.Mock).mockResolvedValue({
        data: { id: 't1', name: 'Team' },
        error: null,
      });
      const result = await createTeam({ name: 'Team', organizationId: 'o1' });
      if ('team' in result) expect(result.team.id).toBe('t1');
    });

    it('returns error when no data', async () => {
      (authClient.organization.createTeam as jest.Mock).mockResolvedValue({ data: null, error: null });
      const result = await createTeam({ name: 'Team', organizationId: 'o1' });
      expect('error' in result).toBe(true);
    });
  });

  describe('updateTeam', () => {
    it('returns success', async () => {
      (authClient.organization.updateTeam as jest.Mock).mockResolvedValue({ error: null });
      const result = await updateTeam({ teamId: 't1', name: 'Updated' });
      expect('success' in result && result.success).toBe(true);
    });
  });

  describe('deleteTeam', () => {
    it('returns success on 200', async () => {
      mockFetch.mockResolvedValue({ ok: true } as Response);
      const result = await deleteTeam('t1');
      expect('success' in result && result.success).toBe(true);
    });

    it('returns error on non-200', async () => {
      mockFetch.mockResolvedValue({ ok: false, status: 404 } as Response);
      const result = await deleteTeam('t1');
      expect('error' in result).toBe(true);
      if ('error' in result) expect(result.error.status).toBe(404);
    });

    it('returns error on exception', async () => {
      mockFetch.mockRejectedValue(new Error('fail'));
      const result = await deleteTeam('t1');
      expect('error' in result).toBe(true);
    });
  });

  describe('addTeamMember', () => {
    it('returns success', async () => {
      (authClient.organization.addTeamMember as jest.Mock).mockResolvedValue({ error: null });
      const result = await addTeamMember({ teamId: 't1', userId: 'u1' });
      expect('success' in result && result.success).toBe(true);
    });
  });

  describe('removeTeamMember', () => {
    it('returns success', async () => {
      (authClient.organization.removeTeamMember as jest.Mock).mockResolvedValue({ error: null });
      const result = await removeTeamMember({ teamId: 't1', userId: 'u1' });
      expect('success' in result && result.success).toBe(true);
    });
  });
});

describe('auth.ts - Sessions (fetch)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = mockFetch;
    process.env.EXPO_PUBLIC_API_URL = 'http://localhost:3002';
  });

  describe('listSessions', () => {
    it('returns sessions on 200', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([{ id: 's1' }]),
      } as Response);
      const result = await listSessions();
      if ('sessions' in result) expect(result.sessions).toEqual([{ id: 's1' }]);
    });

    it('returns error on non-200', async () => {
      mockFetch.mockResolvedValue({ ok: false, status: 401 } as Response);
      const result = await listSessions();
      expect('error' in result).toBe(true);
    });

    it('returns error on exception', async () => {
      mockFetch.mockRejectedValue(new Error('fail'));
      const result = await listSessions();
      expect('error' in result).toBe(true);
    });
  });

  describe('revokeSession', () => {
    it('returns success on 200', async () => {
      mockFetch.mockResolvedValue({ ok: true } as Response);
      const result = await revokeSession('s1');
      expect('success' in result && result.success).toBe(true);
    });

    it('returns error on non-200', async () => {
      mockFetch.mockResolvedValue({ ok: false, status: 404 } as Response);
      const result = await revokeSession('s1');
      expect('error' in result).toBe(true);
    });
  });

  describe('revokeOtherSessions', () => {
    it('returns success on 200', async () => {
      mockFetch.mockResolvedValue({ ok: true } as Response);
      const result = await revokeOtherSessions();
      expect('success' in result && result.success).toBe(true);
    });

    it('returns error on non-200', async () => {
      mockFetch.mockResolvedValue({ ok: false, status: 500 } as Response);
      const result = await revokeOtherSessions();
      expect('error' in result).toBe(true);
    });
  });
});

describe('auth.ts - Audit Logs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.EXPO_PUBLIC_API_URL = 'http://localhost:3002';
  });

  it('returns logs on 200', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{ id: 'l1' }]),
    } as Response);
    const result = await getAuditLogs('org-1');
    if ('logs' in result) expect(result.logs).toEqual([{ id: 'l1' }]);
  });

  it('returns error on non-200', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 403 } as Response);
    const result = await getAuditLogs('org-1');
    expect('error' in result).toBe(true);
  });

  it('returns error on exception', async () => {
    mockFetch.mockRejectedValue(new Error('fail'));
    const result = await getAuditLogs('org-1');
    expect('error' in result).toBe(true);
  });
});

describe('auth.ts - Role Helpers', () => {
  it('getRoleLevel returns correct levels', () => {
    expect(getRoleLevel('owner')).toBeGreaterThan(getRoleLevel('admin'));
    expect(getRoleLevel('admin')).toBeGreaterThan(getRoleLevel('member'));
    expect(getRoleLevel('unknown' as any)).toBe(0);
  });

  it('hasRoleOver checks hierarchy', () => {
    expect(hasRoleOver('owner', 'admin')).toBe(true);
    expect(hasRoleOver('admin', 'member')).toBe(true);
    expect(hasRoleOver('member', 'admin')).toBe(false);
  });

  it('isAdmin checks correctly', () => {
    expect(isAdmin('owner')).toBe(true);
    expect(isAdmin('admin')).toBe(true);
    expect(isAdmin('member')).toBe(false);
  });

  it('isOwner checks correctly', () => {
    expect(isOwner('owner')).toBe(true);
    expect(isOwner('admin')).toBe(false);
  });
});

describe('auth.ts - Ownership Transfer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.EXPO_PUBLIC_API_URL = 'http://localhost:3002';
  });

  describe('getTransferStatus', () => {
    it('returns transfer data on 200', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: 't1', status: 'pending' }),
      } as Response);
      const result = await getTransferStatus('org-1');
      if ('transfer' in result) expect(result.transfer).toEqual({ id: 't1', status: 'pending' });
    });

    it('returns error on non-200', async () => {
      mockFetch.mockResolvedValue({ ok: false, status: 404 } as Response);
      const result = await getTransferStatus('org-1');
      expect('error' in result).toBe(true);
    });

    it('returns error on exception', async () => {
      mockFetch.mockRejectedValue(new Error('fail'));
      const result = await getTransferStatus('org-1');
      expect('error' in result).toBe(true);
    });
  });

  describe('initiateOwnershipTransfer', () => {
    it('returns success on 200', async () => {
      mockFetch.mockResolvedValue({ ok: true } as Response);
      const result = await initiateOwnershipTransfer('org-1', 'user-2');
      expect('success' in result && result.success).toBe(true);
    });

    it('sends correct body', async () => {
      mockFetch.mockResolvedValue({ ok: true } as Response);
      await initiateOwnershipTransfer('org-1', 'user-2');
      expect(JSON.parse((mockFetch.mock.calls[0][1] as any).body)).toEqual({ newOwnerId: 'user-2' });
    });

    it('returns error on non-200', async () => {
      mockFetch.mockResolvedValue({ ok: false, status: 403 } as Response);
      const result = await initiateOwnershipTransfer('org-1', 'user-2');
      expect('error' in result).toBe(true);
    });
  });

  describe('cancelOwnershipTransfer', () => {
    it('returns success on 200', async () => {
      mockFetch.mockResolvedValue({ ok: true } as Response);
      const result = await cancelOwnershipTransfer('org-1');
      expect('success' in result && result.success).toBe(true);
    });

    it('uses DELETE method', async () => {
      mockFetch.mockResolvedValue({ ok: true } as Response);
      await cancelOwnershipTransfer('org-1');
      expect((mockFetch.mock.calls[0][1] as any).method).toBe('DELETE');
    });
  });

  describe('getTransferDetails', () => {
    it('returns details on 200', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: 't1' }),
      } as Response);
      const result = await getTransferDetails('token-123');
      if ('transfer' in result) expect(result.transfer).toEqual({ id: 't1' });
    });

    it('returns error on non-200', async () => {
      mockFetch.mockResolvedValue({ ok: false, status: 404 } as Response);
      const result = await getTransferDetails('token-123');
      expect('error' in result).toBe(true);
    });
  });

  describe('confirmTransfer', () => {
    it('returns success on accept', async () => {
      mockFetch.mockResolvedValue({ ok: true } as Response);
      const result = await confirmTransfer('token-123', 'accept');
      expect('success' in result && result.success).toBe(true);
    });

    it('returns success on decline', async () => {
      mockFetch.mockResolvedValue({ ok: true } as Response);
      const result = await confirmTransfer('token-123', 'decline');
      expect('success' in result && result.success).toBe(true);
    });

    it('sends correct action in body', async () => {
      mockFetch.mockResolvedValue({ ok: true } as Response);
      await confirmTransfer('token-123', 'accept');
      expect(JSON.parse((mockFetch.mock.calls[0][1] as any).body)).toEqual({ action: 'accept' });
    });

    it('returns error on non-200', async () => {
      mockFetch.mockResolvedValue({ ok: false, status: 403 } as Response);
      const result = await confirmTransfer('token-123', 'accept');
      expect('error' in result).toBe(true);
      if ('error' in result) expect(result.error.message).toContain('accept');
    });
  });
});

describe('auth.ts - Org Ban Status', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.EXPO_PUBLIC_API_URL = 'http://localhost:3002';
  });

  it('returns ban status', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ isBanned: true, reason: 'Violation' }),
    } as Response);
    const result = await getOrgBanStatus('org-1');
    if ('isBanned' in result) {
      expect(result.isBanned).toBe(true);
      expect(result.reason).toBe('Violation');
    }
  });

  it('returns not banned by default', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    } as Response);
    const result = await getOrgBanStatus('org-1');
    if ('isBanned' in result) expect(result.isBanned).toBe(false);
  });

  it('returns error on non-200', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 404 } as Response);
    const result = await getOrgBanStatus('org-1');
    expect('error' in result).toBe(true);
  });

  it('returns error on exception', async () => {
    mockFetch.mockRejectedValue(new Error('fail'));
    const result = await getOrgBanStatus('org-1');
    expect('error' in result).toBe(true);
  });
});
