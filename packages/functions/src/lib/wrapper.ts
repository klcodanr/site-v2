import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
} from "aws-lambda";
import { ProblemError, toProblemResponse } from "./problem";

export type HandlerFunction = () => Promise<APIGatewayProxyStructuredResultV2> | APIGatewayProxyStructuredResultV2;

export async function wrapper(
  evt: APIGatewayProxyEventV2,
  cb: HandlerFunction
): Promise<APIGatewayProxyStructuredResultV2> {
  try {
    return await cb();
  } catch (err) {
    if ((err as ProblemError).problem) {
      const problem = (err as ProblemError).problem;
      return toProblemResponse(problem, evt);
    } else {
      return toProblemResponse(
        {
          status: 500,
          detail: err,
        },
        evt
      );
    }
  }
}
