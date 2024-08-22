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

#shellcheck source=./.env
source "$PASSWORD_PATH"
RABBITMQ_ADMIN_PASSWORD=$(encode_password "${RABBITMQ_ADMIN_PASSWORD}")
export RABBITMQ_ADMIN_PASSWORD

for var in $(printenv | grep -oP '^RABBITMQ_ADMIN_.*_PASSWORD(?==)'); do
  # Access the value of the environment variable
  value=$(eval echo \$$var)

  # Perform actions with the variable and its value
  echo "Processing $var with value: $value"

  # Example action: check if the value is set or empty
  if [ -z "$value" ]; then
    export $var="$value"
  fi
done

envsubst < "$SOURCE_PATH" > "$DEST_PATH"