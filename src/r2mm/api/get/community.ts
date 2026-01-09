import { apiFetch } from "../apiFetch";
import type { ApiEndpointProps } from "../index";
import {
  type CommunityRequestParams,
  communityRequestParamsSchema,
} from "../schemas/requestSchemas";
import {
  type CommunityResponseData,
  communityResponseDataSchema,
} from "../schemas/responseSchemas";

export async function fetchCommunity(
  props: ApiEndpointProps<CommunityRequestParams, object, object>
): Promise<CommunityResponseData> {
  const { config, params } = props;
  return await apiFetch({
    args: {
      config,
      path: `api/cyberstorm/community/${params.community_id.toLowerCase()}/`,
    },
    requestSchema: communityRequestParamsSchema,
    queryParamsSchema: undefined,
    responseSchema: communityResponseDataSchema,
  });
}
