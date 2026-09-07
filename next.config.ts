const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  turbopack: {
    resolveAlias: {
      "cloudflare:workers": "./tests/cloudflare-workers-stub.mjs",
    },
  },
};

export default nextConfig;
