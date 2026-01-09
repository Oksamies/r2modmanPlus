import { apiFetch } from "../apiFetch";
import type { ApiEndpointProps } from "../index";
import {
  type CommunityFiltersRequestParams,
  communityFiltersRequestParamsSchema,
} from "../schemas/requestSchemas";
import {
  type CommunityFiltersResponseData,
  communityFiltersResponseDataSchema,
} from "../schemas/responseSchemas";

export async function fetchCommunityFilters(
  props: ApiEndpointProps<CommunityFiltersRequestParams, object, object>
): Promise<CommunityFiltersResponseData> {
  const { config, params } = props;
  return await apiFetch({
    args: {
      config,
      path: `api/cyberstorm/community/${params.community_id.toLowerCase()}/filters/`,
    },
    requestSchema: communityFiltersRequestParamsSchema,
    queryParamsSchema: undefined,
    responseSchema: communityFiltersResponseDataSchema,
  });
}
