
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}$/;

const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+=[\]{};:'"\\|,.<>\/?]).{8,}$/;

export function isValidEmail(email: string): boolean {
    if (!email || typeof email !== "string") return false;
    return EMAIL_REGEX.test(email.trim());
}

export function isStrongPassword(
    password: string,
    policy?: { minLength?: number; regex?: RegExp }
): boolean {
    if (!password || typeof password !== "string") return false;
    if (policy && policy.regex) return policy.regex.test(password);
    if (policy && policy.minLength && policy.minLength > 8) {
        // build a simple regex requiring the same character classes but with custom min length
        const min = policy.minLength;
        const custom = new RegExp(`^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*()_\\-+=[\\]{};:'"\\\\|,.<>\\/?]).{${min},}$`);
        return custom.test(password);
    }
    return STRONG_PASSWORD_REGEX.test(password);
}

export default { isValidEmail, isStrongPassword };

