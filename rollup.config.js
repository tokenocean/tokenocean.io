import svelte from "rollup-plugin-svelte";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import livereload from "rollup-plugin-livereload";
import { terser } from "rollup-plugin-terser";
// library that helps you import in svelte with
// absolute paths, instead of
// import Component  from "../../../../components/Component.svelte";
// we will be able to say
// import Component from "components/Component.svelte";
import alias from "@rollup/plugin-alias";
import fs from "fs";

const production = !process.env.ROLLUP_WATCH;

// configure aliases for absolute imports
const aliases = alias({
  resolve: [".svelte", ".js"], //optional, by default this will just look for .js files or folders
  entries: [
    { find: "components", replacement: "src/components" },
    { find: "views", replacement: "src/views" },
    { find: "assets", replacement: "src/assets" },
  ],
});

const indexTemplate = `<!--

=========================================================
* Notus Svelte - v1.1.0 based on Tailwind Starter Kit by Creative Tim
=========================================================

* Product Page: https://www.creative-tim.com/product/notus-svelte
* Copyright 2021 Creative Tim (https://www.creative-tim.com)
* Licensed under MIT (https://github.com/creativetimofficial/notus-svelte/blob/main/LICENSE.md)

* Tailwind Starter Kit Page: https://www.creative-tim.com/learning-lab/tailwind-starter-kit/presentation

* Coded by Creative Tim

=========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

-->
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <link rel="shortcut icon" href="/favicon.png" />
    <link rel="stylesheet" href="/assets/styles/tailwind.css" />
		<link rel="stylesheet" href="/assets/styles/index.css" />
    <link
      rel="stylesheet"
      href="/assets/vendor/@fortawesome/fontawesome-free/css/all.min.css"
    />
    <link rel="stylesheet" href="/assets/styles/tailwind.css" />
    <title>Token Ocean</title>

	 <meta
		 name="description"
		 content="We're a white label bitcoin (liquid) NFT marketplace provider for new and existing brands."
	 />

	 <meta property="og:url" content="https://tokenocean.io/" />
	 <meta property="og:type" content="website" />
	 <meta property="og:title" content="http://www.tokenocean.io/" />
	 <meta
		 property="og:description"
		 content="We're a white label bitcoin (liquid) NFT marketplace provider for new and existing brands."
	 />
	 <meta
		 property="og:image"
		 content="https://tokenocean.io/assets/img/logo.png"
	 />

	 <!-- Twitter Meta Tags -->

	 <meta property="twitter:domain" content="tokenocean.io" />
	 <meta property="twitter:url" content="https://tokenocean.io/" />
	 <meta name="twitter:title" content="http://www.tokenocean.io/" />
	 <meta
		 name="twitter:description"
		 content="We're a white label bitcoin (liquid) NFT marketplace provider for new and existing brands."
	 />
	 <meta
		 name="twitter:image"
		 content="https://tokenocean.io/assets/img/logo.png"
	 />

    <script>
      if (process === undefined) {
        var process = { env: {<<process-env-status>>} };
      }
    </script>

    <script defer src="/build/bundle.js"></script>
  </head>

  <body class="text-blueGray-700 antialiased">
    <noscript>
      <strong
        >We're sorry but notus-svelte doesn't work properly without
        JavaScript enabled. Please enable it to continue.</strong
      >
    </noscript>
    <div id="app"></div>
  </body>
</html>
`;

if (production) {
  fs.writeFileSync(
    "./public/index.html",
    indexTemplate
      .replace("<<process-env-status>>", "PRODUCTION: true")
      .replace(/<<live-preview-link>>/g, "/notus-svelte")
  );
} else {
  fs.writeFileSync(
    "./public/index.html",
    indexTemplate
      .replace("<<process-env-status>>", "")
      .replace(/<<live-preview-link>>/g, "")
  );
}

function serve() {
  let server;

  function toExit() {
    if (server) server.kill(0);
  }

  return {
    writeBundle() {
      if (server) return;
      server = require("child_process").spawn(
        "npm",
        ["run", "start", "--", "--dev"],
        {
          stdio: ["ignore", "inherit", "inherit"],
          shell: true,
        }
      );

      process.on("SIGTERM", toExit);
      process.on("exit", toExit);
    },
  };
}

export default {
  input: "src/main.js",
  output: {
    sourcemap: true,
    format: "iife",
    name: "app",
    file: "public/build/bundle.js",
  },
  plugins: [
    svelte({
      // enable run-time checks when not in production
      dev: !production,
      // we'll extract any component CSS out into
      // a separate file - better for performance
      css: (css) => {
        css.write("bundle.css");
      },
    }),

    // If you have external dependencies installed from
    // npm, you'll most likely need these plugins. In
    // some cases you'll need additional configuration -
    // consult the documentation for details:
    // https://github.com/rollup/plugins/tree/master/packages/commonjs
    resolve({
      browser: true,
      dedupe: ["svelte"],
    }),
    commonjs(),

    // In dev mode, call `npm run start` once
    // the bundle has been generated
    !production && serve(),

    // Watch the `public` directory and refresh the
    // browser on changes when not in production
    !production && livereload("public"),

    // If we're building for production (npm run build
    // instead of npm run dev), minify
    production && terser(),

    // for absolut imports
    // i.e., instead of
    // import Component  from "../../../../components/Component.svelte";
    // we will be able to say
    // import Component from "components/Component.svelte";
    aliases,
  ],
  watch: {
    clearScreen: false,
  },
};
