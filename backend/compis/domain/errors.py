class DomainError(Exception):
    status_code = 400

    def __init__(self, message: str, code: str | None = None) -> None:
        super().__init__(message)
        self.message = message
        self.code = code


class ValidationError(DomainError):
    status_code = 400


class AuthenticationError(DomainError):
    status_code = 401


class PermissionDeniedError(DomainError):
    status_code = 403


class NotFoundError(DomainError):
    status_code = 404


class ConflictError(DomainError):
    status_code = 409


class RateLimitError(DomainError):
    status_code = 429


class PaymentGatewayError(DomainError):
    status_code = 502
