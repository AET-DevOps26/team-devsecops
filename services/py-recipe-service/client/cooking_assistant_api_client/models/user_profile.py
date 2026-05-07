from __future__ import annotations

from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, TypeVar

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

if TYPE_CHECKING:
    from ..models.user_profile_preferences import UserProfilePreferences


T = TypeVar("T", bound="UserProfile")


@_attrs_define
class UserProfile:
    """
    Attributes:
        id (int):
        username (str | Unset):
        password (str | Unset):
        preferences (UserProfilePreferences | Unset):
    """

    id: int
    username: str | Unset = UNSET
    password: str | Unset = UNSET
    preferences: UserProfilePreferences | Unset = UNSET
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        id = self.id

        username = self.username

        password = self.password

        preferences: dict[str, Any] | Unset = UNSET
        if not isinstance(self.preferences, Unset):
            preferences = self.preferences.to_dict()

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "id": id,
            }
        )
        if username is not UNSET:
            field_dict["username"] = username
        if password is not UNSET:
            field_dict["password"] = password
        if preferences is not UNSET:
            field_dict["preferences"] = preferences

        return field_dict

    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        from ..models.user_profile_preferences import UserProfilePreferences

        d = dict(src_dict)
        id = d.pop("id")

        username = d.pop("username", UNSET)

        password = d.pop("password", UNSET)

        _preferences = d.pop("preferences", UNSET)
        preferences: UserProfilePreferences | Unset
        if isinstance(_preferences, Unset):
            preferences = UNSET
        else:
            preferences = UserProfilePreferences.from_dict(_preferences)

        user_profile = cls(
            id=id,
            username=username,
            password=password,
            preferences=preferences,
        )

        user_profile.additional_properties = d
        return user_profile

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
