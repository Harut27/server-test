/** @type {import('next').NextConfig} */


// dev
// const nextConfig = {
//   webpackDevMiddleware: config => {
//     // reactStrictMode: false;
//     config.watchOptions = {
//       poll: 1000, // Check for changes every second
//       aggregateTimeout: 300, // delay before rebuilding
//     };
//     return config;
//   },
// };

// live
const nextConfig = {
  reactStrictMode: false,
  swcMinify: true,
}

export default nextConfig;
