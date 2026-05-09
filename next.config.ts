import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	allowedDevOrigins: [
    		"localhost:3000",
      		"192.168.1.6",
      		"my-custom-domain.local:3000", // Example: Custom local domain
   	],
  /* config options here */
};

export default nextConfig;
