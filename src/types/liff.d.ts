// Type definitions for LINE LIFF SDK
declare global {
    interface Window {
        liff: {
            init: (config: { liffId: string }) => Promise<void>;
            isLoggedIn: () => boolean;
            login: (config?: { redirectUri?: string }) => void;
            logout: () => void;
            getProfile: () => Promise<{
                userId: string;
                displayName: string;
                pictureUrl?: string;
                statusMessage?: string;
            }>;
            getAccessToken: () => string | null;
            getIDToken: () => string | null;
            getDecodedIDToken: () => {
                sub: string;
                name: string;
                picture?: string;
                email?: string;
            } | null;
            isInClient: () => boolean;
            getOS: () => 'ios' | 'android' | 'web';
            getLanguage: () => string;
            getVersion: () => string;
            getLineVersion: () => string | null;
            isApiAvailable: (apiName: string) => boolean;
            sendMessages: (messages: any[]) => Promise<void>;
            openWindow: (params: { url: string; external?: boolean }) => void;
            closeWindow: () => void;
            scanCode: () => Promise<{ value: string }>;
            // Custom properties from liff.js
            data?: {
                browserLanguage: string;
                sdkVersion: string;
                lineVersion: string | null;
                isInClient: boolean;
                isLoggedIn: boolean;
                deviceOS: string;
            };
            profile?: {
                userId: string;
                displayName: string;
                pictureUrl?: string;
                statusMessage?: string;
                accessToken: string | null;
            };
        };
    }
}

export { };
