import { z } from "zod";

import type { RequestConfig } from "./index";
import {
  ApiError,
  ParseError,
  RequestBodyParseError,
  RequestQueryParamsParseError,
} from "./errors";
import { serializeQueryString } from "./queryString";

const BASE_HEADERS = {
  Accept: "application/json",
  "Content-Type": "application/json",
};

const MAX_NB_RETRY = 5;
const RETRY_DELAY_MS = 200;

async function fetchRetry(
  input: RequestInfo | URL,
  init?: RequestInit | undefined
) {
  let retryLeft = MAX_NB_RETRY;
  let latestErr = null;
  while (retryLeft > 0) {
    try {
      return await fetch(input, init);
    } catch (err) {
      latestErr = err;
      await sleep(RETRY_DELAY_MS);
    } finally {
      retryLeft -= 1;
    }
  }
  if (latestErr !== null) {
    throw latestErr;
  } else {
    throw new Error(`Too many retries`);
  }
}

function sleep(delay: number) {
  return new Promise((resolve) => setTimeout(resolve, delay));
}

export type apiFetchArgs<B, QP> = {
  config: () => RequestConfig;
  path: string;
  queryParams?: QP;
  request?: Omit<RequestInit, "headers" | "body"> & { body?: string };
  useSession?: boolean;
  bodyRaw?: B;
};

type schemaOrUndefined<A> = A extends z.ZodSchema
  ? z.infer<A>
  : never | undefined;

export async function apiFetch(props: {
  args: apiFetchArgs<
    schemaOrUndefined<typeof props.requestSchema>,
    schemaOrUndefined<typeof props.queryParamsSchema>
  >;
  requestSchema: z.ZodSchema | undefined;
  queryParamsSchema: z.ZodSchema | undefined;
  responseSchema: z.ZodSchema | undefined;
}): Promise<schemaOrUndefined<typeof props.responseSchema>> {
  const { args, requestSchema, queryParamsSchema, responseSchema } = props;

  if (requestSchema && args.bodyRaw) {
    const parsedRequestBody = requestSchema.safeParse(args.bodyRaw);
    if (!parsedRequestBody.success) {
      throw new RequestBodyParseError(parsedRequestBody.error);
    }
  }
  if (queryParamsSchema && args.queryParams) {
    const parsedQueryParams = queryParamsSchema.safeParse(args.queryParams);
    if (!parsedQueryParams.success) {
      throw new RequestQueryParamsParseError(parsedQueryParams.error);
    }
  }

  const { config, path, request, queryParams, useSession = false } = args;
  const usedConfig: RequestConfig = useSession
    ? config()
    : {
        apiHost: config().apiHost,
        sessionId: undefined,
      };
  // TODO: Query params have stronger types, but they are not just shown here.
  // Look into furthering the ensuring of passing proper query params.
  const url = getUrl(usedConfig, path, queryParams);

  console.log(`[apiFetch] Requesting: ${url.toString()}`, {
    method: request?.method || 'GET',
    headers: { ...BASE_HEADERS, ...getAuthHeaders(usedConfig) }
  });

  const response = await fetchRetry(url, {
    ...(request ?? {}),
    headers: {
      ...BASE_HEADERS,
      ...getAuthHeaders(usedConfig),
    },
  });

  console.log(`[apiFetch] Response: ${response.status} ${response.statusText} for ${url.toString()}`);

  if (!response.ok) {
    throw await ApiError.createFromResponse(response);
  }

  if (responseSchema === undefined) return undefined;

  const json = await response.json();
  console.log(`[apiFetch] Response Data for ${url.toString()}:`, json);

  const parsed = responseSchema.safeParse(json);
  if (!parsed.success) {
    console.error(`[apiFetch] Parse Error for ${url.toString()}:`, parsed.error);
    throw new ParseError(parsed.error);
  } else {
    return parsed.data;
  }
}

function getAuthHeaders(config: RequestConfig): RequestInit["headers"] {
  return config.sessionId
    ? {
        Authorization: `Session ${config.sessionId}`,
      }
    : {};
}

function getUrl(
  config: RequestConfig,
  path: string,
  queryParams?: { key: string; value: string; impotent?: string }[]
) {
  const fullPath = queryParams
    ? `${path}?${serializeQueryString(queryParams)}`
    : path;
  return new URL(fullPath, config.apiHost);
}
