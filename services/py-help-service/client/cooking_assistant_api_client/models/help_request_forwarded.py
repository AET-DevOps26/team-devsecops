from __future__ import annotations

from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, TypeVar

from attrs import define as _attrs_define
from attrs import field as _attrs_field

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
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        profile = self.profile.to_dict()

        recipe = self.recipe.to_dict()

        prompt = self.prompt

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
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

        help_request_forwarded.additional_properties = d
        return help_request_forwarded

    @property
    def additional_keys(self) -> list[str]:
        return list(self.additional_properties.keys())

    def __getitem__(self, key: str) -> Any:
        return self.additional_properties[key]

    def __setitem__(self, key: str, value: Any) -> None:
        self.additional_properties[key] = value

    def __delitem__(self, key: str) -> None:
        del self.additional_properties[key]

    def __contains__(self, key: str) -> bool:
        return key in self.additional_properties
