import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
} from "aws-lambda";
import { toProblemResponse } from "./lib/problem";

export const handler = async (
  evt: APIGatewayProxyEventV2
): Promise<APIGatewayProxyStructuredResultV2> => {
  return toProblemResponse(
    {
      status: 405,
    },
    evt
  );
};
