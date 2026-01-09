import { z } from "zod";

import { packageListingDetailsSchema, paginatedResults, packageListingSchema, communityFiltersSchema, communitySchema, packageVersionSchema } from "./objectSchemas";

// PackageListingsResponse
export const packageListingsResponseDataSchema =
  paginatedResults(packageListingSchema);

export type PackageListingsResponseData = z.infer<
  typeof packageListingsResponseDataSchema
>;

// PackageListingDetailsResponse
export const packageListingDetailsResponseDataSchema =
  packageListingDetailsSchema;

export type PackageListingDetailsResponseData = z.infer<
  typeof packageListingDetailsResponseDataSchema
>;

// CommunityFiltersResponse
export const communityFiltersResponseDataSchema = communityFiltersSchema;

export type CommunityFiltersResponseData = z.infer<
  typeof communityFiltersResponseDataSchema
>;

// CommunityResponse
export const communityResponseDataSchema = communitySchema;

export type CommunityResponseData = z.infer<
  typeof communityResponseDataSchema
>;

// PackageVersionsResponse
export const packageVersionsResponseDataSchema = z.array(packageVersionSchema);

export type PackageVersionsResponseData = z.infer<
  typeof packageVersionsResponseDataSchema
>;

