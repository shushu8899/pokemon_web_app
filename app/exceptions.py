# Base custom exception class with a status code and detail message
class ServiceException(Exception):
    def __init__(self, status_code: int, detail: str):
        self.status_code = status_code
        self.detail = detail
        super().__init__(detail)

class APIStatusError(Exception):
    def __init__(self, status_code: int, message: str, response=None, body=None):
        self.status_code = status_code
        self.message = message
        self.response = response
        self.body = body
        super().__init__(self.message)