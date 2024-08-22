FROM ubuntu AS builder

ARG BUILD_ENV=default

WORKDIR /app

RUN apt update
RUN apt-get -y install xxd gettext-base dos2unix
COPY ./password_generator /app

RUN find /app -type f -print0 | xargs -0 dos2unix
RUN chmod u+x /app/password_hash.sh

RUN if [ "$BUILD_ENV" != "default" ]; then \
      cp ./password_generator/definition.tmpl.${BUILD_ENV}.json /opt/definition.json; \
      cp ./password_generator/password.${BUILD_ENV}.conf /app/password.conf \
    else \
      cp ./password_generator/definition.tmpl.json /opt/definition.tmpl.json; \
    fi
RUN /app/password_hash.sh /app/definition.tmpl.json /app/definition.json /app/password.conf

FROM rabbitmq:3.13.6-management
COPY --from=builder /opt/definition.json /etc/rabbitmq/definition.json
COPY enabled_plugins /etc/rabbitmq/enabled_plugins
COPY rabbitmq.conf /etc/rabbitmq/rabbitmq.conf
