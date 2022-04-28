FROM pixelwars-base:latest

RUN git clone git@github.com:mlsc-apps/pixelwars.git && \
    cd pixelwars && \
    npm install && \
    npm audit fix

WORKDIR /pixelwars
