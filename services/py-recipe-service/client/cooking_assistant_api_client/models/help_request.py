from __future__ import annotations

from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, TypeVar

from attrs import define as _attrs_define

if TYPE_CHECKING:
    from ..models.recipe_input import RecipeInput


T = TypeVar("T", bound="HelpRequest")


@_attrs_define
class HelpRequest:
    """
    Attributes:
        recipe (RecipeInput):
        prompt (str):
    """

    recipe: RecipeInput
    prompt: str

    def to_dict(self) -> dict[str, Any]:
        recipe = self.recipe.to_dict()

        prompt = self.prompt

        field_dict: dict[str, Any] = {}

        field_dict.update(
            {
                "recipe": recipe,
                "prompt": prompt,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        from ..models.recipe_input import RecipeInput

        d = dict(src_dict)
        recipe = RecipeInput.from_dict(d.pop("recipe"))

        prompt = d.pop("prompt")

        help_request = cls(
            recipe=recipe,
            prompt=prompt,
        )

        return help_request
