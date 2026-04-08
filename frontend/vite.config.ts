// import { defineConfig } from "vite";
// import react from "@vitejs/plugin-react";
// import svgr from "vite-plugin-svgr";

// // https://vite.dev/config/
// export default defineConfig({
//   // Tell Vite to look for the .env file in the root folder (TuneLog/)
//   envDir: "../", 
  
//   plugins: [
//     react(),
//     svgr({
//       svgrOptions: {
//         icon: true,
//         exportType: "named",
//         namedExport: "ReactComponent",
//       },
//     }),
//   ],
// });

import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, "../", "");

  return {
    envDir: "../",
    server: {
      host: "0.0.0.0",
      allowedHosts: env.VITE_ALLOWED_HOSTS
        ? env.VITE_ALLOWED_HOSTS.split(",")
        : ["localhost"],
    },
    plugins: [
      react(),
      svgr({
        svgrOptions: {
          icon: true,
          exportType: "named",
          namedExport: "ReactComponent",
        },
      }),
    ],
  };
});