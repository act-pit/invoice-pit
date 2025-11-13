/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      // 旧タレント登録 → 新タレント登録
      {
        source: '/register',
        destination: '/talent/register',
        permanent: true, // 301リダイレクト
      },
      // 旧タレントログイン → 新タレントログイン
      {
        source: '/login',
        destination: '/talent/login',
        permanent: true,
      },
      // 旧タレントダッシュボード → 新タレントダッシュボード
      {
        source: '/dashboard',
        destination: '/talent/dashboard',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;