from __future__ import annotations

from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, TypeVar

from attrs import define as _attrs_define

if TYPE_CHECKING:
    from ..models.user_preferences import UserPreferences


T = TypeVar("T", bound="UserProfile")


@_attrs_define
class UserProfile:
    """
    Attributes:
        username (str):
        preferences (UserPreferences):
    """

    username: str
    preferences: UserPreferences

    def to_dict(self) -> dict[str, Any]:
        username = self.username

        preferences = self.preferences.to_dict()

        field_dict: dict[str, Any] = {}

        field_dict.update(
            {
                "username": username,
                "preferences": preferences,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        from ..models.user_preferences import UserPreferences

        d = dict(src_dict)
        username = d.pop("username")

        preferences = UserPreferences.from_dict(d.pop("preferences"))

        user_profile = cls(
            username=username,
            preferences=preferences,
        )

        return user_profile
