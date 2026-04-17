jest.mock('../lib/http-auth-client', () => ({
  httpAuthClient: {
    signUpEmail: jest.fn(),
    signInEmail: jest.fn(),
    socialSignInCallback: jest.fn(),
    signOut: jest.fn(),
    getSession: jest.fn(),
    forgotPassword: jest.fn(),
    resetPassword: jest.fn(),
    changePassword: jest.fn(),
    sendVerificationOtp: jest.fn(),
    verifyEmail: jest.fn(),
    enableTwoFactor: jest.fn(),
    verifyTwoFactorSetup: jest.fn(),
    disableTwoFactor: jest.fn(),
    generateBackupCodes: jest.fn(),
    signInWithTwoFactor: jest.fn(),
    updateUser: jest.fn(),
    listOrganizations: jest.fn(),
    getActiveOrganization: jest.fn(),
    setActiveOrganization: jest.fn(),
    createOrganization: jest.fn(),
    getFullOrganization: jest.fn(),
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
    listSessions: jest.fn(),
    revokeSession: jest.fn(),
    revokeOtherSessions: jest.fn(),
    leaveOrganization: jest.fn(),
  },
}));

import { authClient, getApiBaseURL, validateClientConfig } from '../lib/auth-client';
import { httpAuthClient } from '../lib/http-auth-client';

