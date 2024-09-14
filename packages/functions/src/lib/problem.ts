/*
 * ADOBE CONFIDENTIAL
 *
 * Copyright 2023 Adobe
 * All rights reserved.
 *
 * NOTICE:  All information contained herein is, and remains
 * the property of Adobe and its suppliers, if any. The intellectual
 * and technical concepts contained herein are proprietary to Adobe
 * and its suppliers and are protected by all applicable intellectual
 * property laws, including trade secret and copyright laws.
 * Dissemination of this information or reproduction of this material
 * is strictly forbidden unless prior written permission is obtained
 * from Adobe.
 */
import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { randomUUID } from "crypto";

/**
 * @typedef {Object} ProblemObject
 * @property {string} type
 * @property {string} title
 * @property {number} status
 * @property {string} detail
 * @property {string} instance
 */

const STATUS_MAP: Record<number, string> = {
  400: "Bad Request",
  401: "Unauthorized",
  403: "Forbidden",
  404: "Not Found",
  405: "Method Not Allowed",
  406: "Not Acceptable",
  407: "Proxy Authentication Required",
  408: "Request Timeout",
  409: "Conflict",
  410: "Gone",
  411: "Length Required",
  412: "Precondition Failed",
  413: "Content Too Large",
  414: "URI Too Long",
  415: "Unsupported Media Type",
  416: "Range Not Satisfiable",
  417: "Expectation Failed",
  500: "Internal Server Error",
  501: "Not Implemented",
  502: "Bad Gateway",
  503: "Service Unavailable",
  504: "Gateway Timeout",
  505: "HTTP Version Not Supported",
};

export type Problem = {
  status: number;
  title?: string;
  detail?: unknown;
  instance?: string;
};

export class ProblemError extends Error {
  problem: Problem;

  constructor(problem: Problem) {
    super(problem.title || STATUS_MAP[problem.status]);
    this.problem = problem;
  }
}

export function toProblemResponse(
  problem: Problem,
  evt: APIGatewayProxyEventV2
): APIGatewayProxyStructuredResultV2 {
  return {
    statusCode: problem.status,
    headers: {
      "Content-Type": "application/problem+json",
    },
    body: JSON.stringify({
      ...problem,
      title: problem.title || STATUS_MAP[problem.status],
      instance: problem.instance || evt.requestContext.requestId || randomUUID(),
    }),
  };
}
