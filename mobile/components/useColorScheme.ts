/**
 * Custom useColorScheme hook that defaults to 'light' theme
 * for a consistent, premium appearance
 */

import { useColorScheme as useRNColorScheme, ColorSchemeName } from 'react-native';

export function useColorScheme(): ColorSchemeName {
    // We must call the hook to maintain consistent hook order across renders
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _systemScheme = useRNColorScheme();

    // Always return 'light' for consistent premium appearance
    // To follow system preference, change this to: return _systemScheme;
    return 'light';
}
