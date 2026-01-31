import kingsChatWebSdk from 'kingschat-web-sdk';
import { supabase } from '@/integrations/supabase/client';

// Import Kingschat styles
import 'kingschat-web-sdk/dist/stylesheets/style.min.css';

// Cache the client ID after first fetch
let cachedClientId: string | null = null;

export interface KingschatAuthResult {
  success: boolean;
  error?: string;
}

export interface KingschatTokenResponse {
  accessToken: string;
  expiresInMillis: number;
  refreshToken: string;
}

export interface KingschatUserProfile {
  id: string;
  email?: string;
  name?: string;
  username?: string;
  phone_number?: string;
  gender?: string;
  birth_date_millis?: number;
  avatar?: string;
}

/**
 * Fetches the Kingschat Client ID from the backend
 */
async function getKingschatClientId(): Promise<string | null> {
  if (cachedClientId) {
    return cachedClientId;
  }

  try {
    const { data, error } = await supabase.functions.invoke('kingschat-config');
    
    if (error) {
      console.error('Error fetching Kingschat config:', error);
      return null;
    }

    if (data?.clientId) {
      cachedClientId = data.clientId;
      return cachedClientId;
    }

    return null;
  } catch (error) {
    console.error('Error fetching Kingschat config:', error);
    return null;
  }
}

/**
 * Fetches user profile from Kingschat using the access token
 * Using the correct endpoint: https://connect.kingsch.at/developer/api/profile
 */
async function fetchKingschatUserProfile(accessToken: string): Promise<KingschatUserProfile | null> {
  try {
    const response = await fetch('https://connect.kingsch.at/developer/api/profile', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch Kingschat profile, status:', response.status);
      throw new Error('Failed to fetch user profile from Kingschat');
    }

    const data = await response.json();
    console.log('Kingschat profile response:', data);
    
    // The response contains { profile: { ... } }
    return data.profile || data;
  } catch (error) {
    console.error('Error fetching Kingschat user profile:', error);
    return null;
  }
}

/**
 * Initiates Kingschat OAuth login flow
 * Opens a popup for Kingschat authentication
 */
export async function loginWithKingschat(): Promise<KingschatAuthResult> {
  const clientId = await getKingschatClientId();
  
  if (!clientId) {
    console.error('KINGSCHAT_CLIENT_ID is not configured');
    return { 
      success: false, 
      error: 'Kingschat authentication is not configured. Please contact support.' 
    };
  }

  try {
    console.log('Starting Kingschat login with client ID:', clientId);
    
    // Step 1: Get tokens from Kingschat SDK
    // The SDK opens a popup and handles the OAuth flow
    const tokenResponse: KingschatTokenResponse = await kingsChatWebSdk.login({
      clientId: clientId,
      scopes: ['send_chat_message'],
    });

    console.log('Kingschat login successful, received tokens');
    console.log('Access token received:', tokenResponse.accessToken ? 'Yes' : 'No');

    // Step 2: Fetch user profile from Kingschat
    const userProfile = await fetchKingschatUserProfile(tokenResponse.accessToken);
    
    if (!userProfile) {
      console.error('Failed to fetch user profile');
      return { success: false, error: 'Failed to fetch your Kingschat profile' };
    }

    console.log('Kingschat user profile:', userProfile);

    // Step 3: Exchange Kingschat tokens for Supabase session via edge function
    const { data, error } = await supabase.functions.invoke('kingschat-auth', {
      body: {
        accessToken: tokenResponse.accessToken,
        refreshToken: tokenResponse.refreshToken,
        expiresInMillis: tokenResponse.expiresInMillis,
        userInfo: {
          id: userProfile.id,
          email: userProfile.email,
          name: userProfile.name,
          username: userProfile.username,
          avatar: userProfile.avatar,
          phone_number: userProfile.phone_number,
        },
      },
    });

    if (error) {
      console.error('Error exchanging Kingschat token:', error);
      return { success: false, error: error.message || 'Authentication failed' };
    }

    console.log('Edge function response:', data);

    if (data?.token && data?.tokenType) {
      // Verify the magic link token to create a session
      const { error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: data.token,
        type: data.tokenType,
      });

      if (verifyError) {
        console.error('Error verifying OTP:', verifyError);
        return { success: false, error: 'Failed to complete authentication' };
      }

      console.log('Kingschat authentication completed successfully');
      return { success: true };
    }

    return { success: false, error: 'Authentication response invalid' };
  } catch (error: any) {
    console.error('Kingschat login error:', error);
    
    // Handle popup closed by user
    if (error.message?.includes('closed') || error.message?.includes('cancelled')) {
      return { success: false, error: 'Login was cancelled' };
    }
    
    return { 
      success: false, 
      error: error.message || 'Failed to authenticate with Kingschat' 
    };
  }
}

/**
 * Refreshes Kingschat authentication token
 */
export async function refreshKingschatToken(refreshToken: string): Promise<KingschatTokenResponse | null> {
  const clientId = await getKingschatClientId();
  
  if (!clientId) {
    console.error('KINGSCHAT_CLIENT_ID is not configured');
    return null;
  }

  try {
    const tokenResponse = await kingsChatWebSdk.refreshAuthenticationToken({
      clientId: clientId,
      refreshToken,
    });

    return tokenResponse;
  } catch (error) {
    console.error('Error refreshing Kingschat token:', error);
    return null;
  }
}
