from enum import Enum


class UserPreferencesLanguage(str, Enum):
    DE = "DE"
    EN = "EN"

    def __str__(self) -> str:
        return str(self.value)
