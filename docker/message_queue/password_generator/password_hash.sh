#!/bin/bash

SOURCE_PATH="$1"
DEST_PATH="$2"
PASSWORD_PATH="$3"

function encode_password() {
    SALT=$(od -A n -t x -N 4 /dev/urandom)
    PASS=$SALT$(echo -n "$1" | xxd -ps | tr -d '\n' | tr -d ' ')
    PASS=$(echo -n "$PASS" | xxd -r -p | sha256sum | head -c 128)
    PASS=$(echo -n "$SALT$PASS" | xxd -r -p | base64 | tr -d '\n')
    echo "$PASS"
}

#shellcheck source=./password.conf
source "$PASSWORD_PATH"
RABBITMQ_ADMIN_PASSWORD=$(encode_password "${RABBITMQ_ADMIN_PASSWORD}")

export RABBITMQ_ADMIN_PASSWORD

envsubst < "$SOURCE_PATH" > "$DEST_PATH"