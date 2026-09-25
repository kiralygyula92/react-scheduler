# Security policy

## Supported versions

| Version | Supported                                                   |
| ------- | ----------------------------------------------------------- |
| 1.x     | Yes — fixes are released on the latest 1.x minor as a patch |
| < 1.0   | Never published                                             |

When a new major ships, the previous major receives security fixes only, for a period announced with the new release.

## Reporting a vulnerability

Report privately through GitHub: open the repository's **Security** tab and choose **Report a vulnerability** (GitHub's private vulnerability reporting). The report is visible only to the maintainers until a fix is released.

Please do not open a public issue for a vulnerability, and do not include a working exploit against a third party's deployment.

A report is most useful with:

- the version of `@react-schedulerkit/react-scheduler` and of React;
- what an attacker can do, and what they need first;
- a minimal reproduction, ideally a failing test.

You can expect an acknowledgement within a week. If a report turns out to affect a dependency rather than this package, it is forwarded and the reporter is told where it went.
