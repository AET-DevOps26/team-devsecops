from enum import Enum


class UserPreferencesLanguage(str, Enum):
    DE = "de"
    EN = "en"

    def __str__(self) -> str:
        return str(self.value)