describe('authClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.EXPO_PUBLIC_API_URL = 'http://localhost:3002';
  });

  describe('signUp', () => {
    it('delegates to httpAuthClient.signUpEmail', async () => {
      (httpAuthClient.signUpEmail as jest.Mock).mockResolvedValue({ data: { user: {} }, error: null });
      await authClient.signUp.email({ name: 'A', email: 'a@b.com', password: 'pass' });
      expect(httpAuthClient.signUpEmail).toHaveBeenCalledWith({ name: 'A', email: 'a@b.com', password: 'pass' });
    });
  });

  describe('signIn', () => {
    it('delegates email to httpAuthClient.signInEmail', async () => {
      (httpAuthClient.signInEmail as jest.Mock).mockResolvedValue({ data: {}, error: null });
      await authClient.signIn.email({ email: 'a@b.com', password: 'pass' });
      expect(httpAuthClient.signInEmail).toHaveBeenCalledWith({ email: 'a@b.com', password: 'pass' });
    });

    it('delegates google callback to httpAuthClient.socialSignInCallback', async () => {
      (httpAuthClient.socialSignInCallback as jest.Mock).mockResolvedValue({ data: {}, error: null });
      await authClient.signIn.social.google.callback({ code: 'abc' });
      expect(httpAuthClient.socialSignInCallback).toHaveBeenCalledWith({ provider: 'google', code: 'abc' });
    });

    it('delegates microsoft callback to httpAuthClient.socialSignInCallback', async () => {
      (httpAuthClient.socialSignInCallback as jest.Mock).mockResolvedValue({ data: {}, error: null });
      await authClient.signIn.social.microsoft.callback({ code: 'xyz', state: 'st' });
      expect(httpAuthClient.socialSignInCallback).toHaveBeenCalledWith({ provider: 'microsoft', code: 'xyz', state: 'st' });
    });
  });

  describe('signOut', () => {
    it('delegates to httpAuthClient.signOut', async () => {
      (httpAuthClient.signOut as jest.Mock).mockResolvedValue({ error: null });
      await authClient.signOut();
      expect(httpAuthClient.signOut).toHaveBeenCalled();
    });
  });

  describe('getSession', () => {
    it('delegates to httpAuthClient.getSession', async () => {
      (httpAuthClient.getSession as jest.Mock).mockResolvedValue({ data: { user: {} }, error: null });
      await authClient.getSession();
      expect(httpAuthClient.getSession).toHaveBeenCalled();
    });
  });

  describe('password management', () => {
    it('forgotPassword delegates', async () => {
      (httpAuthClient.forgotPassword as jest.Mock).mockResolvedValue({ error: null });
      await authClient.forgotPassword({ email: 'a@b.com' });
      expect(httpAuthClient.forgotPassword).toHaveBeenCalledWith({ email: 'a@b.com' });
    });

    it('resetPassword delegates', async () => {
      (httpAuthClient.resetPassword as jest.Mock).mockResolvedValue({ error: null });
      await authClient.resetPassword({ password: 'new', token: 'tok' });
      expect(httpAuthClient.resetPassword).toHaveBeenCalledWith({ password: 'new', token: 'tok' });
    });

    it('changePassword delegates', async () => {
      (httpAuthClient.changePassword as jest.Mock).mockResolvedValue({ error: null });
      await authClient.changePassword({ currentPassword: 'old', newPassword: 'new' });
      expect(httpAuthClient.changePassword).toHaveBeenCalledWith({ currentPassword: 'old', newPassword: 'new' });
    });
  });

  describe('email verification', () => {
    it('sendVerificationOtp delegates', async () => {
      (httpAuthClient.sendVerificationOtp as jest.Mock).mockResolvedValue({ error: null });
      await authClient.sendVerificationOtp({ email: 'a@b.com' });
      expect(httpAuthClient.sendVerificationOtp).toHaveBeenCalledWith({ email: 'a@b.com' });
    });

    it('verifyEmail delegates', async () => {
      (httpAuthClient.verifyEmail as jest.Mock).mockResolvedValue({ error: null });
      await authClient.verifyEmail({ code: '123456' });
      expect(httpAuthClient.verifyEmail).toHaveBeenCalledWith({ code: '123456' });
    });
  });

  describe('two factor', () => {
    it('enable delegates', async () => {
      (httpAuthClient.enableTwoFactor as jest.Mock).mockResolvedValue({ data: {} });
      await authClient.twoFactor.enable();
      expect(httpAuthClient.enableTwoFactor).toHaveBeenCalled();
    });

    it('verifySetup delegates', async () => {
      (httpAuthClient.verifyTwoFactorSetup as jest.Mock).mockResolvedValue({ data: {} });
      await authClient.twoFactor.verifySetup({ code: '123' });
      expect(httpAuthClient.verifyTwoFactorSetup).toHaveBeenCalledWith({ code: '123' });
    });

    it('disable delegates', async () => {
      (httpAuthClient.disableTwoFactor as jest.Mock).mockResolvedValue({ data: {} });
      await authClient.twoFactor.disable({ password: 'pass' });
      expect(httpAuthClient.disableTwoFactor).toHaveBeenCalledWith({ password: 'pass' });
    });

    it('generateBackupCodes delegates', async () => {
      (httpAuthClient.generateBackupCodes as jest.Mock).mockResolvedValue({ data: {} });
      await authClient.twoFactor.generateBackupCodes();
      expect(httpAuthClient.generateBackupCodes).toHaveBeenCalled();
    });
  });

  describe('updateUser', () => {
    it('delegates to httpAuthClient.updateUser', async () => {
      (httpAuthClient.updateUser as jest.Mock).mockResolvedValue({ error: null });
      await authClient.updateUser({ name: 'New Name' });
      expect(httpAuthClient.updateUser).toHaveBeenCalledWith({ name: 'New Name' });
    });
  });

  describe('organization', () => {
    it('list delegates', async () => {
      (httpAuthClient.listOrganizations as jest.Mock).mockResolvedValue({ data: [], error: null });
      await authClient.organization.list();
      expect(httpAuthClient.listOrganizations).toHaveBeenCalled();
    });

    it('getActive delegates', async () => {
      (httpAuthClient.getActiveOrganization as jest.Mock).mockResolvedValue({ data: null, error: null });
      await authClient.organization.getActive();
      expect(httpAuthClient.getActiveOrganization).toHaveBeenCalled();
    });

    it('setActive delegates', async () => {
      (httpAuthClient.setActiveOrganization as jest.Mock).mockResolvedValue({ error: null });
      await authClient.organization.setActive({ organizationId: 'org-1' });
      expect(httpAuthClient.setActiveOrganization).toHaveBeenCalledWith({ organizationId: 'org-1' });
    });

    it('create delegates', async () => {
      (httpAuthClient.createOrganization as jest.Mock).mockResolvedValue({ data: {}, error: null });
      await authClient.organization.create({ name: 'Org', slug: 'org' });
      expect(httpAuthClient.createOrganization).toHaveBeenCalledWith({ name: 'Org', slug: 'org' });
    });

    it('getFullOrganization delegates', async () => {
      (httpAuthClient.getFullOrganization as jest.Mock).mockResolvedValue({ data: {}, error: null });
      await authClient.organization.getFullOrganization();
      expect(httpAuthClient.getFullOrganization).toHaveBeenCalled();
    });

    it('listMembers delegates with query transform', async () => {
      (httpAuthClient.listMembers as jest.Mock).mockResolvedValue({ data: [], error: null });
      await authClient.organization.listMembers({ query: { organizationId: 'org-1' } });
      expect(httpAuthClient.listMembers).toHaveBeenCalledWith({ organizationId: 'org-1' });
    });

    it('removeMember delegates', async () => {
      (httpAuthClient.removeMember as jest.Mock).mockResolvedValue({ error: null });
      await authClient.organization.removeMember({ memberIdOrEmail: 'm1', organizationId: 'o1' });
      expect(httpAuthClient.removeMember).toHaveBeenCalledWith({ memberIdOrEmail: 'm1', organizationId: 'o1' });
    });

    it('updateMemberRole delegates', async () => {
      (httpAuthClient.updateMemberRole as jest.Mock).mockResolvedValue({ error: null });
      await authClient.organization.updateMemberRole({ memberId: 'm1', role: 'admin', organizationId: 'o1' });
      expect(httpAuthClient.updateMemberRole).toHaveBeenCalledWith({ memberId: 'm1', role: 'admin', organizationId: 'o1' });
    });

    it('listInvitations delegates with query transform', async () => {
      (httpAuthClient.listInvitations as jest.Mock).mockResolvedValue({ data: [], error: null });
      await authClient.organization.listInvitations({ query: { organizationId: 'o1' } });
      expect(httpAuthClient.listInvitations).toHaveBeenCalledWith({ organizationId: 'o1' });
    });

    it('getInvitation delegates with query transform', async () => {
      (httpAuthClient.getInvitation as jest.Mock).mockResolvedValue({ data: {}, error: null });
      await authClient.organization.getInvitation({ query: { id: 'inv1' } });
      expect(httpAuthClient.getInvitation).toHaveBeenCalledWith({ id: 'inv1' });
    });

    it('acceptInvitation delegates', async () => {
      (httpAuthClient.acceptInvitation as jest.Mock).mockResolvedValue({ error: null });
      await authClient.organization.acceptInvitation({ invitationId: 'inv1' });
      expect(httpAuthClient.acceptInvitation).toHaveBeenCalledWith({ invitationId: 'inv1' });
    });

    it('rejectInvitation delegates', async () => {
      (httpAuthClient.rejectInvitation as jest.Mock).mockResolvedValue({ error: null });
      await authClient.organization.rejectInvitation({ invitationId: 'inv1' });
      expect(httpAuthClient.rejectInvitation).toHaveBeenCalledWith({ invitationId: 'inv1' });
    });

    it('inviteMember delegates', async () => {
      (httpAuthClient.inviteMember as jest.Mock).mockResolvedValue({ data: {}, error: null });
      await authClient.organization.inviteMember({ organizationId: 'o1', email: 'a@b.com', role: 'member' });
      expect(httpAuthClient.inviteMember).toHaveBeenCalledWith({ organizationId: 'o1', email: 'a@b.com', role: 'member' });
    });

    it('cancelInvitation delegates', async () => {
      (httpAuthClient.cancelInvitation as jest.Mock).mockResolvedValue({ error: null });
      await authClient.organization.cancelInvitation({ invitationId: 'inv1' });
      expect(httpAuthClient.cancelInvitation).toHaveBeenCalledWith('inv1');
    });

    it('listTeams delegates with query transform', async () => {
      (httpAuthClient.listTeams as jest.Mock).mockResolvedValue({ data: [], error: null });
      await authClient.organization.listTeams({ query: { organizationId: 'o1' } });
      expect(httpAuthClient.listTeams).toHaveBeenCalledWith('o1');
    });

    it('createTeam delegates', async () => {
      (httpAuthClient.createTeam as jest.Mock).mockResolvedValue({ data: {}, error: null });
      await authClient.organization.createTeam({ name: 'Team', organizationId: 'o1' });
      expect(httpAuthClient.createTeam).toHaveBeenCalledWith({ name: 'Team', organizationId: 'o1' });
    });

    it('updateTeam delegates', async () => {
      (httpAuthClient.updateTeam as jest.Mock).mockResolvedValue({ error: null });
      await authClient.organization.updateTeam({ teamId: 't1', data: { name: 'Updated' } });
      expect(httpAuthClient.updateTeam).toHaveBeenCalledWith({ teamId: 't1', data: { name: 'Updated' } });
    });

    it('addTeamMember delegates', async () => {
      (httpAuthClient.addTeamMember as jest.Mock).mockResolvedValue({ error: null });
      await authClient.organization.addTeamMember({ teamId: 't1', userId: 'u1' });
      expect(httpAuthClient.addTeamMember).toHaveBeenCalledWith({ teamId: 't1', userId: 'u1' });
    });

    it('removeTeamMember delegates', async () => {
      (httpAuthClient.removeTeamMember as jest.Mock).mockResolvedValue({ error: null });
      await authClient.organization.removeTeamMember({ teamId: 't1', userId: 'u1' });
      expect(httpAuthClient.removeTeamMember).toHaveBeenCalledWith({ teamId: 't1', userId: 'u1' });
    });
  });

  describe('session', () => {
    it('list delegates', async () => {
      (httpAuthClient.listSessions as jest.Mock).mockResolvedValue({ data: [], error: null });
      await authClient.session.list();
      expect(httpAuthClient.listSessions).toHaveBeenCalled();
    });

    it('revoke delegates', async () => {
      (httpAuthClient.revokeSession as jest.Mock).mockResolvedValue({ error: null });
      await authClient.session.revoke({ sessionId: 's1' });
      expect(httpAuthClient.revokeSession).toHaveBeenCalledWith({ sessionId: 's1' });
    });

    it('revokeOthers delegates', async () => {
      (httpAuthClient.revokeOtherSessions as jest.Mock).mockResolvedValue({ error: null });
      await authClient.session.revokeOthers();
      expect(httpAuthClient.revokeOtherSessions).toHaveBeenCalled();
    });
  });
});

describe('getApiBaseURL', () => {
  it('returns env var when set', () => {
    process.env.EXPO_PUBLIC_API_URL = 'http://myapi.com';
    expect(getApiBaseURL()).toBe('http://myapi.com');
  });

  it('returns default when not set', () => {
    delete process.env.EXPO_PUBLIC_API_URL;
    expect(getApiBaseURL()).toBe('http://localhost:3002');
  });
});

describe('validateClientConfig', () => {
  it('returns true for valid URL', () => {
    process.env.EXPO_PUBLIC_API_URL = 'http://localhost:3002';
    expect(validateClientConfig()).toBe(true);
  });

  it('returns false when URL not set', () => {
    delete process.env.EXPO_PUBLIC_API_URL;
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
    expect(validateClientConfig()).toBe(false);
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('returns false for invalid URL', () => {
    process.env.EXPO_PUBLIC_API_URL = 'not-a-url';
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
    expect(validateClientConfig()).toBe(false);
    warnSpy.mockRestore();
  });
});
