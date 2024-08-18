FROM ubuntu as builder
RUN apt update
RUN apt-get -y install xxd gettext-base dos2unix
COPY ./password_generator/password_hash.sh /opt/password_hash.sh
COPY ./password_generator/password.conf /opt/password.conf
COPY ./password_generator/definition.tmpl.json /opt/definition.tmpl.json
RUN find /opt -type f -print0 | xargs -0 dos2unix
RUN chmod u+x /opt/password_hash.sh
RUN /opt/password_hash.sh /opt/definition.tmpl.json /opt/definition.json /opt/password.conf

FROM rabbitmq:3.13.6-management
COPY --from=builder /opt/definition.json /etc/rabbitmq/definition.json
COPY enabled_plugins /etc/rabbitmq/enabled_plugins
COPY rabbitmq.conf /etc/rabbitmq/rabbitmq.conf