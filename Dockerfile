# Base image from Apify registry with Node.js and Chrome pre-installed
FROM apify/actor-node-puppeteer-chrome:20

# Copy package.json and package-lock.json
COPY --chown=myuser:myuser package*.json ./

# Install dependencies
RUN npm --quiet set progress=false \
    && npm install --omit=dev --omit=optional \
    && echo "Installed NPM packages:" \
    && (npm list --omit=dev --all || true) \
    && echo "Node.js version:" \
    && node --version \
    && echo "NPM version:" \
    && npm --version

# Copy actor source files
COPY --chown=myuser:myuser . ./

# Run the actor
CMD ["npm", "start"]
