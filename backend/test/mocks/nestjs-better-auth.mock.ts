export const Session = () => (_target: any, _propertyKey: string, _descriptor: PropertyDescriptor) => {
  // Mock decorator
};

export const AllowAnonymous = () => (_target: any, _propertyKey: string, _descriptor: PropertyDescriptor) => {
  // Mock decorator
};

export interface UserSession {
  user: {
    id: string;
    email: string;
    name: string;
  };
  session: {
    id: string;
    activeOrganizationId?: string;
  };
}

export function fromNodeHeaders(_headers: any): any {
  return {};
}
