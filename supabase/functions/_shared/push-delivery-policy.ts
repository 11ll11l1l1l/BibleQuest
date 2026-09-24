export function isPermanentPushEndpointFailure(statusCode: number): boolean {
  return statusCode === 404 || statusCode === 410;
}
