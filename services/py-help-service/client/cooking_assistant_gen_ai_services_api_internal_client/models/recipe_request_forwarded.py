from __future__ import annotations

from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, TypeVar

from attrs import define as _attrs_define

if TYPE_CHECKING:
    from ..models.user_profile import UserProfile


T = TypeVar("T", bound="RecipeRequestForwarded")


@_attrs_define
class RecipeRequestForwarded:
    """
    Attributes:
        profile (UserProfile):
        prompt (str):
    """

    profile: UserProfile
    prompt: str

    def to_dict(self) -> dict[str, Any]:
        profile = self.profile.to_dict()

        prompt = self.prompt

        field_dict: dict[str, Any] = {}

        field_dict.update(
            {
                "profile": profile,
                "prompt": prompt,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        from ..models.user_profile import UserProfile

        d = dict(src_dict)
        profile = UserProfile.from_dict(d.pop("profile"))

        prompt = d.pop("prompt")

        recipe_request_forwarded = cls(
            profile=profile,
            prompt=prompt,
        )

        return recipe_request_forwarded
