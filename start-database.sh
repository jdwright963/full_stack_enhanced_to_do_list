#!/usr/bin/env bash

# This `start-database.sh` script is a custom utility and is NOT part of the default
# `create-t3-app` scaffolding. It was added to the project to automate the setup
# of a local development database using a Docker or Podman container.
#
# This script simplifies the local setup process for new developers, ensuring everyone
# on the team can spin up an identical database environment with a single command
# by reading the configuration from the `.env` file and starting the appropriate
# PostgreSQL container. It is designed for Linux-based environments (including WSL).

# Use this script to start a docker container for a local development database

# TO RUN ON WINDOWS:
# 1. Install WSL (Windows Subsystem for Linux) - https://learn.microsoft.com/en-us/windows/wsl/install
# 2. Install Docker Desktop or Podman Deskop
# 3. Open WSL
# 4. Run this script - `./start-database.sh`

# On Linux and macOS you can run this script directly - `./start-database.sh`

# This is a shell command that sets an option for the current shell session.
# `set -a`: The `-a` flag (short for `allexport`) tells the shell to automatically
# mark any variables that are created or modified from now on for "export".
# An exported variable is made available to any sub-processes that this script might call.
# This is a robust way to ensure the variables from `.env` are properly loaded.
set -a

# This is a standard shell command to execute the contents of another file in the current shell.
# `source .env`: It reads the `.env` file line by line and runs each one as a command.
# Since `.env` contains lines like `DATABASE_URL=...`, this has the effect of creating
# shell variables (like `$DATABASE_URL`) and, because of `set -a`, marking them for export.
source .env

# The script assumes a DATABASE_URL format like: "postgresql://postgres:DB_PASSWORD@localhost:DB_PORT/DB_NAME"
# This line creates a new shell variable named `DB_PASSWORD`.
# `$(...)`: This is "command substitution". The shell will execute the entire command inside the
# parentheses and replace the `$(...)` with the command's output.
#
# Let's trace the command pipeline (`|` passes the output of one command to the input of the next):
# 1. `echo "$DATABASE_URL"`: Prints the full database URL string.

# 2. `awk -F':' '{print $3}'`: This is the first `awk` command. `awk` is a powerful text-processing tool.
#    - `-F':'`: Sets the "Field Separator" to a colon `:`. It splits the string into fields based on the colon.
#    - `'{print $3}'`: Prints the 3rd field. For our URL, this would be "DB_PASSWORD@localhost".

# 3. `awk -F'@' '{print $1}'`: This is the second `awk` command. It takes the previous result ("DB_PASSWORD@localhost").
#    - `-F'@'`: Sets the Field Separator to the "@" symbol.
#    - `'{print $1}'`: Prints the 1st field, which is just "DB_PASSWORD".
DB_PASSWORD=$(echo "$DATABASE_URL" | awk -F':' '{print $3}' | awk -F'@' '{print $1}')

# This line creates a new shell variable named `DB_PORT`.
# The pipeline works similarly:
# 1. `echo "$DATABASE_URL"`: Prints the full URL.
# 2. `awk -F':' '{print $4}'`: Splits by colon `:` and takes the 4th field, resulting in "DB_PORT/DB_NAME".
# 3. `awk -F'/' '{print $1}'`: Takes the previous result, splits it by slash `/`, and prints the 1st field, which is "DB_PORT".
DB_PORT=$(echo "$DATABASE_URL" | awk -F':' '{print $4}' | awk -F'\/' '{print $1}')

# This line creates a new shell variable named `DB_NAME`.
# 1. `echo "$DATABASE_URL"`: Prints the full URL.
# 2. `awk -F'/' '{print $4}'`: This time it splits by slash `/` from the start and takes the 4th field.
#    - Field 1: `postgresql:`
#    - Field 2: `` (empty string between the slashes)
#    - Field 3: `postgres:DB_PASSWORD@localhost:DB_PORT`
#    - Field 4: `DB_NAME` (This is the result)
DB_NAME=$(echo "$DATABASE_URL" | awk -F'/' '{print $4}')

# This line creates the desired name for our Docker container.
# It simply takes the database name we just extracted and appends the string "-postgres" to it.
# This results in a descriptive and unique container name, e.g., "my-project-db-postgres".
DB_CONTAINER_NAME="$DB_NAME-postgres"

