import 'better-auth/types';

declare module 'better-auth/types' {
    interface User {
        name: string;
        role?: string;
    }
}