export const auth = {
  api: {
    signUp: jest.fn(),
    signIn: jest.fn(),
    signOut: jest.fn(),
    getSession: jest.fn(),
    getUser: jest.fn(),
    updateTeam: jest.fn(),
    removeTeam: jest.fn(),
  },
  handler: jest.fn(),
};

export const emailOTP = jest.fn();
export const admin = jest.fn();
export const twoFactor = jest.fn();
export const organization = jest.fn();
export const haveIBeenPwned = jest.fn();
export const prismaAdapter = jest.fn();
export const betterAuth = jest.fn();

// Mock role definitions for permission ceiling validation
export const owner = {
  authorize: jest.fn().mockReturnValue({ success: true }),
};

export const adminRole = {
  authorize: jest.fn().mockReturnValue({ success: true }),
};

export const manager = {
  authorize: jest.fn((perms) => {
    // Manager can update org, read/update members, invitations, teams
    const hasAccess = Object.entries(perms).every(([resource, actions]) => {
      if (resource === 'organization') return actions.every(a => a === 'update');
      if (resource === 'member') return actions.every(a => ['read', 'update'].includes(a));
      if (resource === 'invitation') return actions.every(a => ['read', 'cancel'].includes(a));
      if (resource === 'team') return actions.every(a => ['read', 'update'].includes(a));
      return false;
    });
    return { success: hasAccess };
  }),
};

export const member = {
  authorize: jest.fn().mockReturnValue({ success: false }),
};

export const viewer = {
  authorize: jest.fn().mockReturnValue({ success: false }),
};