# This is a compound conditional statement that checks if NEITHER docker NOR podman is available to use.
# `! [ -x "$(command -v docker)" ] && ! [ -x "$(command -v podman)" ]`: This is the full condition being tested.
#
#   `!`: The 'not' operator. It inverts the exit code of the command that follows. If the following test is `true` (exit code 0),
#        the `!` makes it `false` (exit code 1), and vice-versa.
#
#   `[ ... ]`: This is an alias for the `test` command. It evaluates the expression inside it and returns an exit code:
#              `0` for true, or `1` for false.
#
#   `-x`: This is a "primary" operator used by the `test` command. It checks if a given file path exists AND is executable.
#
#   `"$(...)"`: This is "command substitution". The shell first executes the command inside the parentheses `()`
#               and then replaces the entire `$(...)` block with the command's output string. The double quotes `""`
#               around it ensure the output is treated as a single string, even if it contains spaces.
#
#   `command -v docker`: This is a reliable way to find an executable.
#     - `command`: A "shell built-in". This means it's a command that is part of the shell program (`bash`)
#       itself, not a separate program located elsewhere on the file system (like `/bin/ls`).
#       Using the `command` built-in is a safeguard that bypasses any custom aliases or shell functions
#       a user might have created with the same name (e.g., if a user aliased `docker` to `docker --help`),
#       ensuring the script finds the real program executable.
#     - `-v`: An option that tells `command` to print the full path to the executable if it's found in the system's PATH.
#              If not found, it prints nothing and returns a non-zero exit code.
#
#   `&&`: The logical "AND" operator. It only evaluates the right-hand side of the operator if the left-hand side was successful (returned exit code 0).
#         In this specific `if` statement, it's used to link the two `!` negated conditions.
if ! [ -x "$(command -v docker)" ] && ! [ -x "$(command -v podman)" ]; then

  # If neither Docker nor Podman are found, this `echo` command prints an error message to the user.
  # `-e`: This flag enables the interpretation of "backslash escapes". A backslash escape is a special
  # character sequence that represents something that isn't easily typed. The most common is `\n`,
  # which the shell will replace with an actual newline character, causing a line break in the output.
  echo -e "Docker or Podman is not installed. Please install docker or podman and try again.\nDocker install guide: https://docs.docker.com/engine/install/\nPodman install guide: https://podman.io/getting-started/installation"

  # `exit 1`: This immediately terminates the script. An exit code of `1` (or any non-zero number) is a standard
  # convention to signal that the script ended with an error.
  exit 1

# `fi` is the keyword that closes the `if` block in shell scripting.
fi

# This `if/elif` block determines which container tool to use and stores the command in a variable.
# This makes the rest of the script generic, as it can just use the `$DOCKER_CMD` variable without
# needing to know if it's running `docker` or `podman`.
if [ -x "$(command -v docker)" ]; then

  # If the `docker` executable is found, we set the `DOCKER_CMD` variable to the string "docker".
  DOCKER_CMD="docker"

# `elif` is short for "else if". It's checked only if the first `if` condition was false.
elif [ -x "$(command -v podman)" ]; then

  # If `docker` was not found but the `podman` executable is, we set the variable to "podman".
  DOCKER_CMD="podman"
fi

# This `if` statement checks if the container daemon (the background service) is actually running.
# The `!` negates the command's exit code, so this reads "if the command `$DOCKER_CMD info` fails...".
# `$DOCKER_CMD info`: This attempts to get information from the container daemon. It will succeed if the daemon is running and fail if not.
# `> /dev/null`: This redirects the "standard output" (stdout, stream 1) of the command to `/dev/null`, a special
#  system file that discards all data written to it. This keeps the terminal clean from normal output.
# `2>&1`: This is the crucial part for redirecting errors. Let's break it down:
#   - `2`: In shell scripting, `2` represents the "standard error" stream (stderr), where error messages are sent.
#   - `>`: The redirection operator.
#   - `&1`: This refers to the target of the standard output stream (stdout, stream 1). It is NOT the literal file "1".
#   The whole expression `2>&1` means: "Redirect standard error (2) to the same place that standard output (1) is currently going."
if ! $DOCKER_CMD info > /dev/null 2>&1; then

  # If the command failed, it means the daemon isn't running. We print a helpful message.
  echo "$DOCKER_CMD daemon is not running. Please start $DOCKER_CMD and try again."

  # And we exit the script with an error code.
  exit 1
