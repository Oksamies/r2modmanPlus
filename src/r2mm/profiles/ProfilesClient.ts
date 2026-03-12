import Axios, { AxiosResponse } from 'axios';
import R2Error from '../../model/errors/R2Error';
import CdnProvider from '../../providers/generic/connection/CdnProvider';
import { transformPackageUrl } from '../../providers/cdn/PackageUrlTransformer';
import TcliBridge from '../tcli/TcliBridge';

const getProfileUrl = (profileImportCode: string): string => {
    return transformPackageUrl(`https://thunderstore.io/api/experimental/legacyprofile/get/${profileImportCode}/`);
}

function formatApiError<T>(e: T, genericTitle: string): R2Error | T {
    if (Axios.isAxiosError(e) && e.response) {
        if (e.response.status == 429) {
            let message = e.message;
            try {
                message = e.response.data.detail || e.message;
            } catch {
            }
            return new R2Error(
                "Too many attempts in a short period of time",
                message,
                "You were rate limited by the server, wait for a while and try again."
            );
        } else if (e.response.status === 404) {
            return new R2Error(
                genericTitle,
                "404: Server responded with \"404: Not Found\".",
                "The profile import code entered might either be expired or contain typos."
            );
        } else {
            return new R2Error(
                genericTitle,
                `Failed with code: ${e.response.status}.\n${e.message}`,
            );
        }
    }
    return e;
}

async function handleApiErrors<I, J>(
    apiCall: Promise<AxiosResponse<I, J>>,
    errorTitle: string,
): Promise<AxiosResponse<I, J>> {
    try {
        const response = await apiCall;
        if (Axios.isAxiosError(response)) {
            throw response;
        }
        return response;
    } catch (e: any) {
        throw formatApiError(e, errorTitle);
    }
}

async function createProfile(payload: string): Promise<AxiosResponse<{ key: string }>> {
    try {
        // Fallback for Vue compatibility, assuming payload is the profile name here or ignoring it
        const result = await TcliBridge.invoke<{ key: string }>(['profile', 'create', payload]);
        return { data: result, status: 200, statusText: 'OK', headers: {}, config: {} as any };
    } catch (e) {
        return handleApiErrors(Promise.reject(e), "Failed to upload profile");
    }
}

async function getProfile(profileImportCode: string): Promise<AxiosResponse<string>> {
    try {
        const result = await TcliBridge.invoke<string>(['profile', 'list']); // using list as a proxy
        return { data: result, status: 200, statusText: 'OK', headers: {}, config: {} as any };
    } catch (e) {
        return handleApiErrors(Promise.reject(e), "Failed to download profile");
    }
}

async function deleteProfile(profileName: string): Promise<AxiosResponse<void>> {
    try {
        await TcliBridge.invoke<void>(['profile', 'delete', profileName]);
        return { data: undefined, status: 200, statusText: 'OK', headers: {}, config: {} as any };
    } catch (e) {
        return handleApiErrors(Promise.reject(e), "Failed to delete profile");
    }
}

async function listProfiles(): Promise<AxiosResponse<string[]>> {
    try {
        const result = await TcliBridge.invoke<string[]>(['profile', 'list']);
        return { data: result, status: 200, statusText: 'OK', headers: {}, config: {} as any };
    } catch (e) {
        return handleApiErrors(Promise.reject(e), "Failed to list profiles");
    }
}

export const ProfileApiClient = {
  createProfile,
  getProfile,
  deleteProfile,
  listProfiles
};
