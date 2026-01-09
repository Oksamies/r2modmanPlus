export interface RequestConfig {
  apiHost?: string;

  // TODO: This should not be explicitly bound to a session ID but rather just
  //       accept any authorization header. Noting as currently out of scope.
  sessionId?: string;
}

export interface ApiEndpointProps<Params, QueryParams, Data> {
  config: () => RequestConfig;
  useSession?: boolean;
  data: Data;
  params: Params;
  queryParams: QueryParams;
}

export * from "./errors";
export * from "./schemas/objectSchemas";
export * from "./get/packageListingDetails";