fi

# This `if` statement checks if the `nc` (netcat) command-line utility is installed and available.
# `command -v nc`: This searches for the `nc` executable in the system's PATH.
# `>/dev/null 2>&1`: This silences all output (both standard and error) from the command.
# The `if` statement itself just checks the exit code: if `nc` is found, the command succeeds (exit code 0), and the `if` block runs.
if command -v nc >/dev/null 2>&1; then

  # This is a nested `if` statement that runs only if `nc` was found. It checks if the required database port is already in use.
  # `nc -z localhost "$DB_PORT"`: This is the core command.
  #   - `nc`: The netcat utility.
  #   - `-z`: A special flag that tells `nc` to scan for listening daemons without actually sending any data (zero-I/O mode).
  #   - `localhost`: The hostname to check.
  #   - `"$DB_PORT"`: The port number to check, pulled from the variable we defined earlier.
  # This command will succeed (exit code 0) if a process is already listening on that port, and fail otherwise.
  # `2>/dev/null`: We only redirect standard error here, because a failure message from `nc` isn't useful to the user.
  if nc -z localhost "$DB_PORT" 2>/dev/null; then

    # If the `nc` command succeeded, it means the port is in use. We print a clear error message to the user.
    echo "Port $DB_PORT is already in use."

    # We immediately terminate the script with an error code to prevent conflicts.
    exit 1
  fi

# The `else` block runs if the first `if` condition was false (meaning the `nc` command was not found).
else

  # Since we can't automatically check the port, we print a warning to the user, informing them of the situation.
  echo "Warning: Unable to check if port $DB_PORT is already in use (netcat not installed)"

  # The `read` command is used to get input from the user.
  # `-p "..."`: The `-p` flag displays a prompt message to the user without a trailing newline.
  # `-r`: Prevents backslashes from being interpreted as escape characters. It's a good practice for raw input.
  # `REPLY`: The text the user types before pressing Enter will be stored in the shell variable named `REPLY`.
  read -p "Do you want to continue anyway? [y/N]: " -r REPLY

  # This `if` statement checks the user's response to the prompt.
  # The `!` negates the condition, so this reads as "if the user's reply is NOT 'yes'..."
  # `[[ ... ]]`: This is an enhanced version of the `[` test command, offering more features like pattern matching.
  # `$REPLY =~ ^[Yy]$`: This is a regular expression matching operation.
  #
  #   - `$REPLY`: This is the variable containing the user's input (e.g., "y", "yes", "N", etc.).
  #
  #   - `=~`: This is the binary operator within `[[...]]` that performs a regular expression match.
  #           It checks if the string on the left matches the pattern on the right.
  #
  #   - `^[Yy]$`: This is the regular expression pattern. It defines what a "yes" answer looks like.
  #     - `^`: This is an "anchor". It asserts that the match must start at the beginning of the string.
  #          This prevents a string like "my answer is y" from matching.
  #     - `[...]`: This is a "character set". It matches any single character inside the brackets.
  #     - `Yy`: Inside the character set, this means "match either an uppercase 'Y' or a lowercase 'y'".
  #     - `$`: This is another "anchor". It asserts that the match must end at the end of the string.
  #          This prevents a string like "yes" from matching, because it's longer than one character.
  #
  #   The entire pattern `^[Yy]$` strictly means: "The string must consist of exactly one character,
  #   and that character must be either 'Y' or 'y'".
  if ! [[ $REPLY =~ ^[Yy]$ ]]; then

    # If the user typed anything other than 'y' or 'Y' (including just pressing Enter), we print an abort message.
    echo "Aborting."

    # And we terminate the script.
    exit 1
  fi
fi

