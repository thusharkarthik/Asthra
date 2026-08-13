from shared_schemas import PaginatedResponse, PaginationMeta, PaginationParams


def test_pagination_params_creation():
    params = PaginationParams(limit=50, offset=10)

    assert params.limit == 50
    assert params.offset == 10


def test_paginated_response_creation():
    response = PaginatedResponse[int](
        data=[1, 2],
        pagination=PaginationMeta(limit=2, offset=0, count=2, total=10, has_next=True),
    )

    assert response.success is True
    assert response.pagination.has_next is True
