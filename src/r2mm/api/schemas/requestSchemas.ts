import { z } from "zod";
import {
  includedCategoriesQueryParam,
  excludedCategoriesQueryParam,
  sectionQueryParam,
  nsfwQueryParam,
  deprecatedQueryParam,
  qQueryParam,
  packageListingsOrderingQueryParam,
  pageQueryParam,
  dateStartQueryParam,
  dateEndQueryParam,
  createdStartQueryParam,
  createdEndQueryParam,
} from "./queryParamSchemas";

// CommunityPackageListingsRequest
export const communityPackageListingsRequestParamsSchema = z.object({
  community_id: z.string(),
});

export type CommunityPackageListingsRequestParams = z.infer<
  typeof communityPackageListingsRequestParamsSchema
>;

export const packageListingsRequestQueryParamsSchema = z.array(
  z.union([
    includedCategoriesQueryParam,
    excludedCategoriesQueryParam,
    sectionQueryParam,
    nsfwQueryParam,
    deprecatedQueryParam,
    qQueryParam,
    packageListingsOrderingQueryParam,
    pageQueryParam,
    dateStartQueryParam,
    dateEndQueryParam,
    createdStartQueryParam,
    createdEndQueryParam,
  ])
);

export type PackageListingsRequestQueryParams = z.infer<
  typeof packageListingsRequestQueryParamsSchema
>;

// CommunityFiltersRequest
export const communityFiltersRequestParamsSchema = z.object({
  community_id: z.string(),
});

export type CommunityFiltersRequestParams = z.infer<
  typeof communityFiltersRequestParamsSchema
>;

// PackageListingDetailsRequest
export const packageListingDetailsRequestParamsSchema = z.object({

  community_id: z.string(),
  namespace_id: z.string(),
  package_name: z.string(),
});

export type PackageListingDetailsRequestParams = z.infer<
  typeof packageListingDetailsRequestParamsSchema
>;

// CommunityRequest
export const communityRequestParamsSchema = z.object({
  community_id: z.string(),
});

export type CommunityRequestParams = z.infer<
  typeof communityRequestParamsSchema
>;

// PackageVersionsRequest
export const packageVersionsRequestParamsSchema = z.object({
  namespace_id: z.string(),
  package_name: z.string(),
});

export type PackageVersionsRequestParams = z.infer<
  typeof packageVersionsRequestParamsSchema
>;
