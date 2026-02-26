export type OpenApiTag = "archive" | "auth" | "iam";

export type OpenApiPathRegistration = {
  method: "get" | "post" | "put" | "patch" | "delete";
  path: string;
  tag: OpenApiTag;
  operationId: string;
};

export const openApiPathRegistry: OpenApiPathRegistration[] = [];
