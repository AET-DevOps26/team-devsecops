from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar

from attrs import define as _attrs_define

T = TypeVar("T", bound="HelpResponse")


@_attrs_define
class HelpResponse:
    """
    Attributes:
        response (str):
    """

    response: str

    def to_dict(self) -> dict[str, Any]:
        response = self.response

        field_dict: dict[str, Any] = {}

        field_dict.update(
            {
                "response": response,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        d = dict(src_dict)
        response = d.pop("response")

        help_response = cls(
            response=response,
        )

        return help_response
