import logging

from app.core.request_context import get_request_id


class RequestIdFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        record.request_id = get_request_id() or "-"
        return True


def configure_logging() -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s [%(name)s] [request_id=%(request_id)s] %(message)s",
    )
    request_id_filter = RequestIdFilter()
    root_logger = logging.getLogger()
    root_logger.addFilter(request_id_filter)
    for handler in root_logger.handlers:
        handler.addFilter(request_id_filter)
