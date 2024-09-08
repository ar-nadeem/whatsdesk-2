from circleci/node:16.3.0-buster-browsers-legacy




#RUN apt-get update
#RUN apt-get install -y gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget
#RUN export DEBIAN_FRONTEND=noninteractive && apt-get -y install --no-install-recommends xorg openbox libnss3 libasound2 libatk-adaptor libgtk-3-0

WORKDIR /home/circleci/app
USER root
RUN chown -R circleci: ./
RUN npm install -g npm@latest electron@latest
USER circleci

COPY --chown=circleci:circleci package*.json ./

RUN npm install
COPY --chown=circleci:circleci . .
USER root
RUN chown root:root /home/circleci/app/node_modules/electron/dist/chrome-sandbox
RUN chmod 4755 /home/circleci/app/node_modules/electron/dist/chrome-sandbox
USER circleci
ENV ELECTRON_FLAGS="--no-sandbox"
RUN env QTWEBENGINE_DISABLE_SANDBOX=1 npm run test --no-sandbox