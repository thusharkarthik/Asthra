class APIClientError(Exception):
    pass


class APIClientTimeoutError(APIClientError):
    pass


class APIClientResponseError(APIClientError):
    def __init__(self, status_code: int, message: str, response_body=None):
        super().__init__(message)
        self.status_code = status_code
        self.response_body = response_body
