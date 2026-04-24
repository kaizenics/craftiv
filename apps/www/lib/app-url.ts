const defaultAppUrl = "http://localhost:3000";

function stripTrailingSlash(value: string) {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

export function getAppUrl(path = "") {
  const baseUrl = stripTrailingSlash(
    process.env.NEXT_PUBLIC_APP_URL || defaultAppUrl
  );

  if (!path) {
    return baseUrl;
  }

  return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}
