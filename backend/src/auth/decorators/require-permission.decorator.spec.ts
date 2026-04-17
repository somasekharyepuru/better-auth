import { Reflector } from '@nestjs/core';
import { RequireOrgPermission, Public } from './require-permission.decorator';
import { PERMISSIONS_METADATA_KEY } from './permissions-metadata.constant';

describe('RequireOrgPermission Decorator', () => {
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
  });

  describe('RequireOrgPermission with single permission', () => {
    it('should set metadata for resource and action', () => {
      class TestClass {
        @RequireOrgPermission('member', 'delete')
        testMethod() {}
      }

      const metadata = reflector.get(PERMISSIONS_METADATA_KEY, new TestClass().testMethod);

      expect(metadata).toEqual({
        resource: 'member',
        action: 'delete',
      });
    });

    it('should work with different resource-action combinations', () => {
      class TestClass {
        @RequireOrgPermission('organization', 'update')
        method1() {}

        @RequireOrgPermission('team', 'create')
        method2() {}

        @RequireOrgPermission('invitation', 'cancel')
        method3() {}
      }

      const instance = new TestClass();

      expect(reflector.get(PERMISSIONS_METADATA_KEY, instance.method1)).toEqual({
        resource: 'organization',
        action: 'update',
      });

      expect(reflector.get(PERMISSIONS_METADATA_KEY, instance.method2)).toEqual({
        resource: 'team',
        action: 'create',
      });

      expect(reflector.get(PERMISSIONS_METADATA_KEY, instance.method3)).toEqual({
        resource: 'invitation',
        action: 'cancel',
      });
    });
  });

  describe('RequireOrgPermission with multiple permissions', () => {
    it('should set metadata for permission object', () => {
      class TestClass {
        @RequireOrgPermission({
          member: ['read', 'update'],
          team: ['create', 'delete'],
        })
        testMethod() {}
      }

      const metadata = reflector.get(PERMISSIONS_METADATA_KEY, new TestClass().testMethod);

      expect(metadata).toEqual({
        permissions: {
          member: ['read', 'update'],
          team: ['create', 'delete'],
        },
      });
    });

    it('should work with single permission in object format', () => {
      class TestClass {
        @RequireOrgPermission({ member: ['delete'] })
        testMethod() {}
      }

      const metadata = reflector.get(PERMISSIONS_METADATA_KEY, new TestClass().testMethod);

      expect(metadata).toEqual({
        permissions: {
          member: ['delete'],
        },
      });
    });
  });

  describe('RequireOrgPermission as class decorator', () => {
    it('should set metadata on class level', () => {
      @RequireOrgPermission('organization', 'update')
      class TestClass {
        testMethod() {}
      }

      const metadata = reflector.get(PERMISSIONS_METADATA_KEY, TestClass);

      expect(metadata).toEqual({
        resource: 'organization',
        action: 'update',
      });
    });

    it('should support object permissions at class level', () => {
      @RequireOrgPermission({ team: ['read', 'update'] })
      class TestClass {
        testMethod() {}
      }

      const metadata = reflector.get(PERMISSIONS_METADATA_KEY, TestClass);

      expect(metadata).toEqual({
        permissions: {
          team: ['read', 'update'],
        },
      });
    });
  });

  describe('Method decorator takes precedence over class decorator', () => {
    it('should use method metadata when both exist', () => {
      @RequireOrgPermission('organization', 'read')
      class TestClass {
        @RequireOrgPermission('member', 'delete')
        testMethod() {}
      }

      const classMetadata = reflector.get(PERMISSIONS_METADATA_KEY, TestClass);
      const methodMetadata = reflector.get(PERMISSIONS_METADATA_KEY, new TestClass().testMethod);

      expect(classMetadata).toEqual({
        resource: 'organization',
        action: 'read',
      });

      expect(methodMetadata).toEqual({
        resource: 'member',
        action: 'delete',
      });
    });
  });

  describe('Public decorator', () => {
    it('should set isPublic metadata', () => {
      class TestClass {
        @Public()
        testMethod() {}
      }

      const metadata = reflector.get('isPublic', new TestClass().testMethod);

      expect(metadata).toBe(true);
    });

    it('should work as class decorator', () => {
      @Public()
      class TestClass {
        testMethod() {}
      }

      const metadata = reflector.get('isPublic', TestClass);

      expect(metadata).toBe(true);
    });

    it('should not affect other metadata', () => {
      class TestClass {
        @RequireOrgPermission('member', 'read')
        @Public()
        testMethod() {}
      }

      const publicMetadata = reflector.get('isPublic', new TestClass().testMethod);
      const permissionMetadata = reflector.get(PERMISSIONS_METADATA_KEY, new TestClass().testMethod);

      expect(publicMetadata).toBe(true);
      expect(permissionMetadata).toEqual({
        resource: 'member',
        action: 'read',
      });
    });
  });

  describe('Edge cases and type safety', () => {
    it('should handle empty string resource', () => {
      class TestClass {
        @RequireOrgPermission('', 'delete')
        testMethod() {}
      }

      const metadata = reflector.get(PERMISSIONS_METADATA_KEY, new TestClass().testMethod);

      expect(metadata).toEqual({
        resource: '',
        action: 'delete',
      });
    });

    it('should handle empty string action', () => {
      class TestClass {
        @RequireOrgPermission('member', '')
        testMethod() {}
      }

      const metadata = reflector.get(PERMISSIONS_METADATA_KEY, new TestClass().testMethod);

      expect(metadata).toEqual({
        resource: 'member',
        action: '',
      });
    });

    it('should handle empty permissions object', () => {
      class TestClass {
        @RequireOrgPermission({})
        testMethod() {}
      }

      const metadata = reflector.get(PERMISSIONS_METADATA_KEY, new TestClass().testMethod);

      expect(metadata).toEqual({
        permissions: {},
      });
    });

    it('should handle null action in single permission form', () => {
      class TestClass {
        @RequireOrgPermission('member', null as any)
        testMethod() {}
      }

      const metadata = reflector.get(PERMISSIONS_METADATA_KEY, new TestClass().testMethod);

      expect(metadata).toEqual({
        resource: 'member',
        action: null,
      });
    });

    it('should handle undefined action in single permission form', () => {
      class TestClass {
        @RequireOrgPermission('member', undefined as any)
        testMethod() {}
      }

      const metadata = reflector.get(PERMISSIONS_METADATA_KEY, new TestClass().testMethod);

      expect(metadata).toEqual({
        resource: 'member',
        action: undefined,
      });
    });
  });

  describe('Multiple decorators on same method', () => {
    it('should allow stacking multiple RequireOrgPermission decorators (last one wins)', () => {
      class TestClass {
        @RequireOrgPermission('member', 'read')
        @RequireOrgPermission('team', 'create')
        testMethod() {}
      }

      const metadata = reflector.get(PERMISSIONS_METADATA_KEY, new TestClass().testMethod);

      // Decorators are applied bottom-to-top, so first listed wins
      expect(metadata).toEqual({
        resource: 'member',
        action: 'read',
      });
    });

    it('should work with Public and RequireOrgPermission together', () => {
      class TestClass {
        @Public()
        @RequireOrgPermission('member', 'delete')
        testMethod() {}
      }

      const instance = new TestClass();
      const publicMetadata = reflector.get('isPublic', instance.testMethod);
      const permissionMetadata = reflector.get(PERMISSIONS_METADATA_KEY, instance.testMethod);

      expect(publicMetadata).toBe(true);
      expect(permissionMetadata).toEqual({
        resource: 'member',
        action: 'delete',
      });
    });
  });

  describe('Permissions with multiple actions', () => {
    it('should handle multiple actions for single resource', () => {
      class TestClass {
        @RequireOrgPermission({ member: ['read', 'update', 'delete'] })
        testMethod() {}
      }

      const metadata = reflector.get(PERMISSIONS_METADATA_KEY, new TestClass().testMethod);

      expect(metadata).toEqual({
        permissions: {
          member: ['read', 'update', 'delete'],
        },
      });
    });

    it('should handle multiple resources with multiple actions', () => {
      class TestClass {
        @RequireOrgPermission({
          member: ['read', 'delete'],
          team: ['create', 'update', 'delete'],
          organization: ['update'],
          invitation: ['read', 'cancel'],
        })
        testMethod() {}
      }

      const metadata = reflector.get(PERMISSIONS_METADATA_KEY, new TestClass().testMethod);

      expect(metadata).toEqual({
        permissions: {
          member: ['read', 'delete'],
          team: ['create', 'update', 'delete'],
          organization: ['update'],
          invitation: ['read', 'cancel'],
        },
      });
    });
  });

  describe('Special resource names', () => {
    it('should handle "ac" (access control) resource', () => {
      class TestClass {
        @RequireOrgPermission('ac', 'create')
        testMethod() {}
      }

      const metadata = reflector.get(PERMISSIONS_METADATA_KEY, new TestClass().testMethod);

      expect(metadata).toEqual({
        resource: 'ac',
        action: 'create',
      });
    });

    it('should handle numeric-like action names', () => {
      class TestClass {
        @RequireOrgPermission('member', '2fa')
        testMethod() {}
      }

      const metadata = reflector.get(PERMISSIONS_METADATA_KEY, new TestClass().testMethod);

      expect(metadata).toEqual({
        resource: 'member',
        action: '2fa',
      });
    });
  });
});
