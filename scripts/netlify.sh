#!/bin/bash
yarn build
yarn example:init
yarn example:build

# Add netlify badge to build output
BADGE='\
<div style="position: absolute; bottom: 10px; right: 10px; z-index: 100;">\
  <a href="https://www.netlify.com">\
    <img src="https://www.netlify.com/img/global/badges/netlify-dark.svg" alt="Deploys by Netlify" />\
  </a>\
</div>'

sed -i -e "s|</body>|$BADGE</body>|" example/dist/index.html