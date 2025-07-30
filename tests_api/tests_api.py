
# --- Purpose of this file ---
# This file is for conducting integration or end-to-end (E2E) tests on this T3 application's API.
# It simulates an external client (one that is NOT using the tRPC client) making a direct HTTP request.
# This is crucial for verifying that the API is correctly exposed to the public internet and behaves as expected.
# We use Python and the `requests` library here, but this could be any language or tool (e.g., cURL, Postman).

# Imports the `requests` library, which is the standard Python library for making HTTP requests.
# It allows us to easily send GET, POST, etc., requests to web servers.
import requests

# Defines a constant for the base URL of your API running on your local development machine.
# - "http://localhost:3000": The default address for a Next.js development server.
# - "/api": The standard folder where Next.js API routes are served from.
BASE_URL = "http://localhost:3000/api"

# Defines a test function. Test runners like `pytest` will automatically discover and run
# any function whose name starts with `test_`. The function name describes its purpose:
# to test the `getAll` endpoint for tasks.
def test_get_all_tasks():
    
    # This is the core action of the test. It sends an HTTP GET request to a specific URL.
    # The URL is constructed using an f-string. Let's break down the endpoint:
    # - `{BASE_URL}`: Our defined base URL.
    # - `/trpc`: The path where the tRPC handler is mounted.
    # - `/task.getAll`: This is the crucial part. tRPC automatically exposes your procedures at a predictable
    #   URL path. `task` corresponds to the `taskRouter`, and `getAll` corresponds to the `getAll` procedure.
    # The result of this request (status code, headers, JSON body, etc.) is stored in the `response` object.
    response = requests.get(f"{BASE_URL}/trpc/task.getAll")
    
    # This is the assertion. It's a check that must be true for the test to pass.
    # `response.status_code` contains the HTTP status code returned by the server.
    # We `assert` that the status code is `200`, which is the standard code for "OK" (a successful request).
    # If the status code is anything else (e.g., 404 Not Found, 500 Internal Server Error), the test will fail.
    assert response.status_code == 200
