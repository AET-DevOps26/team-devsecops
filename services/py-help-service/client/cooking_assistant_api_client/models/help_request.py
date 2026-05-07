from __future__ import annotations

from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, TypeVar

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

if TYPE_CHECKING:
    from ..models.recipe import Recipe
    from ..models.user_profile import UserProfile


T = TypeVar("T", bound="HelpRequest")


@_attrs_define
class HelpRequest:
    """
    Attributes:
        prompt (str):
        profile (UserProfile | Unset):
        recipe (Recipe | Unset):
    """

    prompt: str
    profile: UserProfile | Unset = UNSET
    recipe: Recipe | Unset = UNSET
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        prompt = self.prompt

        profile: dict[str, Any] | Unset = UNSET
        if not isinstance(self.profile, Unset):
            profile = self.profile.to_dict()

        recipe: dict[str, Any] | Unset = UNSET
        if not isinstance(self.recipe, Unset):
            recipe = self.recipe.to_dict()

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "prompt": prompt,
            }
        )
        if profile is not UNSET:
            field_dict["profile"] = profile
        if recipe is not UNSET:
            field_dict["recipe"] = recipe

        return field_dict

    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        from ..models.recipe import Recipe
        from ..models.user_profile import UserProfile

        d = dict(src_dict)
        prompt = d.pop("prompt")

        _profile = d.pop("profile", UNSET)
        profile: UserProfile | Unset
        if isinstance(_profile, Unset):
            profile = UNSET
        else:
            profile = UserProfile.from_dict(_profile)

        _recipe = d.pop("recipe", UNSET)
        recipe: Recipe | Unset
        if isinstance(_recipe, Unset):
            recipe = UNSET
        else:
            recipe = Recipe.from_dict(_recipe)

        help_request = cls(
            prompt=prompt,
            profile=profile,
            recipe=recipe,
        )

        help_request.additional_properties = d
        return help_request

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
