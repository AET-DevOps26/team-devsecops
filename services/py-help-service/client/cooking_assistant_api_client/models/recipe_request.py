from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar

from attrs import define as _attrs_define

T = TypeVar("T", bound="RecipeRequest")


@_attrs_define
class RecipeRequest:
    """
    Attributes:
        prompt (str):
    """

    prompt: str

    def to_dict(self) -> dict[str, Any]:
        prompt = self.prompt

        field_dict: dict[str, Any] = {}

        field_dict.update(
            {
                "prompt": prompt,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        d = dict(src_dict)
        prompt = d.pop("prompt")

        recipe_request = cls(
            prompt=prompt,
        )

        return recipe_request
