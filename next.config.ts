const nextConfig = {
  turbopack: {
    resolveAlias: {
      "cloudflare:workers": "./tests/cloudflare-workers-stub.mjs",
    },
  },
};

export default nextConfig;
