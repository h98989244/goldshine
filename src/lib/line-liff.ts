/* eslint-disable @typescript-eslint/no-explicit-any */
// Adapted from user provided liff.js

const defaultLiffId = import.meta.env.VITE_LIFF_ID || '';
const useNodeJS = false; // Defaulting to false for static build unless configured

export interface LiffProfile {
    userId: string;
    displayName: string;
    pictureUrl?: string;
    statusMessage?: string;
}

export const lineLiff = {
    data: {} as any,
    profile: null as LiffProfile | null,

    async init(): Promise<{ isLoggedIn: boolean; profile: LiffProfile | null }> {
        let myLiffId = defaultLiffId;

        if (useNodeJS) {
            try {
                const req = await fetch('/send-id');
                const json = await req.json();
                myLiffId = json.id;
            } catch (error) {
                console.error('Error fetching LIFF ID:', error);
                throw error;
            }
        }

        if (!myLiffId) {
            console.warn('No LIFF ID found. Skipping LIFF initialization.');
            return { isLoggedIn: false, profile: null };
        }

        await window.liff.init({ liffId: myLiffId });

        // Initialize App Logic from original file
        this.data.browserLanguage = window.liff.getLanguage();
        this.data.sdkVersion = window.liff.getVersion();
        this.data.lineVersion = window.liff.getLineVersion();
        this.data.isInClient = window.liff.isInClient();
        this.data.isLoggedIn = window.liff.isLoggedIn();
        this.data.deviceOS = window.liff.getOS();

        if (window.liff.isLoggedIn()) {
            try {
                const profile = await window.liff.getProfile();
                this.profile = profile;
                return { isLoggedIn: true, profile };
            } catch (error: any) {
                if (error.message === 'The access token revoked') {
                    this.logout();
                    window.location.reload();
                }
                console.error('Error getting profile:', error);
                throw error;
            }
        }

        return { isLoggedIn: false, profile: null };
    },

    login(redirectUri?: string) {
        if (!window.liff.isLoggedIn()) {
            window.liff.login({
                redirectUri: redirectUri || window.location.href
            });
        }
    },

    logout() {
        if (window.liff.isLoggedIn()) {
            window.liff.logout();
            window.location.reload();
        }
    },

    isInClient() {
        return window.liff.isInClient();
    }
};
