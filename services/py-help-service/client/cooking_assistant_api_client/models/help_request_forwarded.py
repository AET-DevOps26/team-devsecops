from __future__ import annotations

from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, TypeVar

from attrs import define as _attrs_define

if TYPE_CHECKING:
    from ..models.recipe_input import RecipeInput
    from ..models.user_profile import UserProfile


T = TypeVar("T", bound="HelpRequestForwarded")


@_attrs_define
class HelpRequestForwarded:
    """
    Attributes:
        profile (UserProfile):
        recipe (RecipeInput):
        prompt (str):
    """

    profile: UserProfile
    recipe: RecipeInput
    prompt: str

    def to_dict(self) -> dict[str, Any]:
        profile = self.profile.to_dict()

        recipe = self.recipe.to_dict()

        prompt = self.prompt

        field_dict: dict[str, Any] = {}

        field_dict.update(
            {
                "profile": profile,
                "recipe": recipe,
                "prompt": prompt,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        from ..models.recipe_input import RecipeInput
        from ..models.user_profile import UserProfile

        d = dict(src_dict)
        profile = UserProfile.from_dict(d.pop("profile"))

        recipe = RecipeInput.from_dict(d.pop("recipe"))

        prompt = d.pop("prompt")

        help_request_forwarded = cls(
            profile=profile,
            recipe=recipe,
            prompt=prompt,
        )

        return help_request_forwarded
