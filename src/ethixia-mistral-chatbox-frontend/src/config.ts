import { createActor } from '../../declarations/ethixia-mistral-chatbox-backend';
import { HttpAgent, type ActorSubclass } from '@dfinity/agent';
import type { _SERVICE } from '../../declarations/ethixia-mistral-chatbox-backend/ethixia-mistral-chatbox-backend.did';

const DEFAULT_STORAGE_GATEWAY_URL = 'https://dev-blob.caffeine.ai';
const DEFAULT_BUCKET_NAME = 'default-bucket';

interface JsonConfig {
    backend_host: string;
    backend_canister_id: string;
}

interface Config {
    backend_host?: string;
    backend_canister_id: string;
    storage_gateway_url: string;
    bucket_name: string;
}

let configCache: Config | null = null;

export async function getConfig(): Promise<Config> {
    if (configCache) {
        return configCache;
    }

    try {
        const response = await fetch('/config.json');
        if (!response.ok) {
            throw new Error('Failed to load config');
        }
        const jsonConfig: JsonConfig = await response.json();
        
        configCache = {
            ...jsonConfig,
            storage_gateway_url: process.env.STORAGE_GATEWAY_URL || DEFAULT_STORAGE_GATEWAY_URL,
            bucket_name: process.env.BUCKET_NAME || DEFAULT_BUCKET_NAME,
        };
        
        return configCache;
    } catch (error) {
        console.error('Failed to load config, using defaults', error);
        
        configCache = {
            backend_canister_id: process.env.CANISTER_ID_ETHIXIA_MISTRAL_CHATBOX_BACKEND || '',
            storage_gateway_url: process.env.STORAGE_GATEWAY_URL || DEFAULT_STORAGE_GATEWAY_URL,
            bucket_name: process.env.BUCKET_NAME || DEFAULT_BUCKET_NAME,
        };
        
        return configCache;
    }
}

export function extractAgentErrorMessage(error: string): string {
    try {
        const match = error.match(/Reject code: (\d+).*Reject text: (.*)/s);
        return match ? match[2].trim() : error;
    } catch (e) {
        return error;
    }
}

export function processError(e: unknown): never {
    if (e instanceof Error) {
        throw new Error(extractAgentErrorMessage(e.message));
    }
    throw e;
}

export async function createActorWithConfig(options?: {
    agentOptions?: {
        host?: string;
        identity?: any;
    };
}): Promise<ActorSubclass<_SERVICE>> {
    const config = await getConfig();
    const host = options?.agentOptions?.host || config.backend_host;
    
    const agent = new HttpAgent({
        ...(host && { host }),
        ...(options?.agentOptions?.identity && { identity: options.agentOptions.identity })
    });

    if (process.env.NODE_ENV !== 'production' || !host) {
        await agent.fetchRootKey();
    }

    return createActor(config.backend_canister_id, { agent });
}