# This `if` statement checks if the database container is already running.
# The `[` is an alias for the `test` command. When given a single string argument inside,
# it checks if the string is non-empty. The condition is true if the command inside `$(...)` produces any output.
#
# Let's break down the command substitution `$(...)`:
# `$DOCKER_CMD ps`: This lists all *currently running* containers (e.g., `docker ps`).
# `-q`: This is the "quiet" flag. It tells `ps` to only output the numeric Container IDs, not the full table of information.
# `-f name=$DB_CONTAINER_NAME`: This is the "filter" flag. It filters the list to only include containers
#   whose name exactly matches the value of our `$DB_CONTAINER_NAME` variable.
#
# So, if the container is running, this command will output its ID. The `if` statement will see a non-empty
# string, evaluate to true, and execute the code inside. If the container is not running, the command
# produces no output, the string is empty, and the `if` statement is false.
if [ "$($DOCKER_CMD ps -q -f name=$DB_CONTAINER_NAME)" ]; then

  # If the container is already running, we print a helpful message to the user.
  echo "Database container '$DB_CONTAINER_NAME' already running"

  # We then exit the script successfully. An exit code of `0` is the standard for success.
  # There is nothing more to do, so we stop here.
  exit 0
fi

# This second `if` statement checks if the container exists but is in a *stopped* state.
# This condition is only evaluated if the first `if` statement was false.
# The structure is very similar to the first check, with one key difference in the command:
#
# `$DOCKER_CMD ps -a`: The `-a` flag is the crucial change. It tells `ps` to list *all* containers,
# including those that are stopped.
# The `-q` and `-f name=...` flags work the same as before.
#
# So, if the container exists but is stopped, this command will find it and output its ID, causing
# the `if` condition to be true. If no container with that name has ever been created, this command
- # will produce no output, and the condition will be false.
if [ "$($DOCKER_CMD ps -q -a -f name=$DB_CONTAINER_NAME)" ]; then

  # If we found an existing but stopped container, we execute the `start` command.
  # `$DOCKER_CMD start "$DB_CONTAINER_NAME"`: This command starts the existing container with the specified name.
  $DOCKER_CMD start "$DB_CONTAINER_NAME"
  echo "Existing database container '$DB_CONTAINER_NAME' started"

  # We then exit successfully with code 0, as our job is done.
  exit 0
fi

# This `if` statement is a security check to prevent using a weak, default password.
# `[ "$DB_PASSWORD" = "password" ]`: This is a string comparison. It checks if the `DB_PASSWORD` variable,
# which we extracted from the `.env` file, is exactly equal to the string "password".
# The double quotes around the variable are a good practice to prevent errors if the variable is empty.
if [ "$DB_PASSWORD" = "password" ]; then

  # If the password is the default, we print a warning message to the user.
  echo "You are using the default database password"

  # The `read` command prompts the user for input.
  # `-p "..."`: Displays the prompt string to the user.
  # `-r`: Prevents backslash interpretation.
  # `REPLY`: The user's input is stored in this variable.
  read -p "Should we generate a random password for you? [y/N]: " -r REPLY

  # This `if` statement checks if the user's response was NOT "y" or "Y".
  # `! [[ $REPLY =~ ^[Yy]$ ]]`: We use the same regular expression from before to check for a 'yes' answer.
  # The `!` negates it, so the block runs if they answered anything else.
  if ! [[ $REPLY =~ ^[Yy]$ ]]; then

    # If the user declines, we print a message telling them what they need to do manually.
    echo "Please change the default password in the .env file and try again"

    # We exit the script with an error code because we cannot proceed with the insecure password.
    exit 1
  fi

  # If the user agreed to generate a new password, this line creates one.
  # `$(...)`: This is command substitution, its output will be assigned to the `DB_PASSWORD` variable.
  # Let's trace the command pipeline:
  # 1. `openssl rand -base64 12`: This uses the OpenSSL toolkit to generate 12 bytes of random data (`-rand`)
  #    and then encode it using Base64 (`-base64`), resulting in a cryptographically strong random string.
  # 2. `tr '+/' '-_'`: The Base64 output can contain `+` and `/` characters, which can cause issues in URLs.
  #    The `tr` (translate) command pipes the output from `openssl` and replaces all `+` and `/` characters
  #    with URL-safe `-` and `_` characters, respectively.
  # The result is a secure, URL-safe random password which overwrites the old "password" value in the `DB_PASSWORD` variable.
  DB_PASSWORD=$(openssl rand -base64 12 | tr '+/' '-_')

  # This command updates the `.env` file directly on the file system with the newly generated password.
  # The shell (`bash`) has two main types of quotes:
  # - Single quotes `'...'`: Preserve the literal value of every character inside. No variable expansion happens.
  # - Double quotes `"`...`"`: Allow for variable expansion (`$VAR`), command substitution (`$(...)`), and other special features.
  # Because the command is in double quotes, the shell processes it first. It sees `$DB_PASSWORD` and replaces
  # it with its value. The final command that gets passed to the `sed` program is: "s#:password@#:kQxYz123!@#"
  #
  #   - `s`: The substitute command. It tells `sed` its job is to find and replace text.
  #
  #   - `#`: The "delimiter". This character's only job is to separate the parts of the `s` command.
  #          The `sed` utility is designed to let you use almost any character for this. The first character
  #          after the `s` automatically becomes the delimiter for the rest of the command. While `/` is the
  #          traditional choice, choosing a character like `#` is a common technique when your text contains
  #          slashes (like in a URL or file path), as it makes the command much cleaner to read.
  #
  #   - `find pattern`: `:password@`. This is the literal text `sed` will search for.
  #     - The `:` and `@` here are not special operators; they are just literal characters. The script is
  #       looking for the exact substring ":password@" which is part of the default, insecure DATABASE_URL.
  #
  #   - `replace pattern`: `:$DB_PASSWORD@`. This is the text that will replace the found pattern.
  #     - The `:` and `@` are again just literal characters that are part of the replacement string,
  #       ensuring the new URL has the correct format (e.g., ":kQxYz123!@").
  #
  # ` .env`: This is the target file that `sed` will modify in-place (due to the `-i` flag).
  sed -i '' "s#:password@#:$DB_PASSWORD@#" .env
