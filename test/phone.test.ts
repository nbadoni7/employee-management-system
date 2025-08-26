import { sgPhoneRegex } from "../src/utils/phone";

describe("sgPhoneRegex", () => {
    const valids = [
        // plain 8-digit numbers starting with 6/8/9
        "61234567",
        "81234567",
        "91234567",
        // +65 (no space)
        "+6561234567",
        "+6581234567",
        "+6591234567",
        // +65 with single space
        "+65 61234567",
        "+65 81234567",
        "+65 91234567",
    ];

    const invalids = [
        // wrong starting digit
        "71234567",
        "51234567",
        "01234567",
        // wrong length
        "9123456",      // 7 digits
        "912345678",    // 9 digits
        "+65 9123456",  // 7 digits with +65
        "+65 912345678",
        // country code without '+'
        "6591234567",
        "65 91234567",
        // extra whitespace or characters (end/start)
        "91234567 ",
        " 91234567",
        "+65  91234567", // double space (regex only allows optional single whitespace)
        // punctuation / formatting not allowed by regex
        "9123-4567",
        "(+65) 91234567",
        "+65-91234567",
        "9a234567",
        // embedded valid number inside a longer string (anchors should reject)
        "xx91234567yy",
    ];

    test.each(valids)("matches valid: %s", (value) => {
        expect(sgPhoneRegex.test(value)).toBe(true);
    });

    test.each(invalids)("rejects invalid: %s", (value) => {
        expect(sgPhoneRegex.test(value)).toBe(false);
    });

    test("is anchored (no partial matches)", () => {
        // Should not match if extra chars are appended/prepended
        expect("foo 91234567 bar".match(sgPhoneRegex)).toBeNull();
    });

    test("allows exactly one optional whitespace after +65", () => {
        expect(sgPhoneRegex.test("+65 91234567")).toBe(true); // single space OK
        expect(sgPhoneRegex.test("+65\t91234567")).toBe(true); // \s covers tab too
        expect(sgPhoneRegex.test("+65  91234567")).toBe(false); // double space not allowed
    });
});
