import { useState, useEffect, useCallback, useMemo, createContext, useContext, type ReactNode } from 'react';
import { AuthClient } from '@dfinity/auth-client';
import type { Identity } from '@dfinity/agent';

type Status = 'initializing' | 'idle' | 'logging-in' | 'success' | 'loginError';

interface InternetIdentityContextType {
    identity?: Identity;
    isAuthenticated: boolean;
    login: () => void;
    clear: () => void;
    loginStatus: Status;
    isInitializing: boolean;
    isLoginIdle: boolean;
    isLoggingIn: boolean;
    isLoginSuccess: boolean;
    isLoginError: boolean;
    loginError?: Error;
}

const InternetIdentityContext = createContext<InternetIdentityContextType | undefined>(undefined);

export function InternetIdentityProvider({ children }: { children: ReactNode }) {
    const [loginStatus, setLoginStatus] = useState<Status>('initializing');
    const [loginError, setLoginError] = useState<Error | undefined>();
    const [identity, setIdentity] = useState<Identity | null>(null);
    const [authClient, setAuthClient] = useState<AuthClient | null>(null);

    const isInitializing = loginStatus === 'initializing';
    const isLoginIdle = loginStatus === 'idle';
    const isLoggingIn = loginStatus === 'logging-in';
    const isLoginSuccess = loginStatus === 'success';
    const isLoginError = loginStatus === 'loginError';
    const isAuthenticated = isLoginSuccess && identity !== null;

    useEffect(() => {
        const initialize = async () => {
            try {
                const client = await AuthClient.create();
                setAuthClient(client);

                if (await client.isAuthenticated()) {
                    const identity = client.getIdentity();
                    setIdentity(identity as any); // Temporary type assertion
                    setLoginStatus('success');
                } else {
                    setLoginStatus('idle');
                }
            } catch (error) {
                console.error('Failed to initialize auth client:', error);
                setLoginError(error as Error);
                setLoginStatus('loginError');
            }
        };

        initialize();
    }, []);

    const login = useCallback(() => {
        if (!authClient) {
            console.warn('Auth client not initialized');
            return;
        }

        setLoginStatus('logging-in');
        setLoginError(undefined);

        authClient.login({
            onSuccess: () => {
                const identity = authClient.getIdentity();
                setIdentity(identity as any); // Temporary type assertion
                setLoginStatus('success');
            },
            onError: (error) => {
                console.error('Login error:', error);
                setLoginError(new Error(String(error)));
                setLoginStatus('loginError');
            }
        });
    }, [authClient]);

    const clear = useCallback(async () => {
        if (!authClient) {
            console.warn('Auth client not initialized');
            return;
        }

        try {
            await authClient.logout();
            setIdentity(null);
            setLoginStatus('idle');
            setLoginError(undefined);
        } catch (error) {
            console.error('Logout error:', error);
        }
    }, [authClient]);

    const value = useMemo(() => ({
        identity: identity || undefined,
        isAuthenticated,
        login,
        clear,
        loginStatus,
        isInitializing,
        isLoginIdle,
        isLoggingIn,
        isLoginSuccess,
        isLoginError,
        loginError
    }), [
        identity,
        isAuthenticated,
        login,
        clear,
        loginStatus,
        isInitializing,
        isLoginIdle,
        isLoggingIn,
        isLoginSuccess,
        isLoginError,
        loginError
    ]);

    return (
        <InternetIdentityContext.Provider value={value}>
            {children}
        </InternetIdentityContext.Provider>
    );
}

export function useInternetIdentity(): InternetIdentityContextType {
    const context = useContext(InternetIdentityContext);
    if (context === undefined) {
        throw new Error('useInternetIdentity must be used within an InternetIdentityProvider');
    }
    return context;
}
