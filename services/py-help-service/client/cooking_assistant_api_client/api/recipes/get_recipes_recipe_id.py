from http import HTTPStatus
from typing import Any
from urllib.parse import quote

import httpx

from ... import errors
from ...client import AuthenticatedClient, Client
from ...models.error_response import ErrorResponse
from ...models.recipe import Recipe
from ...types import Response


def _get_kwargs(
    recipe_id: int,
) -> dict[str, Any]:

    _kwargs: dict[str, Any] = {
        "method": "get",
        "url": "/recipes/{recipe_id}".format(
            recipe_id=quote(str(recipe_id), safe=""),
        ),
    }

    return _kwargs


def _parse_response(*, client: AuthenticatedClient | Client, response: httpx.Response) -> ErrorResponse | Recipe | None:
    if response.status_code == 200:
        response_200 = Recipe.from_dict(response.json())

        return response_200

    if response.status_code == 400:
        response_400 = ErrorResponse.from_dict(response.json())

        return response_400

    if response.status_code == 401:
        response_401 = ErrorResponse.from_dict(response.json())

        return response_401

    if response.status_code == 403:
        response_403 = ErrorResponse.from_dict(response.json())

        return response_403

    if response.status_code == 404:
        response_404 = ErrorResponse.from_dict(response.json())

        return response_404

    if client.raise_on_unexpected_status:
        raise errors.UnexpectedStatus(response.status_code, response.content)
    else:
        return None


def _build_response(
    *, client: AuthenticatedClient | Client, response: httpx.Response
) -> Response[ErrorResponse | Recipe]:
    return Response(
        status_code=HTTPStatus(response.status_code),
        content=response.content,
        headers=response.headers,
        parsed=_parse_response(client=client, response=response),
    )


def sync_detailed(
    recipe_id: int,
    *,
    client: AuthenticatedClient,
) -> Response[ErrorResponse | Recipe]:
    """Get a specific recipe by ID

    Args:
        recipe_id (int):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[ErrorResponse | Recipe]
    """

    kwargs = _get_kwargs(
        recipe_id=recipe_id,
    )

    response = client.get_httpx_client().request(
        **kwargs,
    )

    return _build_response(client=client, response=response)


def sync(
    recipe_id: int,
    *,
    client: AuthenticatedClient,
) -> ErrorResponse | Recipe | None:
    """Get a specific recipe by ID

    Args:
        recipe_id (int):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        ErrorResponse | Recipe
    """

    return sync_detailed(
        recipe_id=recipe_id,
        client=client,
    ).parsed


async def asyncio_detailed(
    recipe_id: int,
    *,
    client: AuthenticatedClient,
) -> Response[ErrorResponse | Recipe]:
    """Get a specific recipe by ID

    Args:
        recipe_id (int):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[ErrorResponse | Recipe]
    """

    kwargs = _get_kwargs(
        recipe_id=recipe_id,
    )

    response = await client.get_async_httpx_client().request(**kwargs)

    return _build_response(client=client, response=response)


async def asyncio(
    recipe_id: int,
    *,
    client: AuthenticatedClient,
) -> ErrorResponse | Recipe | None:
    """Get a specific recipe by ID

    Args:
        recipe_id (int):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        ErrorResponse | Recipe
    """

    return (
        await asyncio_detailed(
            recipe_id=recipe_id,
            client=client,
        )
    ).parsed
