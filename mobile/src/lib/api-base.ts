export function getMobileApiBaseURL(): string {
    const configuredUrl = process.env.EXPO_PUBLIC_API_URL;
    if (!configuredUrl) {
        throw new Error('EXPO_PUBLIC_API_URL is not set');
    }

    return configuredUrl;
}