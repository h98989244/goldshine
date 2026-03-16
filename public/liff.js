/* eslint-disable no-unused-vars */
/**
 * LIFF Helper Functions
 * This file provides utility functions for LIFF SDK
 * LIFF initialization is handled by the React application
 */

// Extend LIFF object with custom data property when LIFF is initialized
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', function () {
    console.log('LIFF helper loaded. Initialization will be handled by React app.');
  });
}

/**
 * Helper function to safely initialize LIFF data
 * This is called from React components after LIFF.init()
 */
window.initializeLiffData = function () {
  if (typeof liff !== 'undefined' && liff.isLoggedIn) {
    try {
      liff.data = liff.data || {};
      liff.data['browserLanguage'] = liff.getLanguage();
      liff.data['sdkVersion'] = liff.getVersion();
      liff.data['lineVersion'] = liff.getLineVersion();
      liff.data['isInClient'] = liff.isInClient();
      liff.data['isLoggedIn'] = liff.isLoggedIn();
      liff.data['deviceOS'] = liff.getOS();
      console.log('LIFF data initialized:', liff.data);
    } catch (error) {
      console.error('Error initializing LIFF data:', error);
    }
  }
};

/**
 * Helper function to get LIFF profile with access token
 * This is called from React components
 */
window.getLiffProfileWithToken = async function () {
  if (typeof liff !== 'undefined' && liff.isLoggedIn && liff.isLoggedIn()) {
    try {
      const profile = await liff.getProfile();
      profile.accessToken = liff.getAccessToken();
      liff.profile = profile;
      return profile;
    } catch (error) {
      console.error('Error getting LIFF profile:', error);
      throw error;
    }
  }
  return null;
};
