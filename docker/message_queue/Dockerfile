FROM ubuntu AS build

WORKDIR /app

RUN apt update
RUN apt-get -y install xxd gettext-base dos2unix

COPY ./password_generator/password_hash.sh /app/password_hash.sh
COPY ./password_generator/.env /app/.env
COPY ./password_generator/definition.tmpl.json /app/definition.tmpl.json

RUN find /app -type f -print0 | xargs -0 dos2unix
RUN chmod u+x /app/password_hash.sh
RUN /app/password_hash.sh /app/definition.tmpl.json /app/definition.json /app/.env

FROM rabbitmq:3.13.6-management

COPY --from=build /app/definition.json /etc/rabbitmq/definition.json
COPY enabled_plugins /etc/rabbitmq/enabled_plugins
COPY rabbitmq.conf /etc/rabbitmq/rabbitmq.conf
