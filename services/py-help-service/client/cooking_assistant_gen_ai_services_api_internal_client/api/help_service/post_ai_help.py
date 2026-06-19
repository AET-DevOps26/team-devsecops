from http import HTTPStatus
from typing import Any

import httpx

from ... import errors
from ...client import AuthenticatedClient, Client
from ...models.error_response import ErrorResponse
from ...models.help_request_forwarded import HelpRequestForwarded
from ...models.help_response import HelpResponse
from ...types import Response


def _get_kwargs(
    *,
    body: HelpRequestForwarded,
    x_internal_timestamp: str,
    x_internal_signature: str,
) -> dict[str, Any]:
    headers: dict[str, Any] = {}
    headers["X-Internal-Timestamp"] = x_internal_timestamp

    headers["X-Internal-Signature"] = x_internal_signature

    _kwargs: dict[str, Any] = {
        "method": "post",
        "url": "/ai/help",
    }

    _kwargs["json"] = body.to_dict()

    headers["Content-Type"] = "application/json"

    _kwargs["headers"] = headers
    return _kwargs


def _parse_response(
    *, client: AuthenticatedClient | Client, response: httpx.Response
) -> ErrorResponse | HelpResponse | None:
    if response.status_code == 200:
        response_200 = HelpResponse.from_dict(response.json())

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

    if response.status_code == 504:
        response_504 = ErrorResponse.from_dict(response.json())

        return response_504

    if client.raise_on_unexpected_status:
        raise errors.UnexpectedStatus(response.status_code, response.content)
    else:
        return None


def _build_response(
    *, client: AuthenticatedClient | Client, response: httpx.Response
) -> Response[ErrorResponse | HelpResponse]:
    return Response(
        status_code=HTTPStatus(response.status_code),
        content=response.content,
        headers=response.headers,
        parsed=_parse_response(client=client, response=response),
    )


def sync_detailed(
    *,
    client: AuthenticatedClient | Client,
    body: HelpRequestForwarded,
    x_internal_timestamp: str,
    x_internal_signature: str,
) -> Response[ErrorResponse | HelpResponse]:
    """Process contextual help request via LLM

     Receives a cooking query bundled with rich user profile constraints and active recipe schemas to
    build safe prompts.

    Args:
        x_internal_timestamp (str):
        x_internal_signature (str):
        body (HelpRequestForwarded):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[ErrorResponse | HelpResponse]
    """

    kwargs = _get_kwargs(
        body=body,
        x_internal_timestamp=x_internal_timestamp,
        x_internal_signature=x_internal_signature,
    )

    response = client.get_httpx_client().request(
        **kwargs,
    )

    return _build_response(client=client, response=response)


def sync(
    *,
    client: AuthenticatedClient | Client,
    body: HelpRequestForwarded,
    x_internal_timestamp: str,
    x_internal_signature: str,
) -> ErrorResponse | HelpResponse | None:
    """Process contextual help request via LLM

     Receives a cooking query bundled with rich user profile constraints and active recipe schemas to
    build safe prompts.

    Args:
        x_internal_timestamp (str):
        x_internal_signature (str):
        body (HelpRequestForwarded):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        ErrorResponse | HelpResponse
    """

    return sync_detailed(
        client=client,
        body=body,
        x_internal_timestamp=x_internal_timestamp,
        x_internal_signature=x_internal_signature,
    ).parsed


async def asyncio_detailed(
    *,
    client: AuthenticatedClient | Client,
    body: HelpRequestForwarded,
    x_internal_timestamp: str,
    x_internal_signature: str,
) -> Response[ErrorResponse | HelpResponse]:
    """Process contextual help request via LLM

     Receives a cooking query bundled with rich user profile constraints and active recipe schemas to
    build safe prompts.

    Args:
        x_internal_timestamp (str):
        x_internal_signature (str):
        body (HelpRequestForwarded):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[ErrorResponse | HelpResponse]
    """

    kwargs = _get_kwargs(
        body=body,
        x_internal_timestamp=x_internal_timestamp,
        x_internal_signature=x_internal_signature,
    )

    response = await client.get_async_httpx_client().request(**kwargs)

    return _build_response(client=client, response=response)


async def asyncio(
    *,
    client: AuthenticatedClient | Client,
    body: HelpRequestForwarded,
    x_internal_timestamp: str,
    x_internal_signature: str,
) -> ErrorResponse | HelpResponse | None:
    """Process contextual help request via LLM

     Receives a cooking query bundled with rich user profile constraints and active recipe schemas to
    build safe prompts.

    Args:
        x_internal_timestamp (str):
        x_internal_signature (str):
        body (HelpRequestForwarded):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        ErrorResponse | HelpResponse
    """

    return (
        await asyncio_detailed(
            client=client,
            body=body,
            x_internal_timestamp=x_internal_timestamp,
            x_internal_signature=x_internal_signature,
        )
    ).parsed
