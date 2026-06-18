from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar

from attrs import define as _attrs_define

from ..models.recipe_request_language import RecipeRequestLanguage
from ..types import UNSET, Unset

T = TypeVar("T", bound="RecipeRequest")


@_attrs_define
class RecipeRequest:
    """
    Attributes:
        prompt (str):
        language (RecipeRequestLanguage | Unset): Active UI language; generated recipe content is written in it
    """

    prompt: str
    language: RecipeRequestLanguage | Unset = UNSET

    def to_dict(self) -> dict[str, Any]:
        prompt = self.prompt

        language: str | Unset = UNSET
        if not isinstance(self.language, Unset):
            language = self.language.value

        field_dict: dict[str, Any] = {}

        field_dict.update(
            {
                "prompt": prompt,
            }
        )
        if language is not UNSET:
            field_dict["language"] = language

        return field_dict

    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        d = dict(src_dict)
        prompt = d.pop("prompt")

        _language = d.pop("language", UNSET)
        language: RecipeRequestLanguage | Unset
        if isinstance(_language, Unset):
            language = UNSET
        else:
            language = RecipeRequestLanguage(_language)

        recipe_request = cls(
            prompt=prompt,
            language=language,
        )

        return recipe_request
