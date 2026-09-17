/** @type {import('next').NextConfig} */
const nextConfig = {
  // Dynamic's server-wallet SDK ships native .node MPC binaries.
  // Keep these packages external to the Next.js server bundle.
  serverExternalPackages: [
    '@dynamic-labs-wallet/node',
    '@dynamic-labs-wallet/node-evm',
    '@evervault/wasm-attestation-bindings',
  ],
}

export default nextConfig
