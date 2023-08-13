const withPWA = require('next-pwa')
const withBundleAnalyzer = require('@next/bundle-analyzer')({
    enabled: process.env.ANALYZE === 'true',
})
module.exports = withPWA({
    dest: "public",
    register: true,
    skipWaiting: true,
})(
    withBundleAnalyzer({
        distDir: "firebase_hosting",
        output: "export"
    })
)