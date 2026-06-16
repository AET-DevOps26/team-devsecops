from __future__ import annotations

from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, TypeVar

from attrs import define as _attrs_define

from ..types import UNSET, Unset

if TYPE_CHECKING:
    from ..models.recipe_input import RecipeInput
    from ..models.user_profile import UserProfile


T = TypeVar("T", bound="HelpRequestForwarded")


@_attrs_define
class HelpRequestForwarded:
    """
    Attributes:
        profile (UserProfile):
        prompt (str):
        recipe (RecipeInput | Unset):
    """

    profile: UserProfile
    prompt: str
    recipe: RecipeInput | Unset = UNSET

    def to_dict(self) -> dict[str, Any]:
        profile = self.profile.to_dict()

        prompt = self.prompt

        recipe: dict[str, Any] | Unset = UNSET
        if not isinstance(self.recipe, Unset):
            recipe = self.recipe.to_dict()

        field_dict: dict[str, Any] = {}

        field_dict.update(
            {
                "profile": profile,
                "prompt": prompt,
            }
        )
        if recipe is not UNSET:
            field_dict["recipe"] = recipe

        return field_dict

    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        from ..models.recipe_input import RecipeInput
        from ..models.user_profile import UserProfile

        d = dict(src_dict)
        profile = UserProfile.from_dict(d.pop("profile"))

        prompt = d.pop("prompt")

        _recipe = d.pop("recipe", UNSET)
        recipe: RecipeInput | Unset
        if isinstance(_recipe, Unset):
            recipe = UNSET
        else:
            recipe = RecipeInput.from_dict(_recipe)

        help_request_forwarded = cls(
            profile=profile,
            prompt=prompt,
            recipe=recipe,
        )

        return help_request_forwarded
