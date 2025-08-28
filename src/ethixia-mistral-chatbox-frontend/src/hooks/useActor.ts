import { useState, useEffect, useRef } from 'react';
import { HttpAgent, type ActorSubclass } from '@dfinity/agent';
import { AuthClient } from '@dfinity/auth-client';
import { createActor } from '../../../declarations/ethixia-mistral-chatbox-backend';
import type { _SERVICE } from '../../../declarations/ethixia-mistral-chatbox-backend/ethixia-mistral-chatbox-backend.did';
import { useInternetIdentity } from './useInternetIdentity';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const ACTOR_QUERY_KEY = 'actor';

export function useActor() {
    const { identity, isAuthenticated } = useInternetIdentity();
    const queryClient = useQueryClient();
    
    return useQuery<ActorSubclass<_SERVICE>>({
        queryKey: [ACTOR_QUERY_KEY, identity?.getPrincipal().toText()],
        queryFn: async () => {
            if (!identity || !isAuthenticated) {
                throw new Error('Not authenticated');
            }
            
            const agent = new HttpAgent({
                identity,
                host: process.env.DFX_NETWORK === 'ic' 
                    ? 'https://ic0.app' 
                    : 'http://localhost:8000',
            });

            // Only fetch the root key in development
            if (process.env.DFX_NETWORK !== 'ic') {
                await agent.fetchRootKey();
            }

            // Create an actor to talk to the backend
            const actor = createActor(process.env.CANISTER_ID_ETHIXIA_MISTRAL_CHATBOX_BACKEND || '', {
                agent,
            });

            return actor;
        },
        enabled: !!identity && isAuthenticated,
    });
}
