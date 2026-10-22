# Observations documented without design changes

The user requested exact restoration, so these are not implemented:

- The approved light/sand signature text over the expanded teal dot does not meet WCAG AA contrast thresholds. The small footer text is also marginally below AA (approximately 4.47:1). The same contrast findings occur in the supplied HTML. No colours, weights or font sizes were changed to conceal them.
- Physical iOS Safari and Android hardware testing remains outside the local Chromium/device-emulation evidence. No device-specific restyling was guessed at.
- Arbitrary new page compositions outside the eleven original designs are not part of the visual-parity acceptance set. Existing custom data remains preserved; introducing a new creative layout requires separate authorization.
- The original preview contact form does not send mail. Backend/SMTP delivery and production publishing are not claimed or exercised.

Do not apply improvements from this file without a separate user instruction.
