# BibleQuest diagnostic codes

User-visible failures use stable codes so connection failures can be separated from application failures.

| Code | Meaning |
| --- | --- |
| BQ-NET-001 | Browser/device reports offline |
| BQ-NET-002 | Device reports online but BibleQuest host cannot be reached |
| BQ-AUTH-001 | Sign-in/session required |
| BQ-AUTH-002 | Permission denied |
| BQ-INP-001 | Invalid user input |
| BQ-SRV-429 | Server rate limited the request |
| BQ-SRV-500 | Server returned a 5xx-class failure |
| BQ-DATA-001 | Data request failed while connectivity was reachable |
| BQ-DATA-002 | Data request timed out while connectivity was reachable |
| BQ-MOD-001 | Feature module failed to initialize |
| BQ-MOD-002 | Feature module initialization timed out |
| BQ-MOD-003 | Required script/style resource failed to load |
| BQ-APP-001 | JavaScript/runtime exception |
| BQ-APP-002 | Unhandled asynchronous application failure |
| BQ-UI-001 | Main-thread UI stall/freeze detected |
| BQ-UNK-001 | Failure could not be classified |

`navigator.onLine` is not treated as sufficient evidence. Network-sensitive failures run a cache-busting same-origin connectivity probe before BibleQuest labels the error as a connection problem. A real main-thread stall is always classified as `BQ-UI-001` because a slow network request should not block the browser UI thread.