fi

# This is the final command that creates and starts the new PostgreSQL database container.
# It only runs if the previous checks found no existing running or stopped container with the same name.
#
# `$DOCKER_CMD run`: This is the core command to create and run a new container.
#   - `$DOCKER_CMD`: This uses the variable we set earlier, which will be either "docker" or "podman".
#   - `run`: The subcommand to execute.
#
# `-d`: The "detach" flag. This runs the container in the background and prints the new container ID.
#      Without this, the terminal would be attached to the container's logs, and the script would not finish.
#
# `\`: The backslash at the end of a line is a line continuation character. It tells the shell that
#    the command is not finished and continues on the next line. This is used purely for readability
#    to break up a very long command into logical parts.
$DOCKER_CMD run -d \

  # `--name`: This flag assigns a specific, human-readable name to the container.
  # `$DB_CONTAINER_NAME`: We use the variable we constructed earlier (e.g., "my-db-postgres").
  # This makes it easy to reference the container later (e.g., to start or stop it).
  --name $DB_CONTAINER_NAME \

  # `-e`: This flag sets an "environment variable" inside the container. The `postgres` Docker image
  # uses these specific environment variables to configure the initial database setup.
  # `POSTGRES_USER="postgres"`: Sets the default superuser for the new database. "postgres" is the standard default.
  -e POSTGRES_USER="postgres" \

  # This sets the password for the `POSTGRES_USER`.
  # `"$DB_PASSWORD"`: We pass the password we either read from `.env` or randomly generated. The double
  # quotes are important to handle any special characters the password might contain.
  -e POSTGRES_PASSWORD="$DB_PASSWORD" \

  # This sets the name of the initial database to be created when the container first starts.
  # `"$DB_NAME"`: We use the database name we parsed from the `DATABASE_URL`.
  -e POSTGRES_DB="$DB_NAME" \

  # `-p`: This is the "publish" or "port-mapping" flag. It connects a port on your local machine (the host)
  # to a port inside the container. The format is `host_port:container_port`.
  # `"$DB_PORT":5432`: This maps the port number from your `DATABASE_URL` (e.g., 5432) on your local machine
  # to port 5432 inside the container, which is the standard port PostgreSQL listens on.
  # This is what allows your T3 app running on `localhost` to connect to the database inside the container.
  -p "$DB_PORT":5432 \

  # This is the name of the Docker Image to use as the blueprint for the container.
  # `docker.io/postgres`: This tells the container runtime to use the official `postgres` image
  # from Docker Hub. If you don't have this image locally, it will be automatically downloaded.
  # If this is successful then the script will print a message to the user.
  docker.io/postgres && echo "Database container '$DB_CONTAINER_NAME' was successfully created"
